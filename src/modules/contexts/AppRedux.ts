import { BASE_COLORMAPS, BASE_GRAPHICS, BASE_TEMPLATES } from "../constants";

export type AppAction =
  | { type: "reset" }
  | { type: "setSavePlotAlert"; value: boolean }
  | { type: "setExportSuccessAlert"; value: boolean }
  | { type: "setSidecarToRight"; value: boolean }
  | { type: "setColormaps"; value: string[] }
  | { type: "setGraphicsMethods"; value: { [dataName: string]: string[] } }
  | { type: "setTemplates"; value: string[] };

export type AppState = {
  savePlotAlert: boolean;
  exportSuccessAlert: boolean;
  sidecarToRight: boolean;
  colormaps: string[];
  graphicsMethods: { [dataName: string]: string[] };
  templates: string[];
};

export type AppDispatch = (action: AppAction) => void;

export const initialAppState: AppState = {
  exportSuccessAlert: false,
  savePlotAlert: false,
  sidecarToRight: true,
  colormaps: BASE_COLORMAPS,
  graphicsMethods: BASE_GRAPHICS,
  templates: BASE_TEMPLATES,
};

export const AppActions = {
  reset: (): AppAction => {
    return { type: "reset" };
  },
  setExportSuccessAlert: (value: boolean): AppAction => {
    return { type: "setExportSuccessAlert", value };
  },
  setSavePlotAlert: (value: boolean): AppAction => {
    return { type: "setSavePlotAlert", value };
  },
  setSidecarToRight: (sidecarToRight: boolean): AppAction => {
    return { type: "setSidecarToRight", value: sidecarToRight };
  },
  setColormaps: (colormaps: string[]): AppAction => {
    return { type: "setColormaps", value: colormaps };
  },
  setGraphicsMethods: (methods: {
    [dataName: string]: string[];
  }): AppAction => {
    return { type: "setGraphicsMethods", value: methods };
  },
  setTemplates: (templates: string[]): AppAction => {
    return { type: "setTemplates", value: templates };
  },
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "reset": {
      return initialAppState;
    }
    case "setColormaps": {
      return { ...state, colormaps: action.value };
    }
    case "setExportSuccessAlert": {
      return { ...state, exportSuccessAlert: action.value };
    }
    case "setGraphicsMethods": {
      return { ...state, graphicsMethods: action.value };
    }
    case "setSavePlotAlert": {
      return { ...state, savePlotAlert: action.value };
    }
    case "setSidecarToRight": {
      return { ...state, sidecarToRight: action.value };
    }
    case "setTemplates": {
      return { ...state, templates: action.value };
    }
    default: {
      return state;
    }
  }
}
