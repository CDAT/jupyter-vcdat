import AxisInfo from "./AxisInfo";

export default class Variable {
  public name: string; // the name of the variable
  public cdmsID: string; // the id of the variable from the file
  public longName: string; // the long name of the variable
  public axisList: string[]; // list of the axis names
  public axisInfo: AxisInfo[]; // an object with maps from axis names, to axis info
  public units: string; // the units this data is measured in
}
