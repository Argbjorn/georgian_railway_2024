import { map } from "./map.js";

const options = {
    mainDefault: {
        icon: 'star',
        iconSize: [23, 23],
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#c1121f"
    },
    mainActive: {
        icon: 'star',
        iconSize: [23, 23],
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#fff",
        backgroundColor: "#c1121f"
    },
    airportDefault: {
        icon: 'plane',
        iconSize: [22, 22],
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#c1121f"
    },
    airportActive: {
        icon: 'plane',
        iconSize: [22, 22],
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#fff",
        backgroundColor: "#c1121f"
    },
    beachDefault: {
        icon: 'sun-o',
        iconSize: [23, 23],
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#c1121f"
    },
    beachActive: {
        icon: 'sun-o',
        iconSize: [23, 23],
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#fff",
        backgroundColor: "#c1121f"
    },
    secondaryDefault: {
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#c1121f",
        iconSize: [18, 18],
        isAlphaNumericIcon: true,
        text: ''
    },
    secondaryActive: {
        iconShape: 'circle',
        borderColor: "#fff",
        textColor: "#c1121f",
        iconSize: [18, 18],
        isAlphaNumericIcon: true,
        text: '',
        backgroundColor: "#c1121f"
    }
}

export class Station {
    constructor(name_en, coords, type, code) {
        this.name_en = name_en,
        this.coords = coords,
        this.type = type;
        this.code = code;

        if (this.type == "main") {
            this.BeautifyIconOptionsDefault = options.mainDefault;
            this.BeautifyIconOptionsActive = options.mainActive;
        } else if (this.type == "secondary") {
            this.BeautifyIconOptionsDefault = options.secondaryDefault;
            this.BeautifyIconOptionsActive = options.secondaryActive;
        } else if (this.type == "airport") {
            this.BeautifyIconOptionsDefault = options.airportDefault;
            this.BeautifyIconOptionsActive = options.airportActive;
        } else if (this.type == "beach") {
            this.BeautifyIconOptionsDefault = options.beachDefault;
            this.BeautifyIconOptionsActive = options.beachActive;
        };
        this.markerDefault = L.marker(this.coords, {
            icon: L.BeautifyIcon.icon(this.BeautifyIconOptionsDefault)
        });
        this.markerActive = L.marker(this.coords, {
            icon: L.BeautifyIcon.icon(this.BeautifyIconOptionsActive)
        });
    }

    setDefault() {
        this.markerDefault.addTo(map);
        this.markerDefault.bindTooltip(this.name_en);
    }

    setActive() {
        this.markerDefault.remove();
        this.markerActive.addTo(map);
    }

    hide() {
        this.markerDefault.remove();
        this.markerActive.remove();
    }
}