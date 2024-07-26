import { getOverpassData } from "./main.js";
import { map } from "./map.js";

export class Route {
    constructor(id) {
        this.id = id;
        this.query = `[out:json][timeout:25]; relation(` + this.id + `); out geom;`;
        this.featureGroup;
        this.bounds;
        this.polylineOptions = {
            stroke: true,
            color: '#E70E02',
            weight: 4
        };
        this.cirkleMarkerOptions = {
            color: "#CA0C02",
            radius: 7,
            weight: 2,
            fill: true,
            fillColor: '#fff',
            fillOpacity: 1.0
        }
    }

    show() {
        this.featureGroup.addTo(map);
        map.fitBounds(this.bounds);
    }

    hide() {
        this.featureGroup.remove();
    }

    setFeatureGroup(featureGroup) {
        this.featureGroup = featureGroup;
    }

    setBounds(bounds) {
        this.bounds = bounds;
    }
}