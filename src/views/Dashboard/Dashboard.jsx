import React from "react";
import PropTypes from "prop-types";
// react plugin for creating charts
import ChartistGraph from "react-chartist";
// @material-ui/core
import withStyles from "@material-ui/core/styles/withStyles";
import Icon from "@material-ui/core/Icon";
// @material-ui/icons
// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import Table from "components/Table/Table.jsx";
import Tasks from "components/Tasks/Tasks.jsx";
import CustomTabs from "components/CustomTabs/CustomTabs.jsx";
import Danger from "components/Typography/Danger.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardIcon from "components/Card/CardIcon.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";
import SimpleMap from "../../positionlist/SimpleMap";
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Switch from '@material-ui/core/Switch';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { Dropdown } from 'semantic-ui-react'
import geolib from 'geolib'
import axios from "axios";

import Slider from '@material-ui/lab/Slider';

import dashboardStyle from "assets/jss/material-dashboard-react/views/dashboardStyle.jsx";

class Dashboard extends React.Component {
  state = {
    value: 0,
    port: { name: '', coordinates: [0, 0] },
    portsArray: [],
    routeDays: 1,
    PA: 50,
    allVessels: [],
    currentVessels: [],
    realVessels: [],
    vesselsLoading: false,
    currentVesselName: ''
  };

