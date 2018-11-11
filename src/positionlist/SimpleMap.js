import React, { Component } from "react";
import { ReactBingmaps } from 'react-bingmaps';
import axios from "axios";

import MUIDataTable from "mui-datatables";

class SimpleMap extends Component {
  constructor() {
    super();
    this.state = {
      lat: 0,
      lng: 0,
      zoom: 5,
      loading: true,
      allVessels: [],
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

    this.setState({ allVessels: vesselArray });
  };

  plotCurrentVessels = (vessels, zoom) => {
    const pointer = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path fill="#FF8800" transform="rotate(insertRotation 12 12)" opacity=".7" d="M7.72 17.7l3.47-1.53.81-.36.81.36 3.47 1.53L12 7.27z"/><path fill="#FFFFFF" transform="rotate(insertRotation 12 12)" d="M4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2 4.5 20.29zm8.31-4.12l-.81-.36-.81.36-3.47 1.53L12 7.27l4.28 10.43-3.47-1.53z"/></svg>'
    const destination = {
      "location": [13.0827, 80.2707],
      "addHandler": "mouseover", //on mouseover the pushpin, infobox shown
      "infoboxOption": {
        title: "destination",
        visible: false,
      },
      "pushPinOption": { color: "red", draggable: true},
      "infoboxAddHandler": { type: "click", callback: this.callBackMethod },
      "pushPinAddHandler": { type: "click", callback: this.callBackMethod }
    }
    
    const vesselPoints = vessels.map((vessel, i) => {

      let thisPointer = pointer;
      thisPointer = thisPointer.replace(/insertRotation/g, vessel.heading);

      return {
        "location": vessel.position,
        "addHandler": "mouseover", //on mouseover the pushpin, infobox shown
        "infoboxOption": {
          title: vessel.name, description: `<div className="shipPoint">
                <p class="shipBoxLine">IMO:${vessel.imo} </p>
                <p class="shipBoxLine">Destination:${vessel.destination} </p>
                <p class="shipBoxLine">Heading:${vessel.heading} </p>
                <p class="shipBoxLine">Speed:${vessel.speedOverGround} </p>
              </div>` },
        "pushPinOption": { title: vessel.name, icon: thisPointer },
        "infoboxAddHandler": { "type": "click", callback: this.callBackMethod },
        "pushPinAddHandler": { "type": "click", callback: this.callBackMethod }
      }


    });

    vesselPoints.push(destination);
    console.log(vesselPoints)

    return vesselPoints;
  };

  render() {
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
            center={[0, 0]}
            infoboxesWithPushPins={this.plotCurrentVessels(vessels)}
            mapTypeId={"aerial"}
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
