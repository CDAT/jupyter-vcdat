// Dependencies
import * as _ from "lodash";
import moment from "moment";
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
import { boundMethod } from "autobind-decorator";

const sliderStyle: React.CSSProperties = {
  marginBottom: "5%",
  marginLeft: "5%",
  marginRight: "5%",
  position: "relative",
  width: "90%"
};

const railStyle: React.CSSProperties = {
  backgroundColor: "rgb(155,155,155)",
  borderRadius: 7,
  cursor: "pointer",
  height: 14,
  position: "absolute",
  width: "100%"
};

const centered: React.CSSProperties = {
  margin: "auto",
  paddingBottom: "0.5em",
  paddingTop: "0.5em"
};

interface IDimensionSliderProps {
  varID: string; // the name of the variable this axis belongs to
  first: number;
  last: number;
  data: number[]; // the raw axis data
  isTime: boolean; // is this a time axis
  modulo: any; // ???
  moduloCycle: number; // ???
  name: string; // the cdms2 name of the axis
  shape: number[]; // the shape of the axis
  units: string; // the units of the axis
  // method to be called updating the parent when the slider values change
  updateDimInfo: (newInfo: any, varID: string) => Promise<void>;
}

interface IDimensionSliderState {
  first: number; // the current first value
  last: number; // the current last value
  tickValues: number[]; // the absolute first and absolute last values
  possibleValues: number[];
}

export default class DimensionSlider extends React.Component<
  IDimensionSliderProps,
  IDimensionSliderState
> {
  public singleValue: boolean; // Whether the slider range contains only a single value
  public tickCount: number = 10; // The number of ticks to display for slider
  private domain: [number, number]; // The domain to use for the slider
  constructor(props: IDimensionSliderProps) {
    super(props);

    // Set slider values and formatting
    let format: any;
    const pValues = props.data;

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
      this.formatter = (data: any) => {
        return moment(startTime, "YYYY-MM-DD")
          .add(data, span)
          .format(format);
      };
      this.formatter.bind(this);
    }

    // Calculate display tick values and values
    const lastIdx: number = pValues.length - 1;
    let skipVal: number = 0;

    // Create default array of sequential values
    let tickVals: number[] = Array.from(Array(pValues.length).keys());

    // If there are more real values than there are tick values
    // Calculate tick index that span the whole range of real  values
    if (lastIdx >= this.tickCount) {
      tickVals = Array<number>();
      skipVal = lastIdx / (this.tickCount - 1);
      for (let idx = 0; idx < this.tickCount; idx += 1) {
        tickVals.push(Math.floor(idx * skipVal));
      }
    }

    // Set the domain, (number of elements in the data set)
    this.domain = [0, lastIdx];

    // Set initial selected range
    let idxFirst: number = pValues.indexOf(this.props.first);
    let idxLast: number = pValues.indexOf(this.props.last);
    if (idxFirst < 0) {
      idxFirst = 0;
    }
    if (idxLast < 0) {
      idxLast = lastIdx;
    }

    // Update initial state
    this.state = {
      first: idxFirst,
      last: idxLast,
      possibleValues: pValues,
      tickValues: tickVals
    };
  }

  // default formatter
  @boundMethod
  public formatter(data: any): any {
    if (data.toFixed) {
      return data.toFixed(5);
    }
    return data;
  }

  // formats the tick indexes for display only
  @boundMethod
  public tickValue(index: number): string {
    const tickIndex: number = this.state.tickValues[index];
    const realValue: number = this.state.possibleValues[tickIndex];

    if (!realValue) {
      return ""; // Leave blank if real value is undefined for whatever reason
    }

    if (realValue.toString().length > 8) {
      return realValue.toExponential(4);
    }
    return realValue.toString();
  }

  @boundMethod
  public handleSliderUpdate(e: any): void {
    if (e.length !== 2) {
      return;
    }

    this.setState({
      first: e[0],
      last: e[1]
    });
  }

  @boundMethod
  public handleSliderChange(e: any): void {
    if (e.length !== 2) {
      return;
    }
    this.props.updateDimInfo(
      {
        first: this.state.possibleValues[e[0]],
        last: this.state.possibleValues[e[1]],
        name: this.props.name
      },
      this.props.varID
    );
  }

  public render(): JSX.Element {
    return (
      <div
        data-axisname={this.props.name}
        className={/*@tag<dimension-slider>*/ "dimension-slider-vcdat"}
      >
        {!this.singleValue && (
          <div className={"form-inline"}>
            <div style={centered}>
              <Row>
                <Col xs="auto"> {this.props.name} </Col>
                <Col xs="auto"> {this.props.units} </Col>
              </Row>
            </div>
            <Slider
              mode={1}
              step={1}
              domain={this.domain}
              rootStyle={sliderStyle}
              onChange={this.handleSliderChange}
              onUpdate={this.handleSliderUpdate}
              values={[this.state.first, this.state.last]}
            >
              <Rail>
                {({ getRailProps }) => (
                  <div style={railStyle} {...getRailProps()} />
                )}
              </Rail>
              <Handles>
                {({ handles, getHandleProps }) => (
                  <div
                    className={/*@tag<slider-handles>*/ "slider-handles-vcdat"}
                  >
                    {handles.map(handle => (
                      <Handle
                        key={handle.id}
                        handle={handle}
                        domain={this.domain}
                        getHandleProps={getHandleProps}
                      />
                    ))}
                  </div>
                )}
              </Handles>
              <Tracks left={false} right={false}>
                {({ tracks, getTrackProps }) => (
                  <div
                    className={/*@tag<slider-tracks>*/ "slider-tracks-vcdat"}
                  >
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
                  <div className={/*@tag<slider-ticks>*/ "slider-ticks-vcdat"}>
                    {ticks.map((tick: SliderItem, idx: number) => (
                      <Tick
                        key={tick.id}
                        tick={tick}
                        count={this.tickCount}
                        value={this.tickValue(idx)}
                      />
                    ))}
                  </div>
                )}
              </Ticks>
            </Slider>
            <div style={centered}>
              <Row>
                <Col xs="auto">
                  {`[${this.state.possibleValues[this.state.first]} ... ${
                    this.state.possibleValues[this.state.last]
                  }]`}
                </Col>
              </Row>
            </div>
          </div>
        )}
      </div>
    );
  }
}
