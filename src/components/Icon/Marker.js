import L from "leaflet";

const MarkerIcon = new L.Icon({
               iconUrl: require('assets/img/marker-icon.png'),
               shadowUrl: require('assets/img/marker-shadow.png'),
               iconSize:     [8, 18], // size of the icon
               shadowSize:   [10, 13], // size of the shadow
               iconAnchor:   [4, 18], // point of the icon which will correspond to marker's location
               shadowAnchor: [1, 12],  // the same for the shadow
               popupAnchor:  [-1, -14]// point from which the popup should open relative to the iconAnchor
           })

export default MarkerIcon;