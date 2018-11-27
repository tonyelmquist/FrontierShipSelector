import React, { Component } from "react";
import { ReactBingmaps } from 'react-bingmaps';
import MUIDataTable from "mui-datatables";
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';

const styles = theme => ({
  progress: {
    margin: theme.spacing.unit * 2,
  },
});

class SimpleMap extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      lat: 0,
      lng: 0,
      zoom: 5,
      loading: true,
      allVessels: [],
      currentVessels: [],
      currentZoom: 5,
      dragging: false,
      mouseLocation: [0, 0]
    };
    this.outputLocation = this.outputLocation.bind(this);
    this.setDragEnd = this.setDragEnd.bind(this);
  }


  shouldComponentUpdate() {
    return !this.state.dragging;
  }

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

  setDragEnd = () => {
    this.props.setPort(this.state.mouseLocation)
  };

  outputLocation = location => {
    this.setState({ mouseLocation: [location.latitude, location.longitude] })
  };

  plotCurrentVessels = (vessels, zoom) => {
    const pointer = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path fill="#FF8800" transform="rotate(insertRotation 12 12)" opacity=".7" d="M7.72 17.7l3.47-1.53.81-.36.81.36 3.47 1.53L12 7.27z"/><path fill="#FFFFFF" transform="rotate(insertRotation 12 12)" d="M4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2 4.5 20.29zm8.31-4.12l-.81-.36-.81.36-3.47 1.53L12 7.27l4.28 10.43-3.47-1.53z"/></svg>'
    const destination = {
      "location": this.props.port.coordinates,
      "addHandler": "mouseover", //on mouseover the pushpin, infobox shown
      "infoboxOption": {
        title: "destination",
        visible: false,
      },
      "pushPinOption": { color: "red", draggable: true },
      "pushPinAddHandler": { type: "dragend", callback: this.setDragEnd }
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
        "infoboxAddHandler": { "type": "click", callback: this.GetLocationHandled },
        "pushPinAddHandler": { "type": "click", callback: this.GetLocationHandled }
      }
    });

    vesselPoints.push(destination);

    return vesselPoints;
  };


  render() {
    const { vessels, vesselsLoading, classes } = this.props;

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
      {
        name: "Draft",
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
      return [vessel.name, vessel.imo, vessel.destination, vessel.speedOverGround, vessel.draft]
    })



    return (

      <div>
        <div style={{
          height: "400px",
          boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.14)",
          marginBottom: "30px",
          borderRadius: "6px",
        }}>
          <ReactBingmaps ref={this.myRef}
            bingmapKey="AsfGGUcrNycIg6JAG7NNP2WYHw73VUb8jNdUDhMHkzYiZKx8bFRm87UauXmi5HHe"
            center={this.props.port.coordinates}
            infoboxesWithPushPins={this.plotCurrentVessels(vessels)}
            mapTypeId={"aerial"}
            getLocation={
              { addHandler: "mouseup", callback: this.outputLocation }
            }
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
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={vesselsLoading}
        >
          <div style={{
            top: 'calc(50% - 50px)',
            left: 'calc(50% - 300px)',
            position: 'fixed',
            width: '600px',
            textAlign: 'center'
          }}>
            <CircularProgress className={classes.progress} size={100}/>
            <h3 style={{color: 'lightgray'}}>Loading route information for {this.props.currentVesselName}</h3>
          </div>
        </Modal>
      </div>

    );
  }
}

export default withStyles(styles)(SimpleMap);
