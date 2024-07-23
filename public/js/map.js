// Задаем тайловые сервера
var atlasTiles = L.tileLayer('https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=fe84be0c72b64292b7e12b685142997a', {
    maxZoom: 19,
    attribution: 'Tiles &copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> | Data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
});
var osmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
});

// Initialize the map
const map = L.map('map', {
    center: [42.340275, 43.299866],
    zoom: 8,
    layers: [osmTiles]
});

// Задаем тайловые слои и слои данных для вывода в контрол
const tiles = {
    "Standard": osmTiles,
    "Atlas": atlasTiles
};

const overlays = {}

// Добавляем контрол слоев
const layerControl = L.control.layers(tiles, overlays, {
    collapsed: false,
    sortLayers: true,
    position: 'topleft'
}).addTo(map);



