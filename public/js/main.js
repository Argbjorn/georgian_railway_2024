import { RailwayNetwork } from "./railway-network.js";
import { Route } from "./route.js";
import { routesList } from "./routes-list.js";
import { map } from "./map.js";
import { Station } from "./station.js";
import { stations } from "./stations-list.js";
import { openSidePanelIfClosed } from "./map.js";

// Create a global storage for an active route
let activeRoute = [];

// Create a global storage for all created routes
let routes = [];

// Returns JSON with overpass-turbo data
export async function getOverpassData(query) {
    var result = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
            method: "POST",
            body: "data=" + encodeURIComponent(query)
        },
    ).then(
        (data) => data.json()
    )
    return result;
}

// Creates a route
async function createRoute(routeId) {
    const newRoute = new Route(routeId);
    let route = L.featureGroup();
    const routeData = await getOverpassData(newRoute.query);

    // Sets bounds for fly to bounds
    const b = routeData.elements[0].bounds;
    newRoute.setBounds(L.latLngBounds([b.minlat - 1, b.minlon], [b.maxlat + 1, b.maxlon + 1])); // Corrections are for better pan with an opened sidepanel

    routeData.elements.forEach(async (element) => {
        let stations = [];
        element.members.forEach(async (member) => {
            // Gathers route relation's ways and combine them in an one polyline
            if (member.type == 'way') {
                route.addLayer(L.polyline(member.geometry, newRoute.polylineOptions));
            }
            // Gathers route relation nodes (stations)
            else if (member.type == 'node') {
                stations.push(member.ref);
            }
        });
        // Combines overpass query to gather all the stations data
        let query = "[out:json][timeout:25];(";
        stations.forEach(station => {
            query += "node(" + station + ");"
        });
        query += ");out geom;"
        // Runs overpass query
        const stationData = await getOverpassData(query);
        // Creates all the station markers
        stationData.elements.forEach(element => {
            route.addLayer(L.circleMarker([element.lat, element.lon], newRoute.cirkleMarkerOptions).bindTooltip(getStationName(element), {
                permanent: false,
                direction: 'bottom',
                opacity: 0.9
            }));
        })
    });
    newRoute.setFeatureGroup(route);
    routes.push(newRoute);
    return newRoute
}

function getStationName(data) {
    let stationName;
    if ("tags" in data) {
        if ("name:en" in data.tags) {
            stationName = data.tags["name:en"];
        } else if ("name" in data.tags) {
            stationName = data.tags["name"];
        } else {
            stationName = "unknown station"
        }
    } else {
        stationName = "unknown station"
    }
    return stationName
}

// Returns a new route or existing one 
async function getRoute(routeId) {
    const isRouteExists = currentRoute => currentRoute.id == routeId;
    if (!routes.some(isRouteExists)) {
        return createRoute(routeId);
    } else {
        return routes.find(r => r.id == routeId);
    }
}

// Handles what route (or network) has to be shown/hide on the map
async function toggleRoute(routeId) {
    // Other route is shown on the map (so it has to hide the old one and show the new one)
    if (activeRoute.length != 0 && activeRoute[0].id != routeId) {
        const route = await getRoute(routeId);
        activeRoute[0].hide();
        activeRoute.pop();
        activeRoute.push(route);
        route.show();
        // No routes are shown (so it has to shadow the railway network and show the route)
    } else if (activeRoute.length == 0) {
        let newRoute = await getRoute(routeId);
        railwayNetwork.shadow();
        await newRoute.show();
        activeRoute.push(newRoute);
    }
    // Current route is shown (so it has to hide the route and show the railway network)
    else {
        activeRoute[0].hide();
        activeRoute.pop();
        railwayNetwork.show();
    }
}

function getRouteSchedule(route) {
    let start, end;
    if ("stations" in route) {
        route.stations.forEach(station => {
            if ("role" in station && station.role == "start") {
                start = station.time;
            } else if ("role" in station && station.role == "end") {
                end = station.time;
            }
        })
    }
    let result = []
    if (start != null) {
        result.push(start)
    } else {
        result.push("0")
    }
    if (end != null) {
        result.push(end)
    } else {
        result.push("0")
    }
    if ("frequency" in route) {
        result.push(route.frequency)
    } else {
        result.push("0")
    }

    return result
}

