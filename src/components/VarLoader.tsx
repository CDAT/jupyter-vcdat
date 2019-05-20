// tslint:disable-next-line
import "bootstrap/dist/css/bootstrap.min.css";

// Dependencies
import * as React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

// Project Components
import { AxisInfo } from "./AxisInfo";
import { VarCard } from "./VarCard";
import { Variable } from "./Variable";
import { VariableTracker } from "../VariableTracker";
import { NotebookUtilities } from "../NotebookUtilities";
import { Signal, ISignal } from "@phosphor/signaling";

const modalOverflow: React.CSSProperties = {
  maxHeight: "70vh",
  overflow: "auto"
};

interface IVarLoaderProps {
  loadSelectedVariables: (variables: Variable[]) => Promise<void>; // function to call when user hits load
  //updateSelectedVariables: (selection: string[]) => void; // update the list of selected variables
  varTracker: VariableTracker;
}
interface IVarLoaderState {
  show: boolean; // should the modal be shown
  variables: Variable[]; // list of already loaded variables
  fileVariables: Variable[]; // the list of variables from within the file
  //unloadedVariables: string[]; // the list of variables that haven't been loaded from the file
  selectedVariables: Variable[]; // the variables the user has selected to be loaded
}

export class VarLoader extends React.Component<
  IVarLoaderProps,
  IVarLoaderState
