import { map } from "./map.js";

const options = {
    mainDefault: {
        icon: 'circle-o',
        iconShape: 'marker',
        borderColor: "#c1121f",
        textColor: "#c1121f"
    },
    mainActive: {
        icon: 'circle-o',
        iconShape: 'marker',
        borderColor: "#c1121f",
        textColor: "#fff",
        backgroundColor: "#c1121f"
    },
    secondaryDefault: {
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#c1121f",
        iconSize: [15, 15],
        isAlphaNumericIcon: true,
        text: ''
    },
    secondaryActive: {
        iconShape: 'circle',
        borderColor: "#c1121f",
        textColor: "#c1121f",
        iconSize: [15, 15],
        isAlphaNumericIcon: true,
        text: '',
        backgroundColor: "#c1121f"
    }
}

export class Station {
    constructor(name, coords, type) {
        this.name = name,
        this.coords = coords,
        this.type = type;

        if (this.type == "main") {
            this.BeautifyIconOptionsDefault = options.mainDefault;
            this.BeautifyIconOptionsActive = options.mainActive;
        } else if (this.type == "secondary") {
            this.BeautifyIconOptionsDefault = options.secondaryDefault;
            this.BeautifyIconOptionsActive = options.secondaryActive;
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
        this.markerDefault.bindTooltip(this.name);
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