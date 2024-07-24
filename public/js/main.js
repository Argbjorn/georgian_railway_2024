import { RailwayNetwork } from "./railway-network.js";
import { Route } from "./route.js";

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
    newRoute.setBounds(L.latLngBounds([b.minlat, b.minlon], [b.maxlat, b.maxlon]));

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