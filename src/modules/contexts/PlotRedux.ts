import { DISPLAY_MODE } from "../constants";

export type PlotAction =
  | { type: "reset" }
  | { type: "setAnimateAxisInvert"; value: boolean }
  | { type: "setDisplayMode"; value: DISPLAY_MODE }
  | { type: "setOverlayMode"; value: boolean }
  | { type: "setShouldAnimate"; value: boolean }
  | { type: "setAnimationAxisIndex"; value: number }
  | { type: "setAnimationRate"; value: number }
  | { type: "setPlotExists"; value: boolean }
  | { type: "setPlotReady"; value: boolean }
  | { type: "setPlotFormat"; value: string }
  | { type: "setPlotName"; value: string }
  | { type: "selectColormap"; value: string }
  | { type: "selectGM"; value: string }
  | { type: "selectGMGroup"; value: string }
  | { type: "selectTemplate"; value: string };

export type PlotState = {
  animateAxisInvert: boolean;
  animationAxisIndex: number;
  animationRate: number;
  plotExists: boolean;
  previousDisplayMode: DISPLAY_MODE;
  currentDisplayMode: DISPLAY_MODE;
  overlayMode: boolean;
  plotFormat: string;
  plotName: string;
  plotReady: boolean;
  selectedColormap: string;
  selectedGM: string;
  selectedGMgroup: string;
  selectedTemplate: string;
  shouldAnimate: boolean;
};

export type PlotDispatch = (action: PlotAction) => void;

export const initialPlotState: PlotState = {
  animateAxisInvert: false,
  animationAxisIndex: 0,
  animationRate: 5,
  previousDisplayMode: DISPLAY_MODE.None,
  currentDisplayMode: DISPLAY_MODE.Notebook,
  overlayMode: false,
  plotExists: false,
  plotFormat: "",
  plotName: "",
  plotReady: false,
  selectedColormap: "",
  selectedGM: "",
  selectedGMgroup: "",
  selectedTemplate: "",
  shouldAnimate: false,
};

export const PlotActions = {
  reset: (): PlotAction => {
    return { type: "reset" };
  },
  selectColormap: (colormap: string): PlotAction => {
    return { type: "selectColormap", value: colormap };
  },
  setDisplayMode: (displayMode: DISPLAY_MODE): PlotAction => {
    return { type: "setDisplayMode", value: displayMode };
  },
  selectGM: (graphicMethod: string): PlotAction => {
    return { type: "selectGM", value: graphicMethod };
  },
  selectGMGroup: (gmGroup: string): PlotAction => {
    return { type: "selectGMGroup", value: gmGroup };
  },
  selectTemplate: (template: string): PlotAction => {
    return { type: "selectTemplate", value: template };
  },
  setAnimateAxisInvert: (value: boolean): PlotAction => {
    return { type: "setAnimateAxisInvert", value };
  },
  setAnimationAxisIndex: (index: number): PlotAction => {
    return { type: "setAnimationAxisIndex", value: index };
  },
  setAnimationRate: (rate: number): PlotAction => {
    return { type: "setAnimationRate", value: rate };
  },
  setPlotExist: (plotExists: boolean): PlotAction => {
    return { type: "setPlotExists", value: plotExists };
  },
  setPlotName: (name: string): PlotAction => {
    return { type: "setPlotName", value: name };
  },
  setPlotReady: (plotReady: boolean): PlotAction => {
    return { type: "setPlotReady", value: plotReady };
  },
  setOverlayMode: (overlayOn: boolean): PlotAction => {
    return { type: "setOverlayMode", value: overlayOn };
  },
  setPlotFormat: (format: string): PlotAction => {
    return { type: "setPlotFormat", value: format };
  },
};

export function plotReducer(state: PlotState, action: PlotAction): PlotState {
  switch (action.type) {
    case "reset": {
      return initialPlotState;
    }
    case "selectColormap": {
      return { ...state, selectedColormap: action.value };
    }
    case "setDisplayMode": {
      return {
        ...state,
        previousDisplayMode: state.currentDisplayMode,
        currentDisplayMode: action.value,
      };
    }
    case "selectGM": {
      return { ...state, selectedGM: action.value };
    }
    case "selectGMGroup": {
      return { ...state, selectedGMgroup: action.value };
    }
    case "selectTemplate": {
      return { ...state, selectedTemplate: action.value };
    }
    case "setAnimateAxisInvert": {
      return { ...state, animateAxisInvert: action.value };
    }
    case "setAnimationAxisIndex": {
      return { ...state, animationAxisIndex: action.value };
    }
    case "setAnimationRate": {
      return { ...state, animationRate: action.value };
    }
    case "setPlotExists": {
      return { ...state, plotExists: action.value };
    }
    case "setPlotName": {
      return { ...state, plotName: action.value };
    }
    case "setPlotReady": {
      return { ...state, plotReady: action.value };
    }
    case "setOverlayMode": {
      return { ...state, overlayMode: action.value };
    }
    case "setPlotFormat": {
      return { ...state, plotFormat: action.value };
    }
    default: {
      return state;
    }
  }
}
