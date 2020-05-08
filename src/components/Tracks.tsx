// Dependencies
import * as React from "react";
import {
  GetHandleProps,
  GetTrackProps,
  SliderItem,
} from "react-compound-slider";

// SEE: https://codesandbox.io/s/zl8nrlp9x

// *******************************************************
// HANDLE COMPONENT
// *******************************************************
interface IHandleProps {
  domain: number[];
  handle: SliderItem;
  getHandleProps: GetHandleProps;
}

/* eslint-disable  react/prop-types */
export const Handle: React.SFC<IHandleProps> = ({
  domain: [min, max],
  handle: { id, value, percent },
  getHandleProps,
}) => (
  <div
    role="slider"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    style={{
      backgroundColor: "#34568f",
      borderRadius: "50%",
      boxShadow: "1px 1px 1px 1px rgba(0, 0, 0, 0.2)",
      cursor: "pointer",
      height: 24,
      left: `${percent}%`,
      marginLeft: "-11px",
      marginTop: "-6px",
      position: "absolute",
      width: 24,
      zIndex: 2,
    }}
    {...getHandleProps(id)}
  />
);

// *******************************************************
// TRACK COMPONENT
// *******************************************************
interface ITrackProps {
  source: SliderItem;
  target: SliderItem;
  getTrackProps: GetTrackProps;
}

// tslint:disable-next-line
export const Track: React.SFC<ITrackProps> = ({
  source,
  target,
  getTrackProps,
}) => (
  <div
    style={{
      backgroundColor: "#7aa0c4",
      borderRadius: 7,
      cursor: "pointer",
      height: 14,
      left: `${source.percent}%`,
      position: "absolute",
      width: `${target.percent - source.percent}%`,
      zIndex: 1,
    }}
    {...getTrackProps()}
  />
);

// *******************************************************
// TICK COMPONENT
// *******************************************************
interface ITickProps {
  key: string;
  tick: SliderItem;
  value: any;
  count: number;
}

// tslint:disable-next-line
export const Tick: React.SFC<ITickProps> = ({ tick, count, value }) => (
  <div>
    <div
      style={{
        backgroundColor: "rgb(200,200,200)",
        height: 5,
        left: `${tick.percent}%`,
        marginTop: 14,
        position: "absolute",
        width: 1,
      }}
    />
    <div
      style={{
        fontSize: 10,
        left: `${tick.percent}%`,
        marginLeft: `${-(100 / count) / 2}%`,
        marginTop: 22,
        position: "absolute",
        textAlign: "center",
        width: `${100 / count}%`,
      }}
    >
      {value}
    </div>
  </div>
);
