import React, { forwardRef, useImperativeHandle, Ref } from "react";

type Action =
  | { type: "show"; modalID: string }
  | { type: "hide" }
  | { type: "toggle"; modalID: string };

type State = { modalOpen: string | null };
type Dispatch = (action: Action) => void;

type ModalProviderProps = { children: React.ReactNode };

interface IModalProviderRef {
  state: State;
  dispatch: Dispatch;
}

const initialState: State = {
  modalOpen: null,
};

// Action creator
const ModalAction = {
  show: (id: string): Action => {
    return { type: "show", modalID: id };
  },
  hide: (): Action => {
    return { type: "hide" };
  },
  toggle: (id: string): Action => {
    return { type: "toggle", modalID: id };
  },
};

// Reducer
function modalReducer(state: State, action: Action): State {
  switch (action.type) {
    case "show": {
      return { ...state, modalOpen: action.modalID };
    }
    case "hide": {
      return { ...state, modalOpen: "none" };
    }
    case "toggle": {
      if (state.modalOpen === "none") {
        return { ...state, modalOpen: action.modalID };
      } else {
        return { ...state, modalOpen: "none" };
      }
    }
    default: {
      return state;
    }
  }
}

// Create state and dispatch contexts
const ModalStateContext = React.createContext<State | undefined>(undefined);
const ModalDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

// eslint-disable-next-line react/display-name
const ModalProvider = forwardRef(
  (
    { children }: ModalProviderProps,
    ref: Ref<IModalProviderRef>
  ): JSX.Element => {
    const [state, dispatch] = React.useReducer(modalReducer, initialState);

    // Provides functions to the component's ref for use outside component
    useImperativeHandle(ref, () => ({ state, dispatch }));

    return (
      <ModalStateContext.Provider value={state}>
        <ModalDispatchContext.Provider value={dispatch}>
          {children}
        </ModalDispatchContext.Provider>
      </ModalStateContext.Provider>
    );
  }
);

function useModalState(): State {
  const context = React.useContext(ModalStateContext);
  if (context === undefined) {
    throw new Error("useModalState must be used within ModalProvider");
  }
  return context;
}

function useModalDispatch(): Dispatch {
  const context = React.useContext(ModalDispatchContext);
  if (context === undefined) {
    throw new Error("useModalDispatch must be used within a ModalProvider");
  }
  return context;
}

function useModal(): [State, Dispatch] {
  return [useModalState(), useModalDispatch()];
}

export { ModalProvider, useModal, ModalAction, IModalProviderRef };
