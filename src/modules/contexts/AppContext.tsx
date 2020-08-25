import React, { forwardRef, useImperativeHandle, Ref } from "react";

type Action = { type: "reset" };
type Dispatch = (action: Action) => void;
type AppProviderProps = { children: React.ReactNode };

interface IAppProviderRef {
  state: State;
  dispatch: Dispatch;
}

type State = {
  overlayMode: boolean;
};

const initialState: State = {
  overlayMode: false,
};

function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset": {
      return initialState;
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

    useImperativeHandle(ref, () => ({ state, dispatch }));

    return (
      <AppStateContext.Provider value={state}>
        <AppDispatchContext.Provider value={dispatch}>
          {children}
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

export { AppProvider, IAppProviderRef, useApp, Action };
