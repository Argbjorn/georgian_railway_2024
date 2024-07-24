import { getOverpassData } from "./main.js";
import { map } from "./map.js";

export class Route {
    constructor(id) {
        this.id = id;
        this.query = `[out:json][timeout:25]; relation(` + this.id + `); out geom;`;
        this.featureGroup;
        this.bounds;
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