  componentDidMount = () => {
    let ports = require('../../assets/json/ports.json');
    const portsArray = Object.values(ports).map((port, i) => {
      return { key: i, text: port.name, value: (port) }
    })

    this.setState({ portsArray })
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
        ETA: vessel.aisVoyage.eta,
        draft: vessel.aisVoyage.draught
      };
    });

    this.setState({ allVessels: vesselArray });
  };

  handleChange = (event, value) => {
    this.setState({ value });
    this.getCurrentVessels()
  };

  triggerGetCurrentVessels(coordinates, hours) {
    clearTimeout(window.getVesselTimeout)
    window.getVesselTimeout = setTimeout(this.getCurrentVessels(coordinates, hours / 3600), 500);
  }

  setDays = (event, value) => {
    // this.triggerGetCurrentVessels(this.state.port.coordinates, value)
    this.setState({ routeDays: value });
  };

  setHours = () => {
    this.triggerGetCurrentVessels(this.state.port.coordinates, this.state.routeDays)
  }

  getHoursOutCrude = (vessel, speed, coordinates) => {
    const distance = geolib.getDistance(vessel, coordinates, 1000)
    const hoursOut = parseInt((distance / 1852) / speed)
    return hoursOut
  }

  getAllRoutesAsync = (vessels, port) => {
    this.setState({ vesselsLoading: true })
    //Map every endpoint so we can make a request with each URL
    var promises = vessels.map(vessel => {
      return new Promise((resolve, reject) => {
        axios({
          url: "https://api.vesseltracker.com/api/v1/routes",
          method: "get",
          headers: {
            Authorization: "15dcbc0e-214a-49e0-8ed9-6f3e0c4a640b",
            "Content-Type": "application/json"
          },
          params: {
            fromLon: vessel.position[1],
            fromLat: vessel.position[0],
            toLon: port[1],
            toLat: port[0],
            speed: vessel.speedOverGround
          }
        })
          .then(response => {
            this.setState({currentVesselName: vessel.name})
            const route = response.data.getRouteJson[0]
            vessel.eta = route.eta;
            vessel.journeytime = route.journeytime;
            vessel.distance = route.distance;
            resolve(vessel);
          })
          .catch(err => {
            reject(err);
          });
      });
    });
    //Resolve ALL the promises from above (we are after all making multiple call to get all the different shirt info)
    Promise.all(promises).then(routes => {
      this.returnRealDistanceVessels(routes, this.state.routeDays);
    });
  };

  getCurrentVessels = (coordinates, hours) => {
    const portLocation = coordinates
    const currentVessels = this.state.allVessels.filter(vessel => this.getHoursOutCrude(vessel.position, 15, coordinates) < hours)
    this.getAllRoutesAsync(currentVessels, portLocation);
    this.setState({ currentVessels });
  };

  returnRealDistanceVessels = (currentVessels, hours) => {
    console.log(currentVessels, hours)
    const realVessels = currentVessels.filter(vessel => {
      if (vessel.journeytime) {
        const ttd = parseInt(vessel.journeytime) / 1000 / 60 / 60;
        console.log(ttd, hours)
        if (ttd < hours / 3600) return true
      }
      return false
    });
    console.log(realVessels)
    this.setState({ realVessels, vesselsLoading: false });
  }

  setPA = (event, value) => {
    this.setState({ PA: value });
  };

  onChange = (e, data) => {
    this.setState({ selected: data.value, port: { ...data.value, coordinates: data.value.coordinates.reverse() } });
    this.getCurrentVessels(data.value.coordinates, this.state.routeDays / 3600)
  }

  setPort = coordinates => {
    this.setState({ port: { name: "Custom", coordinates } });
    this.getCurrentVessels(coordinates, this.state.routeDays / 3600)
  };

  handleChangeIndex = index => {
    this.setState({ value: index });
  };

  returnDaysAndHours = seconds => {
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    const hrs = Math.floor(seconds / 3600);
    seconds -= hrs * 3600;
    return (days + " days " + hrs + ' hours')
  }
  render() {
    if (this.state.loading) return false;
    const { classes } = this.props;

    return (
      <div>
        <GridContainer>
          <GridItem xs={12} sm={6} md={3}>
            <Card style={{ height: '150px' }}>
              <CardHeader color="warning" stats icon>
                <CardIcon color="warning">
                  <Icon>place</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Cargo Location</p>
                <Input
                  type="text"
                  name="lat"
                  label="Lat"
                  value={this.state.port.coordinates[0].toFixed(4)}
                />
                <Input
                  type="text"
                  name="lon"
                  label="Lon"
                  value={this.state.port.coordinates[1].toFixed(4)}
                />
              </CardHeader>
              <CardFooter >
                <FormControl className="dashboardSelect">
                  <Dropdown
                    options={this.state.portsArray}
                    placeholder='Port' fluid search selection
                    onChange={this.onChange}>
                  </Dropdown>
                </FormControl> </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={3}>
            <Card style={{ height: '150px' }}>
              <CardHeader color="success" stats icon>
                <CardIcon color="success">
                  <Icon>today</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Time to Location</p>
                <h3 className={classes.cardTitle}>{this.returnDaysAndHours(this.state.routeDays)}</h3>
              </CardHeader>
              <CardFooter >
                <Slider value={this.state.routeDays} min={0} max={2592000} step={3600} name="routeDays" aria-labelledby="label" onChange={this.setDays} onMouseUp={this.setHours} />
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={3}>
            <Card style={{ height: '150px' }}>
              <CardHeader color="danger" stats icon>
                <CardIcon color="danger">
                  <Icon>data_usage</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Predictive Availability</p>
                <h3 className={classes.cardTitle}>{this.state.PA}</h3>
              </CardHeader>
              <CardFooter >
                <Slider value={this.state.PA} min={0} max={100} step={1} name="paValue" aria-labelledby="label" onChange={this.setPA} />
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={3}>
            <Card style={{ height: '150px' }}>
              <CardHeader color="danger" stats icon>
                <CardIcon color="danger">
                  <Icon>settings</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Options</p>
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.useBallast}
                      value="ballast"
                    />
                  }
                  label="In ballast"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.usePA}
                      value="usePA"
                    />
                  }
                  label="use PA"
                />
              </CardHeader>
              <CardFooter >
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={12}>
            <SimpleMap port={this.state.port} setPort={this.setPort} vessels={this.state.realVessels} vesselsLoading={this.state.vesselsLoading} currentVesselName={this.state.currentVesselName}/>
          </GridItem>
        </GridContainer>
      </div>
    );
  }
}

Dashboard.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(dashboardStyle)(Dashboard);
