import { NotebookPanel } from "@jupyterlab/notebook";
import actionCreatorFactory from "../../utils/ActionCreator";
import { SET_CURRENT_NOTEBOOK, SET_DISPLAY_MODE, IState } from "../types";
import { DISPLAY_MODE } from "../../constants";

console.log(__filename);
const actionCreator = actionCreatorFactory("vcdatApp");

// COMPONENT CONVENIENCE FUNCTIONS
/* export const readState = (): IState => {
  return useSelector((state: IState) => state);
};*/

// ACTION CREATORS
export const setCurrentNotebook = actionCreator<NotebookPanel>(
  SET_CURRENT_NOTEBOOK
);
export const setDisplayMode = actionCreator<DISPLAY_MODE>(SET_DISPLAY_MODE);
