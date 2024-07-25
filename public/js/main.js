import { RailwayNetwork } from "./railway-network.js";
import { Route } from "./route.js";
import { routesList } from "./routes-list.js";

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
    newRoute.setBounds(L.latLngBounds([b.minlat - 1, b.minlon], [b.maxlat + 1, b.maxlon + 1])); // Corrections are for better pan with an opened sidebar

    routeData.elements.forEach(element => {
        element.members.forEach(async (member) => {
            // Gathers route relation's ways and combine them in an one polyline
            if (member.type == 'way') {
                route.addLayer(L.polyline(member.geometry, { color: 'red' }));
            }
            // Gathers route relation nodes (stations) an creates circle markers witn tooltips
            else if (member.type == 'node') {
                const query = `[out:json][timeout:25]; node(` + member.ref + `); out geom;`;
                const stationData = await getOverpassData(query);
                route.addLayer(L.circleMarker([member.lat, member.lon], { color: "red", radius: 10 }).bindTooltip(stationData.elements[0].tags["name:en"], {
                    permanent: true,
                    direction: 'bottom',
                    opacity: 0.9
                }).openTooltip());
            }
        })
    })
    newRoute.setFeatureGroup(route);
    routes.push(newRoute);
    return newRoute
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
        // No routes are shown (so it has to hide the railway network and show the route)
    } else if (activeRoute.length == 0) {
        let newRoute = await getRoute(routeId);
        await newRoute.show();
        activeRoute.push(newRoute);
        railwayNetwork.hide();
        newRoute.show();
    }
    // Current route is shown (so it has to hide the route and show the railway network)
    else {
        activeRoute[0].hide();
        activeRoute.pop();
        railwayNetwork.show();
    }
}

// Show railway network
export let railwayNetwork = new RailwayNetwork();
railwayNetwork.show();

makeRoutesList(routesList);

// Adds event listeners to routes links
    const routeLinks = document.querySelectorAll('.route-link');
    routeLinks.forEach(element => {
        element.addEventListener('click', async () => {
            routeLinks.forEach(link => {
                if (link != element) {
                    link.classList.remove('active');
                }
            })
            element.classList.toggle('active');
            await toggleRoute(element.getAttribute('id')).then();
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
    let parentContainer = document.querySelector(".sidebar-pane-content");

    // Creates route categories
    for(let i = 0; i < categories.length; i++) {
        let listContainer = document.createElement('div');
        let categoryHeader = document.createElement('p');
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

        // Creates route link
        let routeLink = document.createElement('a');
        routeLink.classList.add('route-link');
        routeLink.setAttribute('id', item.id);

        // Creates span for route reference
        let routeReference = document.createElement('span');
        routeReference.classList.add('route-label');

        // Combine all the components
        let listElement = document.querySelector('#' + item.category);
        listElement.appendChild(listItem);
        listItem.appendChild(routeLink);
        routeLink.appendChild(routeReference);

        // Add texts
        routeReference.innerHTML += item.ref;
        routeLink.innerHTML += item["name:en"];
    })
}

