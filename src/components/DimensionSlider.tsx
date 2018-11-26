import * as React from "react";
import * as _ from "lodash";
import * as moment from "moment";

import { Slider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider';
import { Handle, Track, Tick } from './Tracks';

const sliderStyle: React.CSSProperties = {
    marginLeft: '5%',
    marginRight: '5%',
    marginBottom: '5%',
    position: 'relative',
    width: '90%'
};

const railStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: 14,
    borderRadius: 7,
    cursor: 'pointer',
    backgroundColor: 'rgb(155,155,155)'
};

const unitsStyle: React.CSSProperties = {
    marginLeft: '5%'
};

type DimensionSliderProps = {
    data: number[],         // the raw axis data
    isTime: boolean,        // is this a time axis
    modulo: any,            // ???
    moduloCycle: number,    // ???
    name: string,           // the cdms2 name of the axis
    shape: number[],        // the shape of the axis
    units: string,          // the units of the axis
    updateDimInfo: any      // method to be called updating the parent when the slider values change
}

type DimensionSliderState = {
    min: number,            // the current minimum value
    max: number,            // the current max value
    values: number[]        // the absolute min and absolute max values
}


export class DimensionSlider extends React.Component<DimensionSliderProps, DimensionSliderState> {
    singleValue: boolean;
    constructor(props: DimensionSliderProps) {
        super(props);
        let format: any;
        let possible_values = props.data;
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
            this.formatter = function (data) {
                return moment(startTime, "YYYY-MM-DD")
                    .add(data, span)
                    .format(format);
            };
            this.formatter.bind(this);
        }
        if (props.modulo) {
            let new_possible_values = [];
            let step = Math.abs(props.data[0] - props.data[1]);
            for (let i = -props.modulo; i <= props.modulo; i += step) {
                new_possible_values.push(i);
            }
            possible_values = new_possible_values;
        }
        this.singleValue = props.data.length == 1;

        let pValues = possible_values.map((item: any) => {
            return Math.floor(item);
        })
        this.state = {
            min: pValues[0],
            max: pValues[pValues.length - 1],
            values: [
                props.data[0],
                props.data[props.data.length - 1]
            ],
        };
        this.props.updateDimInfo({
            name: this.props.name,
            min: this.state.values[0],
            max: this.state.values[1]
        });
    }

    // default formatter
    formatter(data: any) {
        if (data.toFixed) {
            return data.toFixed(5);
        }
        return data;
    };

    render() {
        let step = 1;
        let tickCount = 10;
        return (
            <div className="dimension-slider">
                {!this.singleValue && (
                    <div className="form-inline">
                        <small className="units" style={unitsStyle}>
                            {this.state.values[0]}...{this.state.values[1]}: ({this.props.units})
                        </small>
                        <Slider
                            mode={2}
                            step={step}
                            domain={[this.state.min, this.state.max]}
                            rootStyle={sliderStyle}
                            onUpdate={this.handleSliderChange}
                            values={[this.state.min, this.state.max]}>
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
                            <Tracks right={false}>
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
                            <Ticks count={tickCount}>
                                {({ ticks }) => (
                                    <div className="slider-ticks">
                                        {ticks.map(tick => (
                                            <Tick key={tick.id} tick={tick} count={ticks.length} />
                                        ))}
                                    </div>
                                )}
                            </Ticks>
                        </Slider>
                    </div>
                )}
            </div>
        );
    }
    handleSliderChange(e: any) {
        this.setState({
            values: e
        });
        this.props.updateDimInfo({
            name: this.props.name,
            min: this.state.values[0],
            max: this.state.values[1]
        });
    }
}

export default DimensionSlider;
