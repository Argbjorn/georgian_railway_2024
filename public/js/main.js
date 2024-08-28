import { RailwayNetwork } from "./railway-network.js";
import { Route } from "./route.js";
import { routesList } from "./routes-list.js";
import { Station } from "./station.js";
import { stations as stationsList } from "./stations-list.js";
import { openSidePanelIfClosed } from "./map.js";
import { map } from "./map.js";

let activeRoute = [];
let routes = [];
export let activeStation = [];
let stations = [];

// Getting data

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

// Map layers

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
                direction: 'top',
                opacity: 0.9
            }));
        })
    });
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
        // No routes are shown (so it has to shadow the railway network and show the route)
    } else if (activeRoute.length == 0) {
        let newRoute = await getRoute(routeId);
        railwayNetwork.shadow();
        stations.forEach(station => {
            station.hide();
        });
        if (activeStation.length > 0) {
            activeStation[0].setActive();
        }
        await newRoute.show();
        activeRoute.push(newRoute);
    }
    // Current route is shown (so it has to hide the route and show the railway network)
    else {
        activeRoute[0].hide();
        stations.forEach(station => {
            station.setDefault();
        });
        if (activeStation.length > 0) {
            activeStation[0].setActive();
        }
        activeRoute.pop();
        railwayNetwork.show();
    }
}

// Shows stations and sets station markers interaction
function showStations() {
    stationsList.forEach(station => {
        let newStation = new Station(station.name_en, station.coords, station.type, station.code);
        stations.push(newStation);
        newStation.setDefault();
        newStation.markerDefault.on('click', () => {
            stations.forEach(station => {
                station.setDefault();
            })
            newStation.setActive();
            activeStation.pop();
            activeStation.push(newStation);
            closeAllStationLines();
            openStationLine(station.code);
            openSidepanelTab('tab-1');
        });
        newStation.markerActive.addEventListener('click', () => {
            newStation.setDefault();
            activeStation.pop();
            if (activeRoute.length > 0) {
                toggleRoute(activeRoute[0].id);
                railwayNetwork.show();
            };
            closeAllStationLines();
            closeRoutes();
        });
    })
}

function hideActiveRoute() {
    activeRoute[0].hide();
    activeRoute.pop();
    railwayNetwork.show();
    stations.forEach(station => {
        station.setDefault();
    });
    closeRoutes();
}

// Handling with routes data

// Returns the station name from raw overpass data, if exists
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

// Returns an sorted by time array with a given route schedule like [[<station1_name>, '17:05'], [<station2_name>, '22:13']]
function getRouteSchedule(route) {
    let schedule = [];
    if ("stations" in route) {
        route.stations.forEach(station => {
            schedule.push([station.code, station.time])
        })
    }
    if (schedule.length > 1) {
        //schedule.sort((a, b) => Date.parse('1970-01-01T' + a[1]) > Date.parse('1970-01-01T' + b[1]) ? 1 : -1);
        return schedule
    } else {
        return "There is no schedule for the route yet"
    }
}

// Returns a schedule string (the whole schedule block for an route) 
function createRouteScheduleString(routeTiming) {
    let scheduleString = '';
    routeTiming.forEach(line => {
        scheduleString += line[1] + ' ' + getStationNameByCode(line[0]) + '<br>'
    })
    return scheduleString
}

// Returns the first, the last station and middle stations of a given route
function getRoutePoints(route) {
    let start, end;
    let middle = [];
    route.stations.forEach(station => {
        if (station.role == "start") {
            start = station.code;
        } else if (station.role == "end") {
            end = station.code;
        } else {
            middle.push(station.code)
        }
    })
    return [start, end, middle]
}

// Returns a name of given station by code
function getStationNameByCode(stationCode) {
    let stationName;
    stationsList.forEach(station => {
        if (station.code == stationCode) {
            stationName = station.name_en;
        }
    })
    if (isSet(stationName)) {
        return stationName;
    } else {
        return 'Unknown (yet) station'
    }
    
}

// Returns time of given route of given station by code
function getRouteTimeByStation(route, stationCode) {
    let routeTime;
    route.stations.forEach(station => {
        if (station.code == stationCode) {
            routeTime = station.time;
        }
    })
    return routeTime;
}

function isSet(s) {
    if (typeof s === 'undefined') {
        return false
    }
    return true
}

// Sidepanel content

