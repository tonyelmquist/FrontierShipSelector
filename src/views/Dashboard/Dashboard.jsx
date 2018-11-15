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
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
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
        draft: vessel.aisVoyage.draft
      };
    });

    this.setState({ allVessels: vesselArray });
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  setDays = (event, value) => {
    this.setState({ routeDays: value });
    this.getCurrentVessels()
  };

  getDaysOutCrude = (vessel, speed) => {
    const distance = geolib.getDistance(vessel, this.state.port.coordinates, 1000)
    const daysOut = parseInt(distance / (speed * 1852 * 24))
    return daysOut
  }

  calculateRealDistance = async(vessel, port) => {
    await axios({
      url: "https://api.vesseltracker.com/api/v1/routes",
      method: "get",
      headers: {
        Authorization: "15dcbc0e-214a-49e0-8ed9-6f3e0c4a640b",
        "Content-Type": "application/json"
      },
      params: {
        fromLon: vessel.position[1],
        fromLat: vessel.position[0],
        toLon: port.coordinates[1],
        toLat: port.coordinates[0],
        speed: vessel.speedOverGround
      }
    })
      .then(response => {
        console.log(response.data.getRouteJson[0].journeytime / 24 / 60 / 60 / 1000, vessel.speedOverGround)
        return response.data.getRouteJson[0]
      })
      .catch(err => {
        console.log(err);
      });
  }
  
getCurrentVessels = async () => {
  const portLocation = this.state.port.coordinates
  const currentVessels = this.state.allVessels.filter(vessel => this.getDaysOutCrude(vessel.position, 15) < this.state.routeDays)
  const trueVessels = currentVessels.filter(vessel => (this.calculateRealDistance(vessel, this.state.port).journeytime / 60 / 60 / 1000 / 24) < this.state.routeDays)
  this.setState({currentVessels: currentVessels})
}

  setPA = (event, value) => {
    this.setState({ PA: value });
  };

  onChange = (e, data) => {
    console.log(data.value);
    this.setState({ selected: data.value, port: { ...data.value, coordinates: data.value.coordinates.reverse() } });
    this.getCurrentVessels()
  }

  setPort = port => {
    this.setState({ port: { name: "Custom", coordinates: port } });
    this.getCurrentVessels()
  };

  handleChangeIndex = index => {
    this.setState({ value: index });
  };
  render() {
    if (this.state.loading) return false;
    const { classes } = this.props;

    return (
      <div>
        <GridContainer>
          <GridItem xs={12} sm={6} md={3}>
            <Card>
              <CardHeader color="warning" stats icon>
                <CardIcon color="warning">
                  <Icon>place</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Cargo Location</p>
                <input
                  type="text"
                  name="lat"
                  label="Lat"
                  value={this.state.port.coordinates[0].toFixed(4)}
                />
                <input
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
            <Card>
              <CardHeader color="success" stats icon>
                <CardIcon color="success">
                  <Icon>today</Icon>
                </CardIcon>
                <p className={classes.cardCategory}>Days to Location</p>
                <h3 className={classes.cardTitle}>{this.state.routeDays}</h3>
              </CardHeader>
              <CardFooter >
                <Slider value={this.state.routeDays} min={0} max={14} step={1} name="routeDays" aria-labelledby="label" onChange={this.setDays} />
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={3}>
            <Card>
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
            <Card>
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
          <GridItem xs={12} sm={12} md={12}>
            <SimpleMap port={this.state.port} setPort={this.setPort} currentVessels={this.state.currentVessels} />
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
