import React from "react";

type Action =
  | { type: "reset" }
  | { type: "setAnimateAxisInvert"; value: boolean }
  | { type: "setExportSuccessAlert"; value: boolean }
  | { type: "setOverlayMode"; value: boolean }
  | { type: "setSavePlotAlert"; value: boolean }
  | { type: "setShouldAnimate"; value: boolean }
  | { type: "setAnimationAxisIndex"; value: number }
  | { type: "setAnimationRate"; value: number }
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
  exportSuccessAlert: boolean;
  overlayMode: boolean;
  plotFormat: string;
  plotName: string;
  savePlotAlert: boolean;
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
  exportSuccessAlert: false,
  overlayMode: false,
  plotFormat: "",
  plotName: "",
  savePlotAlert: false,
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
};

function plotReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset": {
      return initialState;
    }
    case "selectColormap": {
      return { ...state, selectedColormap: action.value };
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
    case "setExportSuccessAlert": {
      return { ...state, exportSuccessAlert: action.value };
    }
    case "setPlotName": {
      return { ...state, plotName: action.value };
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
