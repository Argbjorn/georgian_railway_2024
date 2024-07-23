import { getOverpassData } from "./main.js";

export class RailwayNetwork {
    constructor() {
        this.layerGroup = this.create();
    }

    create() {
        let network = L.layerGroup();
        const query = `[out:json][timeout:25];
                ( area[name="საქართველო"]; )->.searchArea;
                nwr["railway"="rail"]["usage"!="industrial"]["service"!="spur"]["service"!="yard"]["service"!="siding"](area.searchArea);
                out geom;`
        getOverpassData(query)
            .then(data => {
                data.elements.forEach(element => {
                    const polyline = L.polyline(element.geometry);
                    network.addLayer(polyline);
                });
            });
        return network;
    }

    show() {
        this.layerGroup.addTo(map);
    }

    hide() {
        this.layerGroup.remove();
        console.log('Removing the railway network');
    }
}