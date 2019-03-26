// Dependencies
import * as _ from "lodash";
import * as moment from "moment";
import * as React from "react";
import { Col, Row } from "reactstrap";

// Project Components
import {
  Handles,
  Rail,
  Slider,
  SliderItem,
  Ticks,
  Tracks
} from "react-compound-slider";
import { Handle, Tick, Track } from "./Tracks";

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

interface DimensionSliderProps {
  varName: string; // the name of the variable this axis belongs to
  min: number;
  max: number;
  data: number[]; // the raw axis data
  isTime: boolean; // is this a time axis
  modulo: any; // ???
  moduloCycle: number; // ???
  name: string; // the cdms2 name of the axis
  shape: number[]; // the shape of the axis
  units: string; // the units of the axis
  updateDimInfo: Function; // method to be called updating the parent when the slider values change
}

interface DimensionSliderState {
  min: number; // the current minimum value
  max: number; // the current max value
  tickValues: number[]; // the absolute min and absolute max values
  pValues: number[];
}

export default class DimensionSlider extends React.Component<
  DimensionSliderProps,
  DimensionSliderState
> {
  public singleValue: boolean; // Whether the slider range contains only a single value
  public tickCount: number = 10; // The number of ticks to display for slider
  private domain: [number, number]; // The domain to use for the slider
  constructor(props: DimensionSliderProps) {
    super(props);
    let format: any;
    let possibleValues = props.data;
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.formatter = this.formatter.bind(this);

    if (_.includes(props.units, "since")) {
      const [span, , startTime] = props.units.split(" ");
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

    // Calculate values based on modulo
    if (props.modulo) {
      const newPossibleValues = [];
      const step = Math.abs(props.data[0] - props.data[1]);
      for (let i = -props.modulo; i <= props.modulo; i += step) {
        newPossibleValues.push(i);
      }
      possibleValues = newPossibleValues;
    }

    // Calculate display tick values and values
    const lastIdx: number = possibleValues.length - 1;
    let skipVal: number = 0;
    let tickValues: number[] = possibleValues;
    if (lastIdx >= this.tickCount) {
      tickValues = Array<number>();
      skipVal = lastIdx / (this.tickCount - 1);
      for (let idx = 0; idx < this.tickCount; idx++) {
        tickValues.push(Math.floor(idx * skipVal));
      }
    }
    const pValues = possibleValues.map((item: any) => {
      return item;
    });

    // Set the domain, (number of elements in the data set)
    this.domain = [0, lastIdx];

    this.state = {
      min: this.domain[0],
      max: this.domain[1],
      pValues,
      tickValues
    };
  }

  // default formatter
  public formatter(data: any): any {
    if (data.toFixed) {
      return data.toFixed(5);
    }
    return data;
  }

  // formats the tick values for display only
  public numFormatter(value: number): string {
    if (value.toString().length > 8) {
      return value.toExponential(4);
    }
    return value.toString();
  }

  public render(): JSX.Element {
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
                        value={this.numFormatter(
                          this.state.pValues[this.state.tickValues[idx]]
                        )}
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
  public handleSliderChange(e: any): void {
    if (e.length != 2) {
      return;
    }

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
