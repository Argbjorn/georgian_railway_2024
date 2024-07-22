// Initialize the map
const map = L.map('map').setView([42.340275,43.299866], 8);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

// Fetch railway network from overpass-turbo
let railwayNetwork = L.layerGroup();
const link = 'https://overpass-api.de/api/interpreter?data=%20%20%20%20%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%20%20%20%20%2F%2F%20fetch%20area%20%E2%80%9CGeorgia%E2%80%9D%20to%20search%20in%0A%20%20%20%20area%28id%3A3600028699%29-%3E.searchArea%3B%0A%20%20%20%20%2F%2F%20gather%20results%0A%20%20%20%20node%5B%22railway%22%3D%22station%22%5D%5B%22station%22%20%21%3D%20%22subway%22%5D%5B%22station%22%20%21%3D%20%22funicular%22%5D%28area.searchArea%29%3B%0Anwr%5B%22railway%22%3D%22rail%22%5D%5B%22usage%22%21%3D%22industrial%22%5D%5B%22service%22%21%3D%22spur%22%5D%5B%22service%22%21%3D%22yard%22%5D%5B%22service%22%21%3D%22siding%22%5D%28area.searchArea%29%3B%0A%20%20%20%20%2F%2F%20print%20results%0A%20%20%20%20out%20geom%3B'
fetch(link)
.then(response => response.json())
.then(data => {
    data.elements.forEach(element => {
        const polyline = L.polyline(element.geometry);
        railwayNetwork.addLayer(polyline);
    });
});

// Initialize railway network
railwayNetwork.addTo(map);