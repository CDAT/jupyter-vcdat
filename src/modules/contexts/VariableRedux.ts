import Variable from "../types/Variable";

export type VariableInfo = {
  [alias: string]: { name: string; source: string };
};

export type VariableAction =
  | { type: "reset" }
  | { type: "setCurrentFile"; value: string }
  | { type: "setVariables"; value: Variable[] }
  | { type: "setFileVariables"; value: Variable[] }
  | { type: "setSelectedVariables"; value: string[] }
  | { type: "setVariableInfo"; value: VariableInfo }
  | { type: "selectVariable"; value: string }
  | { type: "deselectVariable"; value: string };

export type VariableState = {
  currentFile: string;
  variables: Variable[];
  fileVariables: Variable[];
  selectedVariables: string[];
  variableInfo: VariableInfo;
};

export type VariableDispatch = (action: VariableAction) => void;

export const initialVariableState: VariableState = {
  currentFile: "",
  variables: [],
  fileVariables: [],
  selectedVariables: [],
  variableInfo: {},
};

export const VariableActions = {
  reset: (): VariableAction => {
    return { type: "reset" };
  },
  setCurrentFile: (filePath: string): VariableAction => {
    return { type: "setCurrentFile", value: filePath };
  },
  setVariables: (variables: Variable[]): VariableAction => {
    return { type: "setVariables", value: variables };
  },
  setFileVariables: (variables: Variable[]): VariableAction => {
    return { type: "setFileVariables", value: variables };
  },
  setSelectedVariables: (variables: string[]): VariableAction => {
    return { type: "setSelectedVariables", value: variables };
  },
  setVariableInfo: (variableInfo: VariableInfo): VariableAction => {
    return { type: "setVariableInfo", value: variableInfo };
  },
  selectVariable: (variableID: string): VariableAction => {
    return { type: "selectVariable", value: variableID };
  },
  deselectVariable: (variableID: string): VariableAction => {
    return { type: "deselectVariable", value: variableID };
  },
};

export const variableSort = (a: Variable, b: Variable): number => {
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

export function variableReducer(
  state: VariableState,
  action: VariableAction
): VariableState {
  switch (action.type) {
    case "reset": {
      return initialVariableState;
    }
    case "setCurrentFile": {
      return { ...state, currentFile: action.value };
    }
    case "setVariables": {
      return { ...state, variables: action.value };
    }
    case "setFileVariables": {
      return { ...state, fileVariables: action.value };
    }
    case "setSelectedVariables": {
      return { ...state, selectedVariables: action.value };
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
