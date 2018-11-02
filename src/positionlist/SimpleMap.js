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

  /*
    addMarker = e => {
      const port = e.latlng;
      this.props.setPort(port);
    }
  
  
    onZoomend = () => {
      //const zoom = this.map.leafletElement.getZoom();
      //this.setState({currentZoom: zoom});
      console.log(this)
    }*/

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
  /*
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
    }; */


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
        <div style={{
          height: "400px",
          boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.14)",
          marginBottom: "30px",
          borderRadius: "6px",
        }}>
          <ReactBingmaps
            bingmapKey="AsfGGUcrNycIg6JAG7NNP2WYHw73VUb8jNdUDhMHkzYiZKx8bFRm87UauXmi5HHe"
            center={[13.0827, 80.2707]}
          />
        </div>
        <div>
          <MUIDataTable
            title={"Position List"}
            data={tableData}
            columns={columns}
            options={options}
          />
        </div>
      </div>
    );
  }
}

export default SimpleMap;
