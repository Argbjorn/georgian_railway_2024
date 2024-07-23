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

// Returns a new route or existing one 
function getRoute(routeId) {
    const isRouteExists = currentRoute => currentRoute.id == routeId;
    if (!routes.some(isRouteExists)) {
        const newRoute = new Route(routeId);
        routes.push(newRoute);
        return newRoute
    } else {
        return routes.find(r => r.id == routeId)
    }
}

// Handles what route (or network) has to be shown on the map
function toggleRoute(routeId) {
    // Other route is shown on the map
    if (activeRoute.length != 0 && activeRoute[0].id != routeId) {
        const route = getRoute(routeId);
        activeRoute[0].hide();
        activeRoute.pop();
        activeRoute.push(route);
        route.show();
    // No routes are shown
    } else if (activeRoute.length == 0) {
        const route = getRoute(routeId);
        activeRoute.push(route);
        railwayNetwork.hide();
        route.show();
    }
    // Current route is shown
    else {
        activeRoute[0].hide();
        activeRoute.pop();
        railwayNetwork.show();
    }
}

// Show railway network
export let railwayNetwork = new RailwayNetwork();
railwayNetwork.show();

// Click on a route and show the route on the map
const routeLinks = document.querySelectorAll('.route-link');
routeLinks.forEach(element => {
    element.addEventListener('click', () => {
        routeLinks.forEach(link => {
            if (link != element) {
                link.classList.remove('active');
            }
        })
        element.classList.toggle('active');
        toggleRoute(element.getAttribute('id'));
    })
})






