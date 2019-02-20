export default class AxisInfo {
    data: Array<number>;    // the raw axis data
    isTime: boolean;        // is this a time axis
    modulo: number;         // is this axis repeating
    moduloCycle: number;
    updateDimInfo: any;
    name: string;           // the name of the axis
    shape: Array<number>;   // the shape of the axis
    units: string;          // what units this is measuring
    min: number;
    max: number;
}