// Adds event listeners to routes links
function addRoutesLinksEvents() {
    const routeLines = document.querySelectorAll('.route-line');
    routeLines.forEach(element => {
        let routeLink = element.querySelector(".route-link");
        routeLink.addEventListener('click', async () => {
            let routeSchedule = element.querySelector('.route-schedule');
            // Closes all other routes
            routeLines.forEach(listItem => {
                let otherRouteLink = listItem.querySelector(".route-link");
                let otherRouteSchedule = listItem.querySelector(".route-schedule");
                if (otherRouteLink != routeLink) {
                    otherRouteLink.classList.remove('active');
                    otherRouteSchedule.classList.remove('active');
                }
            })
            routeLink.classList.toggle('active');
            routeSchedule.classList.toggle('active');
            await toggleRoute(routeLink.getAttribute('id')).then();
        })
    })
}

// Creates the full info for the sidepanel about given station: headers, description, arrivals and departures list
async function makeStationInfo(station) {
    let parentContainer = document.createElement('details');
    parentContainer.innerHTML = '';

    let stationHeader = document.createElement('summary');
    let stationBody = document.createElement('div');
    let stationDescription = document.createElement('p');
    let stationArrivals = document.createElement('div');
    let stationDepartures = document.createElement('div');
    let stationPassesThrough = document.createElement('div');

    parentContainer.appendChild(stationHeader);
    parentContainer.appendChild(stationBody);
    stationBody.appendChild(stationDescription);
    stationBody.appendChild(stationDepartures);
    stationBody.appendChild(stationArrivals);
    stationBody.appendChild(stationPassesThrough);

    parentContainer.classList.add('station');
    stationBody.classList.add('station-body');
    stationHeader.classList.add('station-header');
    stationDescription.classList.add('station-description');
    stationDepartures.classList.add('station-routes-list');
    stationArrivals.classList.add('station-routes-list');
    stationPassesThrough.classList.add('station-routes-list');
    parentContainer.setAttribute('id', station.code);

    stationHeader.addEventListener('click', () => {
        if(activeRoute.length > 0) {
            hideActiveRoute();
        }
        if (activeStation.length > 0) {
            activeStation[0].setDefault();
            activeStation.pop()
        }
    })

    stationHeader.innerHTML = station.name_en;

    if (station.description) {
        stationDescription.innerHTML = station.description;
    } else {
        stationDescription.innerHTML = "";
    }

    stationArrivals.innerHTML = '<h4>Arrivals</h4>';
    stationDepartures.innerHTML = '<h4>Departures</h4>';
    stationPassesThrough.innerHTML = '<h4>Passes through</h4>';

    let stationRoutes = getRoutesByStation(station.code);

    if (stationRoutes.length > 0) {
        let arrivals = [];
        let departures = [];
        let passesThrough = [];
        stationRoutes.forEach(route => {
            let routeLine;
            let routePoints = getRoutePoints(route);
            if (station.code == routePoints[0]) {
                routeLine = makeRouteLine(route, station.code, "departure");
                departures.push(routeLine);
            } else if (station.code == routePoints[1]) {
                routeLine = makeRouteLine(route, station.code, "arrival");
                arrivals.push(routeLine);
            } else if (routePoints[2].includes(station.code)) {
                routeLine = makeRouteLine(route, station.code, "through");
                passesThrough.push(routeLine);
            }
        });
        if (arrivals.length == 0) {
            stationArrivals.classList.add('hidden');
        };
        if (departures.length == 0) {
            stationDepartures.classList.add('hidden');
        };
        if (passesThrough.length == 0) {
            stationPassesThrough.classList.add('hidden');
        };
        let arrivalsSorted = arrivals.sort((a, b) => a.time > b.time ? 1 : -1);
        let departuresSorted = departures.sort((a, b) => a.time > b.time ? 1 : -1);
        let passesThroughSorted = passesThrough.sort((a, b) => a.time > b.time ? 1 : -1);
        arrivalsSorted.forEach(a => {
            stationArrivals.appendChild(a.html);
        });
        departuresSorted.forEach(a => {
            stationDepartures.appendChild(a.html);
        });
        passesThroughSorted.forEach(a => {
            stationPassesThrough.appendChild(a.html);
        });
    } else {
        stationDepartures.innerHTML += '<p>There is no schedule yet</p>';
        stationArrivals.innerHTML += '<p>There is no schedule yet</p>';
        stationPassesThrough.classList.add('hidden');
    }
    

    return parentContainer;
}

