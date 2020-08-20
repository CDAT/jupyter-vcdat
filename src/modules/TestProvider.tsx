import React, { forwardRef, useImperativeHandle, Ref } from "react";

type Action =
  | { type: "reset" }
  | { type: "setPlot"; value: boolean }
  | { type: "setPlotExists"; value: boolean };
type Dispatch = (acion: Action) => void;
type TestProviderProps = { children: React.ReactNode };

type State = {
  plotReady: boolean;
  plotExists: boolean;
};

const initialState: State = {
  plotExists: false,
  plotReady: false,
};

function testReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset": {
      return initialState;
    }
    case "setPlot": {
      return { ...state, plotReady: action.value };
    }
    case "setPlotExists": {
      return { ...state, plotExists: action.value };
    }
    default: {
      return state;
    }
  }
}

export const TestStateContext = React.createContext<State | undefined>(
  undefined
);
export const TestDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

export interface IProviderRef {
  state: State;
  dispatch: Dispatch;
}

// eslint-disable-next-line react/display-name
const TestProvider = forwardRef(
  ({ children }: TestProviderProps, ref: Ref<IProviderRef>): JSX.Element => {
    const [state, dispatch] = React.useReducer(testReducer, initialState);
    useImperativeHandle(ref, () => ({ state, dispatch }));

    return (
      <TestStateContext.Provider value={state}>
        <TestDispatchContext.Provider value={dispatch}>
          {children}
        </TestDispatchContext.Provider>
      </TestStateContext.Provider>
    );
  }
);

function useTestState(): State {
  const context = React.useContext(TestStateContext);
  if (context === undefined) {
    throw new Error("useTestState must be used within TestProvider");
  }
  return context;
}

function useTestDispatch(): Dispatch {
  const context = React.useContext(TestDispatchContext);
  if (context === undefined) {
    throw new Error("useTestDispatch must be used within a TestProvider");
  }
  return context;
}

function useTest(): [State, Dispatch] {
  return [useTestState(), useTestDispatch()];
}

export { TestProvider, useTest, useTestState, useTestDispatch };