> {
  private _selectionChanged: Signal<this, Variable[]>;

  constructor(props: IVarLoaderProps) {
    super(props);
    this.state = {
      fileVariables: Array<Variable>(),
      selectedVariables: Array<Variable>(),
      show: false,
      //unloadedVariables: Array<string>(),
      variables: this.props.varTracker.variables
    };
    this._selectionChanged = new Signal<this, Variable[]>(this);

    this.toggle = this.toggle.bind(this);
    //this.isLoaded = this.isLoaded.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.loadSelectedVariables = this.loadSelectedVariables.bind(this);
    this.selectVariableForLoad = this.selectVariableForLoad.bind(this);
    this.deselectVariableForLoad = this.deselectVariableForLoad.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.handleLoadClick = this.handleLoadClick.bind(this);
    this.renameVariable = this.renameVariable.bind(this);
    this.varAliasExists = this.varAliasExists.bind(this);
  }

  get selections(): Variable[] {
    return this.state.selectedVariables;
  }

  set selections(selections: Variable[]) {
    this.setState({ selectedVariables: selections });
    this._selectionChanged.emit(selections);
  }

  get selectionChanged(): ISignal<this, Variable[]> {
    return this._selectionChanged;
  }

  /**
   * @description Toggles the variable loader modal
   */
  public toggle(): void {
    this.setState({
      show: !this.state.show
    });
  }

  public isSelected(varID: string): boolean {
    return this.props.varTracker.findVarByID(varID, this.selections)[0] >= 0;
  }

  // Loads all the selected variables into the notebook, returns the number loaded
  public async loadSelectedVariables(varsToLoad: Variable[]): Promise<void> {
    // Exit early if no variable selected for loading
    if (this.selections.length === 0) {
      this.selections = Array<Variable>();
      return;
    }

    // Exit early if duplicate variable names found
    

    await this.props.loadSelectedVariables(varsToLoad);

    // Update the main widget's current selected variables
    //this.props.updateSelectedVariables(this.state.selectedVariables);

    // Reset the state of the var loader when done
    this.selections = Array<Variable>();
    this.setState({
      fileVariables: Array<Variable>(),
      //selectedVariables: Array<string>(),
      //unloadedVariables: Array<string>(),
      variables: Array<Variable>()
    });

    // Save the notebook after variables have been added
    await this.props.varTracker.saveMetaData();
  }

  /**
   *
   * @param variable The Variable the user has selected to get loaded
   */
  public selectVariableForLoad(variable: Variable): void {
    //this.props.varTracker.selectVariable(variable, this.selections);
    let newSelection: Array<Variable>;
    if (this.selections) {
      newSelection = this.selections;
    } else {
      newSelection = Array<Variable>();
    }
    newSelection.push(variable);
    this.selections = newSelection;
    // Update the state
    //this.setState({
    //  selectedVariables: this.state.selectedVariables.concat([varAlias])
    //});
  }

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  public deselectVariableForLoad(variable: Variable): void {
    //this.props.varTracker.deselectVariable(variable, this.selections);
    const idx: number = this.props.varTracker.findVarByID(
      variable.varID,
      this.selections
    )[0];
    let selectedVars: Variable[] = this.selections;
    if (idx >= 0) {
      selectedVars.splice(idx, 1);
    }
    this.selections = selectedVars;
  }

  // Returns true if the variable name has already been loaded into vcdat
  /*public isLoaded(varID: string): boolean {
    return this.state.unloadedVariables.indexOf(varID) < 0;
  }*/

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varID the name of the variable to update
   */
  public updateDimInfo(newInfo: any, varID: string): void {
    this.state.fileVariables.forEach(
      (fileVariable: Variable, varIndex: number) => {
        if (fileVariable.varID !== varID) {
          return;
        }
        fileVariable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
          if (axis.name !== newInfo.name) {
            return;
          }
          const fileVariables = this.state.fileVariables;
          fileVariables[varIndex].axisInfo[axisIndex].min = newInfo.min;
          fileVariables[varIndex].axisInfo[axisIndex].max = newInfo.max;
          this.setState({
            fileVariables
          });
        });
      }
    );
  }

  public renameVariable(newName: string, varID: string): void {
    this.state.fileVariables.forEach(
      (fileVariable: Variable, varIndex: number) => {
        if (fileVariable.varID !== varID) {
          return;
        }
        let newVariables = this.state.fileVariables;
        newVariables[varIndex].alias = newName;
        let newSelection = this.selections;
        const idx: number = this.props.varTracker.findVarByID(
          varID,
          this.selections
        )[0];
        if (idx >= 0) {
          newSelection[idx] = newVariables[varIndex];
        }
        this.selections = newSelection;
        this.setState({
          fileVariables: newVariables
          //selectedVariables: newSelection
        });
      }
    );
  }

  public varSelections = (): Variable[] => {
    return this.selections;
  };

  public varAliasExists(alias: string, varLoaderSelection: boolean) {
    let array: Array<Variable> = this.props.varTracker.selectedVariables;
    if (varLoaderSelection) {
      array = this.selections;
    }
    if (this.props.varTracker.findVarByAlias(alias, array)[1]) {
      return true;
    }
    return false;
  }

  public render(): JSX.Element {
    return (
      <div>
        <Modal
          id="var-loader-modal"
          isOpen={this.state.show}
          toggle={this.toggle}
          size="lg"
        >
          <ModalHeader toggle={this.toggle}>Load Variable</ModalHeader>
          <ModalBody style={modalOverflow}>
            {this.state.fileVariables.length !== 0 &&
              this.state.fileVariables.map((item: Variable) => {
                return (
                  <VarCard
                    renameVariable={this.renameVariable}
                    varAliasExists={this.varAliasExists}
                    allowReload={false}
                    varSelections={this.varSelections}
                    varSelectionChanged={this.selectionChanged}
                    updateDimInfo={this.updateDimInfo}
                    isSelected={this.isSelected}
                    hidden={true}
                    key={item.name}
                    variable={item}
                    selectVariable={this.selectVariableForLoad}
                    deselectVariable={this.deselectVariableForLoad}
                  />
                );
              })}
          </ModalBody>
          <ModalFooter>
            <Button
              outline={true}
              active={this.selections.length > 0}
              color="primary"
              onClick={this.handleLoadClick}
            >
              Load
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }

  private handleLoadClick(): void {
    // Get variables from the file
    const varsToLoad: Variable[] = this.selections;

    const hasDuplicate: boolean = varsToLoad.some(
      (variable: Variable, idx: number) => {
        return varsToLoad.indexOf(variable) !== idx;
      }
    );
    if (hasDuplicate) {
      NotebookUtilities.showMessage(
        "Notice",
        `
        You cannot load multiple variables of the same name.`,
        "OK"
      );
    }

    this.setState({ show: false });
    this.loadSelectedVariables(varsToLoad);
  }
}
