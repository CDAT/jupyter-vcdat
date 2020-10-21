import React, { forwardRef, Ref, useImperativeHandle } from "react";
import {
  initialVariableState,
  VariableActions,
  VariableState,
  variableReducer,
  VariableAction,
  VariableDispatch,
} from "./VariableRedux";
import {
  initialModalState,
  ModalAction,
  modalReducer,
  ModalActions,
  ModalState,
  ModalDispatch,
} from "./ModalRedux";
import {
  AppAction,
  AppActions,
  AppDispatch,
  appReducer,
  AppState,
  initialAppState,
} from "./AppRedux";
import {
  initialPlotState,
  PlotAction,
  PlotActions,
  PlotDispatch,
  plotReducer,
  PlotState,
} from "./PlotRedux";
import { NotebookPanel } from "@jupyterlab/notebook";
import Variable from "../types/Variable";

type Action =
  | { type: "reset" }
  | { type: "app"; action: AppAction }
  | { type: "modal"; action: ModalAction }
  | { type: "plot"; action: PlotAction }
  | { type: "variable"; action: VariableAction };
type Dispatch = (action: Action) => void;

type State = {
  appState: AppState;
  modalState: ModalState;
  plotState: PlotState;
  variableState: VariableState;
};

const initialState: State = {
  appState: initialAppState,
  plotState: initialPlotState,
  modalState: initialModalState,
  variableState: initialVariableState,
};

type AppProviderProps = { children: React.ReactNode };

interface IAppProviderRef {
  state: State;
  dispatch: Dispatch;
  reset: () => void;
  showModal: (id: string) => void;
  hideModal: () => void;
  toggleModal: (id: string) => void;
  setSelectedVariables: (vars: string[]) => void;
  setVariables: (vars: Variable[]) => void;
}

const Actions = {
  appAction: AppActions,
  modalAction: ModalActions,
  plotAction: PlotActions,
  variableAction: VariableActions,
};

function mainReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initialState;
    case "app":
      return {
        ...state,
        appState: appReducer(state.appState, action.action as AppAction),
      };
    case "modal":
      return {
        ...state,
        modalState: modalReducer(
          state.modalState,
          action.action as ModalAction
        ),
      };
    case "plot":
      return {
        ...state,
        plotState: plotReducer(state.plotState, action.action as PlotAction),
      };
    case "variable":
      return {
        ...state,
        variableState: variableReducer(
          state.variableState,
          action.action as VariableAction
        ),
      };
    default:
      return state;
  }
}

const MainStateContext = React.createContext<State | undefined>(undefined);
const MainDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

// eslint-disable-next-line react/display-name
const MainProvider = forwardRef(
  ({ children }: AppProviderProps, ref: Ref<IAppProviderRef>): JSX.Element => {
    const [state, dispatch] = React.useReducer(mainReducer, initialState);
    const reset = (): void => {
      dispatch({ type: "reset" });
    };
    const showModal = (id: string): void => {
      dispatch({ type: "modal", action: Actions.modalAction.show(id) });
    };

    const hideModal = (): void => {
      dispatch({ type: "modal", action: Actions.modalAction.hide() });
    };

    const toggleModal = (id: string): void => {
      dispatch({ type: "modal", action: Actions.modalAction.toggle(id) });
    };
    const setSelectedVariables = (vars: string[]): void => {
      dispatch({
        type: "variable",
        action: Actions.variableAction.setSelectedVariables(vars),
      });
    };
    const setVariables = (vars: Variable[]): void => {
      dispatch({
        type: "variable",
        action: Actions.variableAction.setVariables(vars),
      });
    };

    // Provides functions to the component's ref for use outside component
    useImperativeHandle(ref, () => ({
      state,
      dispatch,
      reset,
      showModal,
      hideModal,
      toggleModal,
      setSelectedVariables,
      setVariables,
    }));

    return (
      <MainStateContext.Provider value={state}>
        <MainDispatchContext.Provider value={dispatch}>
          {children}
        </MainDispatchContext.Provider>
      </MainStateContext.Provider>
    );
  }
);
function useState(): State {
  const context = React.useContext(MainStateContext);
  if (context === undefined) {
    throw new Error("State must be used within AppProvider");
  }
  return context;
}

function useDispatch(): Dispatch {
  const context = React.useContext(MainDispatchContext);
  if (context === undefined) {
    throw new Error("Dispatch must be used within a AppProvider");
  }
  return context;
}

function useApp(): [AppState, AppDispatch] {
  const dispatch = useDispatch();
  const appDispatch = (action: AppAction): void => {
    dispatch({ type: "app", action });
  };
  return [useState().appState, appDispatch];
}

function useModal(): [ModalState, ModalDispatch] {
  const dispatch = useDispatch();
  const modalDispatch = (action: ModalAction): void => {
    dispatch({ type: "modal", action });
  };
  return [useState().modalState, modalDispatch];
}

function usePlot(): [PlotState, PlotDispatch] {
  const dispatch = useDispatch();
  const plotDispatch = (action: PlotAction): void => {
    dispatch({ type: "plot", action });
  };
  return [useState().plotState, plotDispatch];
}

function useVariable(): [VariableState, VariableDispatch] {
  const dispatch = useDispatch();
  const varDispatch = (action: VariableAction): void => {
    dispatch({ type: "variable", action });
  };
  return [useState().variableState, varDispatch];
}

export {
  MainProvider,
  useApp,
  useModal,
  usePlot,
  useVariable,
  AppActions,
  ModalActions,
  PlotActions,
  VariableActions,
  IAppProviderRef,
};