function createRouteTimingString(routeTiming) {
    let str = String();
    const spacer = "\xa0\xa0\xa0\xa0\xa0";
    const arrow = " → ";
    if (routeTiming[0] != "0") {
        str += routeTiming[0]
    } else {
        str += spacer
    }
    str += " → "
    if (routeTiming[1] != "0") {
        str += routeTiming[1]
    } else {
        str += spacer
    }
    if (str == spacer + arrow + spacer) {
        return "There is no schedule data yet"
    } else {
        if (routeTiming[2] != "0") {
            str += spacer + routeTiming[2];
            return str
        }
        return str

    }

}

// Show railway network
export let railwayNetwork = new RailwayNetwork();
railwayNetwork.show();

makeRoutesList(routesList);

// Adds event listeners to routes links
const routeListItems = document.querySelectorAll('.route-list-item');
routeListItems.forEach(element => {
    let routeLink = element.querySelector(".route-link");
    routeLink.addEventListener('click', async () => {
        let routeDetails = element.querySelector('.route-details');
        // Closes all other routes
        routeListItems.forEach(listItem => {
            let otherRouteLink = listItem.querySelector(".route-link");
            let otherRouteDetails = listItem.querySelector(".route-details");
            if (otherRouteLink != routeLink) {
                otherRouteLink.classList.remove('active');
                otherRouteDetails.classList.remove('active');

            }
        })
        routeLink.classList.toggle('active');
        routeDetails.classList.toggle('active');
        await toggleRoute(routeLink.getAttribute('id')).then();
    })
})

function makeRoutesList(routesList) {
    const categories = [["Tbilisi ←→ Batumi (Stadler)", "stadler"],
    ["From/To Tbilisi", "tbilisi"],
    ["From/To Batumi", "batumi"],
    ["From/To Kutaisi", "kutaisi"],
    ["From/To Zestafoni", "zestafoni"]
    ]

    // Creates the main container for the whole routes list
    let parentContainer = document.querySelector(".sidepanel-routes-content");

    // Creates route categories
    for (let i = 0; i < categories.length; i++) {
        let listContainer = document.createElement('div');
        let categoryHeader = document.createElement('h3');
        let listElement = document.createElement('ul');

        parentContainer.appendChild(listContainer);
        listContainer.appendChild(categoryHeader);
        listContainer.appendChild(listElement);

        categoryHeader.innerHTML += categories[i][0];
        listContainer.setAttribute("id", categories[i][1]);
    }

    // Add routes to categories
    routesList.forEach((item) => {
        // Creates list item
        let listItem = document.createElement('li');
        listItem.classList.add('route-list-item');

        // Creates route link
        let routeLink = document.createElement('a');
        routeLink.classList.add('route-link');
        routeLink.setAttribute('id', item.id);

        // Creates span for route reference
        let routeReference = document.createElement('span');
        routeReference.classList.add('route-label');

        // Creates div for details
        let routeDetails = document.createElement('div');
        routeDetails.classList.add('route-details');

        // Creates span for main timing
        let routeTiming = document.createElement('span');
        routeTiming.classList.add("route-timing");

        // Combine all the components
        let listElement = document.querySelector('#' + item.category);
        listElement.appendChild(listItem);
        listItem.appendChild(routeLink);
        listItem.appendChild(routeDetails);
        routeLink.appendChild(routeReference);
        routeDetails.appendChild(routeTiming);

        // Add texts
        routeReference.innerHTML += item.ref;
        routeLink.innerHTML += item["name:en"];
        routeTiming.innerHTML += createRouteTimingString(getRouteSchedule(item));
    })
}

// Adds stations
stations.forEach(station => {
    let newStation = new Station(station.name_en, station.coords, station.type)
    newStation.setDefault();
    newStation.markerDefault.on('click', ev => {
        newStation.setActive();
        renderStationInfo(newStation);
    });
    newStation.markerActive.on('click', ev => {
        newStation.setDefault();
        closeSidepanel();
    });
})

function openSidepanelTab(tab){
    openSidePanelIfClosed();
    document.querySelectorAll('.sidepanel-tab-content').forEach(tab => {tab.classList.remove('active')});
    document.querySelectorAll('.sidebar-tab-link').forEach(tab => {tab.classList.remove('active')});
    document.querySelector('[data-tab-content="' + tab + '"]').classList.add('active');
    document.querySelector('[data-tab-link="' + tab + '"]').classList.add('active');
}

function closeSidepanel(){
    const panel = document.querySelector('#mySidepanel');
    panel.classList.remove('opened');
    panel.classList.add('closed');
}

function renderStationInfo(station) {
    document.querySelector(".station-info").innerHTML = station.name;
    openSidepanelTab('tab-3');
}