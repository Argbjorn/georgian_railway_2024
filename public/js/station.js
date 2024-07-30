import { map } from "./map.js";

const stations = {
    kutaisi: {
        name_en: "Kutaisi",
        coords: [42.2613497, 42.7130275]
    },
    tbilisi: {
        name_en: "Tbilisi",
        coords: [41.7211251, 44.7998129]
    },
    batumi: {
        name_en: "Batumi",
        coords: [41.6585300, 41.6777291]
    }
}

export class Station {
    constructor(name) {
        this.name = name;
        this.marker = L.marker(stations[name].coords);
        this.markerOptions = {
            icon: 'circle-o',
            iconShape: 'marker',
            borderColor: "#c1121f",
            textColor: "#c1121f"
        };
    }

    show() {
        this.marker.addTo(map);
    }
}