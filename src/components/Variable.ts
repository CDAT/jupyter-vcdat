import { AxisInfo } from "./AxisInfo";

export class Variable {
  public name: string; // the name of the variable
  public longName: string; // the long name of the variable
  public axisList: string[]; // list of the axis names
  public axisInfo: AxisInfo[]; // an object with maps from axis names, to axis info
  public units: string; // the units this data is measured in
  public pythonID: number; // the id of the variable from the file
  public sourceName: string; // the name of the data variable that holds this variables' data
}