// Creates html container for given route for given station
function makeRouteLine(route, stationCode, direction) {
    let routeLine = document.createElement('div');
    let routeLink = document.createElement('a');
    let routeTime = document.createElement('div');
    let routeLabel = document.createElement('span');
    let routeDestination = document.createElement('span');
    let routeFrequency = document.createElement('span');
    let routeSchedule = document.createElement('div');
    let routeName = document.createElement('div');

    routeLine.appendChild(routeTime);
    routeLine.appendChild(routeName);
    routeName.appendChild(routeLink);
    routeLink.appendChild(routeLabel);
    routeLink.appendChild(routeDestination);
    routeName.appendChild(routeFrequency);
    routeLine.appendChild(routeSchedule);


    routeLine.classList.add('route-line');
    routeLink.classList.add('route-link');
    routeTime.classList.add('route-time');
    routeLabel.classList.add('route-label');
    routeDestination.classList.add('route-destination');
    routeFrequency.classList.add('route-frequency');
    routeSchedule.classList.add('route-schedule');
    routeName.classList.add('route-name');

    routeLink.setAttribute('id', route.id);

    let time = getRouteTimeByStation(route, stationCode);
    let schedule = createRouteScheduleString(getRouteSchedule(route));

    routeTime.innerHTML = time + ' ';
    routeLabel.innerHTML = route.ref;
    routeFrequency.innerHTML = route.frequency + '<br>';
    routeSchedule.innerHTML = schedule;
    routeSchedule.innerHTML += route.complete ? '' : "<p class='disclaimer'>This route is incomplete, so some train stops aren't in the list. If you have an additional information, change the route on OSM or let me know (see About for contacts).</p>"
    

    let destination;

    if (direction == "departure") {
        destination = getStationNameByCode(getRoutePoints(route)[1])
    } else if (direction == "arrival") {
        destination = getStationNameByCode(getRoutePoints(route)[0])
    } else if (direction == "through") {
        destination = getStationNameByCode(getRoutePoints(route)[0]) + ' ' + '→' + ' ' + getStationNameByCode(getRoutePoints(route)[1])
    }

    routeDestination.innerHTML = destination + ' ';

    return { html: routeLine, time: Date.parse('1970-01-01T' + time) };
}

// Creates stations tab content
async function makeStationsTab() {
    stations.forEach(async (station) => {
        let content = await makeStationInfo(station)
        document.querySelector('.sidepanel-routes-content').appendChild(content);
    })
}

// Sidepanel interactions

// Opens given sidepanel tab
function openSidepanelTab(tab) {
    openSidePanelIfClosed();
    document.querySelectorAll('.sidepanel-tab-content').forEach(tab => { tab.classList.remove('active') });
    document.querySelectorAll('.sidebar-tab-link').forEach(tab => { tab.classList.remove('active') });
    document.querySelector('[data-tab-content="' + tab + '"]').classList.add('active');
    document.querySelector('[data-tab-link="' + tab + '"]').classList.add('active');
}

// Closes sidepanel
function closeSidepanel() {
    const panel = document.querySelector('#mySidepanel');
    panel.classList.remove('opened');
    panel.classList.add('closed');
}

// Returns routes data connected to given station
function getRoutesByStation(stationCode) {
    let routes = [];
    routesList.forEach(route => {
        if ("stations" in route) {
            route.stations.forEach(station => {
                if (station.code == stationCode) {
                    routes.push(route);
                }
            })
        }
    })
    return routes;
}

// Closes all station lines
function closeAllStationLines() {
    let stationLines = document.querySelectorAll('.station');
    stationLines.forEach(stationLine => {
        stationLine.open = false;
    })
}

// Opens given station line
function openStationLine(stationCode) {
    let stationLine = document.querySelector('#' + stationCode);
    stationLine.open = true;
    stationLine.scrollIntoView(true, {behavior: 'smooth'});
}

// Closes route details in the sidepanel
function closeRoutes() {
    let routesLinks = document.querySelectorAll('.route-link');
    let routesSchedules = document.querySelectorAll('.route-schedule');

    routesLinks.forEach(route => {
        route.classList.remove('active');
    });
    routesSchedules.forEach(schedule => {
        schedule.classList.remove('active');
    })
}

// Click on the map
map.addEventListener('click', () => {
    activeStation[0].setDefault();
    closeAllStationLines();
    hideActiveRoute();
})

// Show railway network
export let railwayNetwork = new RailwayNetwork();
railwayNetwork.show();


showStations();
await makeStationsTab();
addRoutesLinksEvents();