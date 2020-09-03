import React from "react";
import Variable from "../types/Variable";

type VariableInfo = { [alias: string]: { name: string; source: string } };

type Action =
  | { type: "reset" }
  | { type: "setCurrentFile"; value: string }
  | { type: "setVariables"; value: Variable[] }
  | { type: "setFileVariables"; value: Variable[] }
  | { type: "setSelectedVariables"; value: string[] }
  | { type: "setVariableInfo"; value: VariableInfo }
  | { type: "selectVariable"; value: string }
  | { type: "deselectVariable"; value: string };

type State = {
  currentFile: string;
  variables: Variable[];
  fileVariables: Variable[];
  selectedVariables: string[];
  variableInfo: VariableInfo;
};
type Dispatch = (action: Action) => void;

type VariableProviderProps = { children: React.ReactNode };

const initialState: State = {
  currentFile: "",
  variables: [],
  fileVariables: [],
  selectedVariables: [],
  variableInfo: {},
};

const VariableAction = {
  reset: (): Action => {
    return { type: "reset" };
  },
  setCurrentFile: (filePath: string): Action => {
    return { type: "setCurrentFile", value: filePath };
  },
  setVariables: (variables: Variable[]): Action => {
    return { type: "setVariables", value: variables };
  },
  setFileVariables: (variables: Variable[]): Action => {
    return { type: "setFileVariables", value: variables };
  },
  setSelectedVariables: (variables: string[]): Action => {
    return { type: "setSelectedVariables", value: variables };
  },
  setVariableInfo: (variableInfo: VariableInfo): Action => {
    return { type: "setVariableInfo", value: variableInfo };
  },
  selectVariable: (variableID: string): Action => {
    return { type: "selectVariable", value: variableID };
  },
  deselectVariable: (variableID: string): Action => {
    return { type: "deselectVariable", value: variableID };
  },
};

const variableSort = (a: Variable, b: Variable): number => {
  let comp = 0;
  const aName = a.name.toLocaleLowerCase();
  const bName = b.name.toLocaleLowerCase();
  if (aName > bName) {
    comp = 1;
  } else if (aName < bName) {
    comp = -1;
  }
  return comp;
};

function variableReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset": {
      return initialState;
    }
    case "setCurrentFile": {
      return { ...state, currentFile: action.value };
    }
    case "setVariables": {
      return { ...state, variables: action.value.sort(variableSort) };
    }
    case "setFileVariables": {
      return { ...state, fileVariables: action.value.sort(variableSort) };
    }
    case "setSelectedVariables": {
      return { ...state, selectedVariables: action.value.sort() };
    }
    case "setVariableInfo": {
      return { ...state, variableInfo: action.value };
    }
    case "selectVariable": {
      const copy: string[] = [...state.selectedVariables];
      copy.push(action.value);
      return { ...state, selectedVariables: copy };
    }
    case "deselectVariable": {
      const copy: string[] = state.selectedVariables.filter(
        (selected: string) => {
          return selected !== action.value;
        }
      );
      return { ...state, selectedVariables: copy };
    }
    default: {
      return state;
    }
  }
}

const VariableStateContext = React.createContext<State | undefined>(undefined);
const VariableDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

// eslint-disable-next-line react/display-name
const VariableProvider = ({ children }: VariableProviderProps): JSX.Element => {
  const [state, dispatch] = React.useReducer(variableReducer, initialState);

  return (
    <VariableStateContext.Provider value={state}>
      <VariableDispatchContext.Provider value={dispatch}>
        {children}
      </VariableDispatchContext.Provider>
    </VariableStateContext.Provider>
  );
};
function useVariableState(): State {
  const context = React.useContext(VariableStateContext);
  if (context === undefined) {
    throw new Error("useVariableState must be used within VariableProvider");
  }
  return context;
}

function useVariableDispatch(): Dispatch {
  const context = React.useContext(VariableDispatchContext);
  if (context === undefined) {
    throw new Error(
      "useVariableDispatch must be used within a VariableProvider"
    );
  }
  return context;
}

function useVariable(): [State, Dispatch] {
  return [useVariableState(), useVariableDispatch()];
}

export { VariableProvider, useVariable, variableSort, VariableAction };
