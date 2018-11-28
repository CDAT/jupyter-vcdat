export default class Variable {
  name: string; // the name of the variable
  longName: string; // the long name of the variable
  axisList: Array<string>; // list of the axis names
  axisInfo: any; // an object with maps from axis names, to axis info
  data: any; // the variable values
}
