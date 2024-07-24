import { getOverpassData } from "./main.js";
import { getDefaultMapCenter } from "./map.js";
import { map } from "./map.js";


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
        map.setView(getDefaultMapCenter(), 8)

    }

    hide() {
        this.layerGroup.remove();
    }
}