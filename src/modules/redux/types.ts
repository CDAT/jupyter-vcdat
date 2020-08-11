import { NotebookPanel } from "@jupyterlab/notebook";
import { DISPLAY_MODE, NOTEBOOK_STATE } from "../constants";

export type AxisInfo = {
  data: number[]; // the raw axis data
  isTime: boolean; // is this a time axis
  modulo: number; // is this axis repeating
  moduloCycle: number;
  updateDimInfo: any;
  name: string; // the name of the axis
  shape: number[]; // the shape of the axis
  units: string; // what units this is measuring
  first: number;
  last: number;
};

export type Variable = {
  varID: string; // Unique id based on the name and alias of the variable
  name: string; // the name of the variable
  alias: string; // the display name of the variable
  longName: string; // the long name of the variable
  axisList: string[]; // list of the axis names
  axisInfo: AxisInfo[]; // an object with maps from axis names, to axis info
  units: string; // the units this data is measured in
  sourceName: string; // the name of the file that holds this variables' data
};

export type VariableState = {
  loadedVariables: Variable[];
  derivedVariables: Variable[];
  selectedVariables: string[];
};

export type NotebookState = {
  kernelId: string;
  notebook: NotebookPanel;
  status: NOTEBOOK_STATE;
  varState: VariableState;
};

export interface IState {
  notebookState: NotebookState;
  displayMode: DISPLAY_MODE;
}

// ACTION NAMES
export const SET_CURRENT_NOTEBOOK = "set_current_notebook";
export const SET_DISPLAY_MODE = "set_display_mode";

interface ISetNotebookAction {
  type: typeof SET_CURRENT_NOTEBOOK;
  payload: NotebookPanel;
}

interface ISetDisplayMode {
  type: typeof SET_DISPLAY_MODE;
  payload: DISPLAY_MODE;
}

export type ActionTypes = ISetNotebookAction | ISetDisplayMode;
