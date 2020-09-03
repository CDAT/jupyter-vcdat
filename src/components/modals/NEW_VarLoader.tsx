// tslint:disable-next-line
import "bootstrap/dist/css/bootstrap.min.css";

// Dependencies
import React, { useState } from "react";
import * as _ from "lodash";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

// Project Components
import AxisInfo from "../../modules/types/AxisInfo";
import VarCard from "../NEW_VarCard";
import Variable from "../../modules/types/Variable";
import VariableTracker from "../../modules/VariableTracker";
import NotebookUtilities from "../../modules/Utilities/NotebookUtilities";
import { useModal, ModalAction } from "../../modules/contexts/ModalContext";
import {
  useVariable,
  variableSort,
} from "../../modules/contexts/VariableContext";

const modalOverflow: React.CSSProperties = {
  maxHeight: "70vh",
  overflow: "auto",
};
const noScroll: React.CSSProperties = {
  overflow: "hidden",
};

interface IVarLoaderProps {
  modalID: string;
  loadSelectedVariables: (variables: Variable[]) => Promise<void>; // function to call when user hits load
  varTracker: VariableTracker;
}
export interface IVarLoaderState {
  selections: Variable[]; // the variables the user has selected to be loaded
  variablesToShow: Variable[];
}

const initialState: IVarLoaderState = {
  selections: [],
  variablesToShow: [],
};

const VarLoader = (props: IVarLoaderProps): JSX.Element => {
  const [state, setState] = useState<IVarLoaderState>(initialState);
  const [modalState, modalDispatch] = useModal();
  const [varState, varDispatch] = useVariable();

  const reset = (): void => {
    setState(initialState);
  };

  /**
   * @description Toggles the variable loader modal
   */
  const toggle = (): void => {
    // Reset the state of the var loader, then toggle
    reset();
    modalDispatch(ModalAction.toggle(props.modalID));
  };

  const isSelected = (varID: string): boolean => {
    const variables: Variable[] = state.selections;

    return variables.some((variable: Variable) => {
      return variable.varID === varID;
    });
  };

  // Loads all the selected variables into the notebook, returns the number loaded
  const loadSelectedVariables = async (
    varsToLoad: Variable[]
  ): Promise<void> => {
    // Exit early if no variable selected for loading
    if (state.selections.length === 0) {
      state.selections = [];
      return;
    }

    // Exit early if duplicate variable names found
    const varCount: { [varAlias: string]: Variable } = {};
    const duplicates: Variable[] = Array<Variable>();
    varsToLoad.forEach((variable: Variable) => {
      if (!varCount[variable.alias]) {
        varCount[variable.alias] = variable;
      } else {
        duplicates.push(variable);
      }
    });

    if (duplicates.length > 0) {
      await NotebookUtilities.showMessage(
        "Notice",
        `You cannot load multiple variables of the same name. \
        Rename each variable to a unique name before loading.`,
        "Dismiss"
      );
      // Deselect all variables with same name
      duplicates.forEach((variable: Variable) => {
        deselectVariableForLoad(variable);
      });
      return;
    }

    // Reset the state of the var loader when done
    reset();

    await props.loadSelectedVariables(varsToLoad);

    // Save the notebook after variables have been added
    await props.varTracker.saveMetaData();
  };

  /**
   *
   * @param variable The Variable the user has selected to get loaded
   */
  const selectVariableForLoad = (variable: Variable): void => {
    const newSelection: Variable[] = state.selections || Array<Variable>();

    newSelection.push(variable);
    setState({ ...state, selections: newSelection });
  };

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  const deselectVariableForLoad = (variable: Variable): void => {
    const idx: number = props.varTracker.findVariableByAlias(
      variable.alias,
      state.selections
    )[0];
    const selectedVars: Variable[] = state.selections;
    if (idx >= 0) {
      selectedVars.splice(idx, 1);
    }
    state.selections = selectedVars;
  };

  const handleSearchChange = (e: any): void => {
    const value = e.target.value;

    if (value.length < 1) {
      setState({
        ...state,
        variablesToShow: varState.fileVariables,
      });
      return;
    }

    const targets = Array<string>();
    varState.fileVariables.forEach((variable: Variable) => {
      targets.push(variable.alias);
    });

    const re = new RegExp(value, "i");
    const isMatch = (result: string): boolean => re.test(result);

    const searchResults = _.filter(targets, isMatch);
    const newVarsToShow: Variable[] = [];
    searchResults.forEach((searchName: string) => {
      varState.fileVariables.forEach((v: Variable) => {
        if (v.alias === searchName) {
          newVarsToShow.push(v);
        }
      });
    });
    setState({ ...state, variablesToShow: newVarsToShow.sort(variableSort) });
  };

  const varAliasExists = (
    alias: string,
    varLoaderSelection: boolean
  ): boolean => {
    let array: Variable[] = props.varTracker.variables;
    if (varLoaderSelection) {
      array = state.selections;
    }
    return props.varTracker.findVariableByAlias(alias, array)[0] >= 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };

  const handleLoadClick = (): void => {
    modalDispatch(ModalAction.hide());
    loadSelectedVariables(state.selections);
  };

  return (
    <div>
      <Modal
        isOpen={modalState.modalOpen === props.modalID}
        toggle={toggle}
        size="lg"
      >
        <ModalHeader toggle={toggle}>Load Variable</ModalHeader>
        <ModalBody
          className={/* @tag<var-loader-modal>*/ "var-loader-modal-vcdat"}
        >
          <div
            style={noScroll}
            className={/* @tag<var-loader-search>*/ "var-loader-search-vcdat"}
          >
            <form>
              <label>
                Search:
                <input
                  className={
                    /* @tag<var-loader-search-input>*/ "var-loader-search-input-vcdat"
                  }
                  type="text"
                  name="name"
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                />
              </label>
            </form>
          </div>
          <div
            style={modalOverflow}
            className={/* @tag<var-loader-items>*/ "var-loader-items-vcdat"}
          >
            {state.variablesToShow.length !== 0 &&
              state.variablesToShow.map((item: Variable) => {
                return (
                  <VarCard
                    varAliasExists={varAliasExists}
                    isSelected={isSelected}
                    selected={isSelected(item.varID)}
                    key={item.name}
                    variable={item}
                    selectVariable={selectVariableForLoad}
                    deselectVariable={deselectVariableForLoad}
                  />
                );
              })}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className={
              /* @tag<var-loader-load-btn>*/ "var-loader-load-btn-vcdat"
            }
            outline={true}
            active={state.selections.length > 0}
            color="primary"
            onClick={handleLoadClick}
          >
            Load
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default VarLoader;
