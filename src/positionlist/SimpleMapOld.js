import React, { Component } from "react";
import { Map as LeafletMap, TileLayer, Popup, Marker } from "react-leaflet";
import RotatedMarker from "react-leaflet-rotatedmarker"
import { ReactBingmaps } from 'react-bingmaps';
import axios from "axios";
import iconTanker from "components/Icon/Icon.js"
import MarkerIcon from "components/Icon/Marker.js"

import MUIDataTable from "mui-datatables";

class SimpleMap extends Component {
  constructor() {
    super();
    this.state = {
      lat: 0,
      lng: 0,
      zoom: 5,
      loading: true,
      currentVessels: [],
      currentZoom: 5
    };
  }

  componentDidMount = () => {
    this.setState({ loading: true });

    axios({
      url: "https://api.vesseltracker.com/api/v1/vessels/userlist/latestpositions",
      method: "get",
      headers: {
        Authorization: "15dcbc0e-214a-49e0-8ed9-6f3e0c4a640b",
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        this.parseVessels(response.data);
        this.setState({ loading: false });
      })
      .catch(err => {
        console.log(err);
        this.setState({ loading: false });
      });

    axios({
      url: "https://api.vesseltracker.com/api/v1/routes",
      method: "get",
      headers: {
        Authorization: "15dcbc0e-214a-49e0-8ed9-6f3e0c4a640b",
        "Content-Type": "application/json"
      },
      params: {
        fromLon: 0,
        fromLat: 0,
        toLon: 1,
        toLat: 1,
        speed: 5
      }

    })
      .then(response => {
        console.log(response.data)
      })
      .catch(err => {
        console.log(err);
        this.setState({ loading: false });
      });
  };


  addMarker = e => {
    const port = e.latlng;
    this.props.setPort(port);
  }


  onZoomend = () => {
    //const zoom = this.map.leafletElement.getZoom();
    //this.setState({currentZoom: zoom});
    console.log(this)
  }

  parseVessels = response => {
    const vesselArray = response.vessels.map(vessel => {
      return {
        name: vessel.aisStatic.name,
        imo: vessel.aisStatic.imo,
        flag: vessel.aisStatic.flag,
        position: [vessel.aisPosition.lat, vessel.aisPosition.lon],
        speedOverGround: vessel.aisPosition.sog,
        heading: vessel.aisPosition.hdg,
        destination: vessel.aisVoyage.dest,
        ETA: vessel.aisVoyage.eta
      };
    });

    this.setState({ currentVessels: vesselArray });
  };

  plotCurrentVessels = (vessels, zoom) => {

    const baseWidth = 225 / zoom;

    const tanker = new Leaflet.Icon({
      iconUrl: require('assets/img/ship.svg'),
      iconSize: [baseWidth, baseWidth / 2], // size of the icon
      iconAnchor: [baseWidth / 2, baseWidth / 4], // point of the icon which will correspond to marker's location
      popupAnchor: [0, 0]// point from which the popup should open relative to the iconAnchor
    })

    const antiTanker = new Leaflet.Icon({
      iconUrl: require('assets/img/antiship.svg'),
      iconSize: [baseWidth, baseWidth / 2], // size of the icon
      iconAnchor: [baseWidth / 2, baseWidth / 4], // point of the icon which will correspond to marker's location
      popupAnchor: [0, 0]// point from which the popup should open relative to the iconAnchor
    })


    const vesselPoints = vessels.map((vessel, i) => {

      return (
        <RotatedMarker key={i} icon={vessel.heading > 180 ? tanker : antiTanker} position={vessel.position} rotationAngle={vessel.heading + 90} rotationOrigin={'center'} >
          <Popup>
            <div>
              <h4>{vessel.name}</h4>
              <p>IMO:{vessel.imo} </p>
              <p>Destination:{vessel.destination} </p>
              <p>Heading:{vessel.heading} </p>
              <p>Speed:{vessel.speedOverGround} </p>
            </div>
          </Popup>
        </RotatedMarker>
      );
    });

    return vesselPoints;
  };


  render() {
    const position = [this.state.lat, this.state.lng];

    const vessels = this.state.currentVessels;

    const columns = [
      {
        name: "Name",
        options: {
          filter: true,
          sort: true
        }
      },
      {
        name: "IMO",
        options: {
          filter: true,
          sort: true
        }
      },
      {
        name: "Destination",
        options: {
          filter: true,
          sort: true
        }
      },
      {
        name: "Speed",
        options: {
          filter: true,
          sort: true
        }
      }
    ];

    const options = {
      filterType: "checkbox"
    };

    const tableData = vessels.map(vessel => {
      return [vessel.name, vessel.imo, vessel.destination, vessel.speedOverGround]
    })

    if (this.state.loading) return false;
    return (
      <div>
        <LeafletMap center={position} zoom={this.state.zoom} ref={(ref) => { this.map = ref; }} onClick={() => this.addMarker()}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri" maxZoom={13} />
          <TileLayer url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png" attribution="Map data: &copy; <a href='http://www.openseamap.org'>OpenSeaMap</a> contributors" />
          {this.plotCurrentVessels(vessels, this.state.currentZoom)}
          {this.props.port ? <Marker key={`marker-${this.props.port.lat}`} icon={MarkerIcon} position={this.props.port}>
            <Popup>
              <span>{this.props.port}</span>
            </Popup>
          </Marker> : null}
        </LeafletMap>
        <MUIDataTable
          title={"Position List"}
          data={tableData}
          columns={columns}
          options={options}
        />
      </div>
    );
  }
}

export default SimpleMap;
