import { getOverpassData } from "./main.js";
import { getDefaultMapCenter } from "./map.js";
import { map } from "./map.js";


export class RailwayNetwork {
    constructor() {
        [this.layerGroup, this.layerGroupShadowed] = this.create(),
        this.polylineOptions = {
            stroke: true,
            color: '#32373B',
            weight: 4
        },
        this.polylineOptionsShadowed = {
            stroke: true,
            color: '#5D6E6F',
            weight: 3
        }
    }

    create() {
        let network = L.layerGroup();
        let networkShadowed = L.layerGroup();
        const query = `[out:json][timeout:25];
                ( area[name="საქართველო"]; )->.searchArea;
                nwr["railway"="rail"]["usage"!="industrial"]["service"!="spur"]["service"!="yard"]["service"!="siding"](area.searchArea);
                out geom;`
        getOverpassData(query)
            .then(data => {
                data.elements.forEach(element => {
                    const polyline = L.polyline(element.geometry, this.polylineOptions);
                    network.addLayer(polyline);
                    const polylineShadowed = L.polyline(element.geometry, this.polylineOptionsShadowed);
                    networkShadowed.addLayer(polylineShadowed);
                });
            });
        return [network, networkShadowed];
    }

    show() {
        this.layerGroupShadowed.remove();
        this.layerGroup.addTo(map);
        map.setView(getDefaultMapCenter(), 8)

    }

    hide() {
        this.layerGroup.remove();
    }

    shadow() {
        this.layerGroup.remove();
        this.layerGroupShadowed.addTo(map);
    }
}