// Dependencies
import * as React from "react";
import * as _ from "lodash";
import * as moment from "moment";
import { Row, Col } from "reactstrap";

// Project Components
import {
  Slider,
  Rail,
  Handles,
  Tracks,
  Ticks,
  SliderItem
} from "react-compound-slider";
import { Handle, Track, Tick } from "./Tracks";

const sliderStyle: React.CSSProperties = {
  marginLeft: "5%",
  marginRight: "5%",
  marginBottom: "5%",
  position: "relative",
  width: "90%"
};

const railStyle: React.CSSProperties = {
  position: "absolute",
  width: "100%",
  height: 14,
  borderRadius: 7,
  cursor: "pointer",
  backgroundColor: "rgb(155,155,155)"
};

const centered: React.CSSProperties = {
  margin: "auto",
  paddingBottom: "0.5em",
  paddingTop: "0.5em"
};

type DimensionSliderProps = {
  varName: string; // the name of the variable this axis belongs to
  min: number;
  max: number;
  data: Array<number>; // the raw axis data
  isTime: boolean; // is this a time axis
  modulo: any; // ???
  moduloCycle: number; // ???
  name: string; // the cdms2 name of the axis
  shape: Array<number>; // the shape of the axis
  units: string; // the units of the axis
  updateDimInfo: Function; // method to be called updating the parent when the slider values change
};

type DimensionSliderState = {
  min: number; // the current minimum value
  max: number; // the current max value
  tickValues: number[]; // the absolute min and absolute max values
  pValues: number[];
};

export default class DimensionSlider extends React.Component<
  DimensionSliderProps,
  DimensionSliderState
> {
  singleValue: boolean;
  tickCount: number;
  domain: [number, number];
  constructor(props: DimensionSliderProps) {
    super(props);
    let format: any;
    let possibleValues = props.data;
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.formatter = this.formatter.bind(this);

    if (_.includes(props.units, "since")) {
      let [span, , startTime] = props.units.split(" ");
      switch (span) {
        case "years":
          format = "YYYY";
          break;
        case "months":
          format = "YYYY-MM";
          break;
        case "days":
          format = "YYYY-MM-DD";
          break;
        case "hours":
        case "minutes":
          format = "YYYY-MM-DD HH:mm";
          break;
        case "seconds":
          format = "YYYY-MM-DD HH:mm:ss";
          break;
      }
      this.formatter = function(data) {
        return moment(startTime, "YYYY-MM-DD")
          .add(data, span)
          .format(format);
      };
      this.formatter.bind(this);
    }
    //console.log(props.name);
    //console.log(props.data.length);

    // Calculate values based on modulo
    if (props.modulo) {
      let newPossibleValues = [];
      //console.log("DimensionSliderProps:", props);
      let step = Math.abs(props.data[0] - props.data[1]);
      //console.log("step value:", step);
      for (let i = -props.modulo; i <= props.modulo; i += step) {
        newPossibleValues.push(i);
      }
      possibleValues = newPossibleValues;
    }
    //let step: number = 1;
    this.tickCount = 10;
    // Calculate display tick values and values
    let lastIdx: number = possibleValues.length - 1;
    let skipVal: number = 0;
    let tickValues: number[] = possibleValues;
    if (lastIdx >= this.tickCount) {
      tickValues = Array<number>();
      skipVal = lastIdx / (this.tickCount - 1);
      for (let idx = 0; idx < this.tickCount; idx++) {
        tickValues.push(Math.floor(idx * skipVal));
      }
    }
    let pValues = possibleValues.map((item: any) => {
      // console.log("item in pValues:", item)
      return item; //Math.floor(item);
    });

    // Set the domain, (number of elements in the data set)
    this.domain = [0, lastIdx];

    // console.log("props:", props)
    //console.log(`pValues in ${this.props.name} :`, pValues);
    //console.log(this.props.name);
    this.state = {
      min: this.domain[0],
      max: this.domain[1],
      pValues: pValues,
      tickValues: tickValues
    };

    /*console.log(`step in render for ${this.props.name}:`, this.step);
    console.log(
      `pValues[0] in render for ${this.props.name}:`,
      this.state.pValues[0]
    );
    console.log(
      `this.state.min in render for ${this.props.name}:`,
      this.state.min
    );
    console.log(
      `pValues[this.state.pValues.length - 1] in render for ${
        this.props.name
      }:`,
      this.state.pValues[this.state.pValues.length - 1]
    );
    console.log(
      `this.state.max in render for ${this.props.name}:`,
      this.state.max
    );*/
  }

  mapValue(item: number, values: number[]): number {
    let curDiff: number = Infinity;
    let diff: number;
    let closest: number = 0;
    values.forEach(value => {
      diff = Math.abs(item - value);
      if (diff < curDiff) {
        closest = value;
        curDiff = diff;
      }
    });
    return closest;
  }

  // default formatter
  formatter(data: any): any {
    if (data.toFixed) {
      return data.toFixed(5);
    }
    return data;
  }

  render(): JSX.Element {
    return (
      <div className="dimension-slider">
        {!this.singleValue && (
          <div className="form-inline">
            <div style={centered}>
              <Row>
                <Col xs="auto"> {this.props.name} </Col>
                <Col xs="auto"> {this.props.units} </Col>
              </Row>
            </div>
            <Slider
              mode={2}
              step={1}
              domain={this.domain}
              rootStyle={sliderStyle}
              onChange={this.handleSliderChange}
              values={this.domain}
            >
              <Rail>
                {({ getRailProps }) => (
                  <div style={railStyle} {...getRailProps()} />
                )}
              </Rail>
              <Handles>
                {({ handles, getHandleProps }) => (
                  <div className="slider-handles">
                    {handles.map(handle => (
                      <Handle
                        key={handle.id}
                        handle={handle}
                        domain={[this.state.min, this.state.max]}
                        getHandleProps={getHandleProps}
                      />
                    ))}
                  </div>
                )}
              </Handles>
              <Tracks left={false} right={false}>
                {({ tracks, getTrackProps }) => (
                  <div className="slider-tracks">
                    {tracks.map(({ id, source, target }) => (
                      <Track
                        key={id}
                        source={source}
                        target={target}
                        getTrackProps={getTrackProps}
                      />
                    ))}
                  </div>
                )}
              </Tracks>
              <Ticks values={this.state.tickValues}>
                {({ ticks }) => (
                  <div className="slider-ticks">
                    {ticks.map((tick: SliderItem, idx: number) => (
                      <Tick
                        key={tick.id}
                        tick={tick}
                        count={this.tickCount}
                        value={this.state.pValues[this.state.tickValues[idx]]}
                      />
                    ))}
                  </div>
                )}
              </Ticks>
            </Slider>
            <div style={centered}>
              <Row>
                <Col xs="auto">
                  {" "}
                  [{this.state.pValues[this.state.min]}...
                  {this.state.pValues[this.state.max]}]{" "}
                </Col>
              </Row>
            </div>
          </div>
        )}
      </div>
    );
  }
  handleSliderChange(e: any): void {
    if (e.length != 2) {
      return;
    }
    //let minVal: number = this.mapValue(e[0],this.state.pValues);
    //let maxVal: number = this.mapValue(e[0],this.state.pValues);

    this.setState({
      min: e[0],
      max: e[1]
    });
    this.props.updateDimInfo(
      {
        name: this.props.name,
        min: this.state.pValues[e[0]],
        max: this.state.pValues[e[1]]
      },
      this.props.varName
    );
  }
}
