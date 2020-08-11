import { IState } from "../types";
import { initState } from "../store/index";
import { setCurrentNotebook, setDisplayMode } from "../actions";
import { isType } from "../../utils/ActionCreator";
import { Action } from "redux";

const vcdatApp = (state: IState = initState, action: Action): IState => {
  if (isType(action, setCurrentNotebook)) {
    return {
      ...state,
      notebookState: { ...state.notebookState, notebook: action.payload },
    };
  }
  if (isType(action, setDisplayMode)) {
    console.log(action);
    return { ...state, displayMode: action.payload };
  }
  return state;
};

export default vcdatApp;
