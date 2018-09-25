import L from "leaflet";

const iconTanker = new L.Icon({
  iconUrl: require("assets/img/ship.svg"),
  iconRetinaUrl: require("assets/img/ship.svg"),
  iconAnchor: null,
  popupAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: new L.Point(60, 75),
  className: "leaflet-div-icon"
});

export default { iconTanker };