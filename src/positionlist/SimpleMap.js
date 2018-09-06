import React from "react";
import { Map as LeafletMap, TileLayer, Marker, Popup } from "react-leaflet";
import axios from "axios";

import MUIDataTable from "mui-datatables";

class SimpleMap extends React.Component {
  constructor() {
    super();
    this.state = {
      lat: 0,
      lng: 0,
      zoom: 5,
      loading: true,
      currentVessels: []
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
  };

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

  plotCurrentVessels = vessels => {
    const vesselPoints = vessels.map((vessel, i) => {
      return (
        <Marker key={i} position={vessel.position}>
          <Popup>
            <h4>{vessel.name}</h4>
            <p>IMO:{vessel.imo} </p>
            <p>Destination:{vessel.destination} </p>
            <p>Heading:{vessel.heading} </p>
            <p>Speed:{vessel.speedOverGround} </p>
          </Popup>
        </Marker>
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
      },
      
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
        <LeafletMap center={position} zoom={this.state.zoom}>
          <TileLayer
            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
          />
          {this.plotCurrentVessels(vessels)}
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
