import AxisInfo from "./AxisInfo";

export default class Variable {
  name: string; // the name of the variable
  cdmsID: string; // the id of the variable from the file
  longName: string; // the long name of the variable
  axisList: Array<string>; // list of the axis names
  axisInfo: Array<AxisInfo>; // an object with maps from axis names, to axis info
  units: string; // the units this data is measured in
}