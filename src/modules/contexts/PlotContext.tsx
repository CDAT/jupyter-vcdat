import React from "react";
import { DISPLAY_MODE } from "../constants";

type Action =
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

type State = {
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
type Dispatch = (action: Action) => void;

type PlotProviderProps = { children: React.ReactNode };

const initialState: State = {
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

const PlotAction = {
  reset: (): Action => {
    return { type: "reset" };
  },
  selectColormap: (colormap: string): Action => {
    return { type: "selectColormap", value: colormap };
  },
  setDisplayMode: (displayMode: DISPLAY_MODE): Action => {
    return { type: "setDisplayMode", value: displayMode };
  },
  selectGM: (graphicMethod: string): Action => {
    return { type: "selectGM", value: graphicMethod };
  },
  selectGMGroup: (gmGroup: string): Action => {
    return { type: "selectGMGroup", value: gmGroup };
  },
  selectTemplate: (template: string): Action => {
    return { type: "selectTemplate", value: template };
  },
  setAnimateAxisInvert: (value: boolean): Action => {
    return { type: "setAnimateAxisInvert", value };
  },
  setAnimationAxisIndex: (index: number): Action => {
    return { type: "setAnimationAxisIndex", value: index };
  },
  setAnimationRate: (rate: number): Action => {
    return { type: "setAnimationRate", value: rate };
  },
  setPlotExist: (plotExists: boolean): Action => {
    return { type: "setPlotExists", value: plotExists };
  },
  setPlotName: (name: string): Action => {
    return { type: "setPlotName", value: name };
  },
  setPlotReady: (plotReady: boolean): Action => {
    return { type: "setPlotReady", value: plotReady };
  },
  setOverlayMode: (overlayOn: boolean): Action => {
    return { type: "setOverlayMode", value: overlayOn };
  },
  setPlotFormat: (format: string): Action => {
    return { type: "setPlotFormat", value: format };
  },
};

function plotReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset": {
      return initialState;
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

const PlotStateContext = React.createContext<State | undefined>(undefined);
const PlotDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

// eslint-disable-next-line react/display-name
const PlotProvider = ({ children }: PlotProviderProps): JSX.Element => {
  const [state, dispatch] = React.useReducer(plotReducer, initialState);

  return (
    <PlotStateContext.Provider value={state}>
      <PlotDispatchContext.Provider value={dispatch}>
        {children}
      </PlotDispatchContext.Provider>
    </PlotStateContext.Provider>
  );
};
function usePlotState(): State {
  const context = React.useContext(PlotStateContext);
  if (context === undefined) {
    throw new Error("usePlotState must be used within PlotProvider");
  }
  return context;
}

function usePlotDispatch(): Dispatch {
  const context = React.useContext(PlotDispatchContext);
  if (context === undefined) {
    throw new Error("usePlotDispatch must be used within a PlotProvider");
  }
  return context;
}

function usePlot(): [State, Dispatch] {
  return [usePlotState(), usePlotDispatch()];
}

export { PlotProvider, usePlot, PlotAction };
