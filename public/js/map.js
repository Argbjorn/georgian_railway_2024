// Tile providers
var atlasTiles = L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=fe84be0c72b64292b7e12b685142997a', {
    maxZoom: 19,
    attribution: 'Tiles &copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> | Data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
});
var osmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
});

// Initialize the map
export const map = L.map('map', {
    center: getDefaultMapCenter(),
    zoom: 8,
    layers: [osmTiles]
});

// Tile object for L.control
const tiles = {
    "Standard": osmTiles,
    "Atlas": atlasTiles
};
const overlays = {}

// Initialize layer control
const layerControl = L.control.layers(tiles, overlays, {
    collapsed: false,
    sortLayers: true,
    position: 'topleft'
}).addTo(map);

export function getDefaultMapCenter() {
    return [41.721700, 44.799748];
}