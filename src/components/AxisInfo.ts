export class AxisInfo {
  public data: number[]; // the raw axis data
  public isTime: boolean; // is this a time axis
  public modulo: number; // is this axis repeating
  public moduloCycle: number;
  public updateDimInfo: any;
  public name: string; // the name of the axis
  public shape: number[]; // the shape of the axis
  public units: string; // what units this is measuring
  public min: number;
  public max: number;
}
