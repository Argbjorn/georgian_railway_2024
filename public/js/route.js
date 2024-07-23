import { getOverpassData } from "./main.js";

export class Route {
    constructor(id) {
        this.id = id;
        this.query = `[out:json][timeout:25]; relation(` + this.id + `); out geom;`;
        this.layerGroup = this.create();
    }

    create() {
        let route = L.layerGroup();
        getOverpassData(this.query)
        .then(data => {
            data.elements.forEach(element => {
                element.members.forEach(member => {
                    if(member.type == 'way') {
                        route.addLayer(L.polyline(member.geometry, {color: 'red'}));
                    }
                    else if (member.type == 'node') {
                        const query = `[out:json][timeout:25]; node(` + member.ref + `); out geom;`;
                        getOverpassData(query)
                        .then(data => {
                            route.addLayer(L.circleMarker([member.lat, member.lon], {color: "red", radius: 10}).bindTooltip(data.elements[0].tags["name:en"], {
                                permanent: true, 
                                direction: 'bottom',
                                opacity: 0.9}).openTooltip());
                        })

                    }
                })
            })
        });
        return route;
    }

    show() {
        this.layerGroup.addTo(map);
    }

    hide() {
        this.layerGroup.remove();
    }
}