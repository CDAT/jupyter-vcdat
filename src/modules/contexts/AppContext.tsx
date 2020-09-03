import React, { forwardRef, Ref, useImperativeHandle } from "react";
import { ModalProvider, IModalProviderRef, ModalAction } from "./ModalContext";
import { PlotProvider } from "./PlotContext";
import {
  DISPLAY_MODE,
  BASE_COLORMAPS,
  BASE_GRAPHICS,
  BASE_TEMPLATES,
} from "../constants";
import { VariableProvider } from "./VariableContext";

type Action =
  | { type: "reset" }
  | { type: "setSavePlotAlert"; value: boolean }
  | { type: "setExportSuccessAlert"; value: boolean }
  | { type: "setDisplayMode"; value: DISPLAY_MODE }
  | { type: "setSidecarToRight"; value: boolean }
  | { type: "setColormaps"; value: string[] }
  | { type: "setGraphicsMethods"; value: { [dataName: string]: string[] } }
  | { type: "setTemplates"; value: string[] }
  | { type: "setPlotExists"; value: boolean }
  | { type: "setPlotReady"; value: boolean };

type State = {
  savePlotAlert: boolean;
  exportSuccessAlert: boolean;
  displayMode: DISPLAY_MODE;
  sidecarToRight: boolean;
  colormaps: string[];
  graphicsMethods: { [dataName: string]: string[] };
  templates: string[];
  plotExists: boolean;
  plotReady: boolean;
};
type Dispatch = (action: Action) => void;

type AppProviderProps = { children: React.ReactNode };

interface IAppProviderRef {
  state: State;
  dispatch: Dispatch;
  showModal: (id: string) => void;
  hideModal: () => void;
  toggleModal: (id: string) => void;
}

const initialState: State = {
  exportSuccessAlert: false,
  savePlotAlert: false,
  displayMode: DISPLAY_MODE.Notebook,
  sidecarToRight: true,
  colormaps: BASE_COLORMAPS,
  graphicsMethods: BASE_GRAPHICS,
  templates: BASE_TEMPLATES,
  plotExists: false,
  plotReady: false,
};

const AppAction = {
  reset: (): Action => {
    return { type: "reset" };
  },
  setExportSuccessAlert: (value: boolean): Action => {
    return { type: "setExportSuccessAlert", value };
  },
  setSavePlotAlert: (value: boolean): Action => {
    return { type: "setSavePlotAlert", value };
  },
  setDisplayMode: (mode: DISPLAY_MODE): Action => {
    return { type: "setDisplayMode", value: mode };
  },
  setSidecarToRight: (sidecarToRight: boolean): Action => {
    return { type: "setSidecarToRight", value: sidecarToRight };
  },
  setColormaps: (colormaps: string[]): Action => {
    return { type: "setColormaps", value: colormaps };
  },
  setGraphicsMethods: (methods: { [dataName: string]: string[] }): Action => {
    return { type: "setGraphicsMethods", value: methods };
  },
  setTemplates: (templates: string[]): Action => {
    return { type: "setTemplates", value: templates };
  },
  setPlotExist: (plotExists: boolean): Action => {
    return { type: "setPlotExists", value: plotExists };
  },
  setPlotReady: (plotReady: boolean): Action => {
    return { type: "setPlotReady", value: plotReady };
  },
};

function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset": {
      return initialState;
    }
    case "setColormaps": {
      return { ...state, colormaps: action.value };
    }
    case "setDisplayMode": {
      return { ...state, displayMode: action.value };
    }
    case "setExportSuccessAlert": {
      return { ...state, exportSuccessAlert: action.value };
    }
    case "setGraphicsMethods": {
      return { ...state, graphicsMethods: action.value };
    }
    case "setPlotExists": {
      return { ...state, plotExists: action.value };
    }
    case "setPlotReady": {
      return { ...state, plotReady: action.value };
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

const AppStateContext = React.createContext<State | undefined>(undefined);
const AppDispatchContext = React.createContext<Dispatch | undefined>(undefined);

// eslint-disable-next-line react/display-name
const AppProvider = forwardRef(
  ({ children }: AppProviderProps, ref: Ref<IAppProviderRef>): JSX.Element => {
    const [state, dispatch] = React.useReducer(appReducer, initialState);

    const modalRef = React.createRef<IModalProviderRef>();

    const showModal = (id: string): void => {
      modalRef.current.dispatch(ModalAction.show(id));
    };

    const hideModal = (): void => {
      modalRef.current.dispatch(ModalAction.hide());
    };

    const toggleModal = (id: string): void => {
      modalRef.current.dispatch(ModalAction.toggle(id));
    };

    // Provides functions to the component's ref for use outside component
    useImperativeHandle(ref, () => ({
      state,
      dispatch,
      showModal,
      hideModal,
      toggleModal,
    }));

    return (
      <AppStateContext.Provider value={state}>
        <AppDispatchContext.Provider value={dispatch}>
          <VariableProvider>
            <PlotProvider>
              <ModalProvider ref={modalRef}>{children}</ModalProvider>
            </PlotProvider>
          </VariableProvider>
        </AppDispatchContext.Provider>
      </AppStateContext.Provider>
    );
  }
);
function useAppState(): State {
  const context = React.useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return context;
}

function useAppDispatch(): Dispatch {
  const context = React.useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error("useAppDispatch must be used within a AppProvider");
  }
  return context;
}

function useApp(): [State, Dispatch] {
  return [useAppState(), useAppDispatch()];
}

export { AppProvider, useApp, AppAction, IAppProviderRef };
