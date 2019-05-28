// tslint:disable-next-line
import "bootstrap/dist/css/bootstrap.min.css";

// Dependencies
import * as React from "react";
import * as _ from "lodash";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

// Project Components
import { AxisInfo } from "./AxisInfo";
import { VarCard } from "./VarCard";
import { Variable } from "./Variable";
import { VariableTracker } from "../VariableTracker";
import { NotebookUtilities } from "../NotebookUtilities";
import { ISignal, Signal } from "@phosphor/signaling";

const modalOverflow: React.CSSProperties = {
  maxHeight: "70vh",
  overflow: "auto"
};
const noScroll: React.CSSProperties = {
  overflow: "hidden"
};

interface IVarLoaderProps {
  loadSelectedVariables: (variables: Variable[]) => Promise<void>; // function to call when user hits load
  varTracker: VariableTracker;
}
interface IVarLoaderState {
  show: boolean; // should the modal be shown
  fileVariables: Variable[]; // the list of variables from within the file
  selectedVariables: Variable[]; // the variables the user has selected to be loaded
  variablesToShow: Variable[];
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
      variablesToShow: Array<Variable>()
    };
    this._selectionChanged = new Signal<this, Variable[]>(this);

    this.toggle = this.toggle.bind(this);
    this.reset = this.reset.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.loadSelectedVariables = this.loadSelectedVariables.bind(this);
    this.selectVariableForLoad = this.selectVariableForLoad.bind(this);
    this.deselectVariableForLoad = this.deselectVariableForLoad.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.handleLoadClick = this.handleLoadClick.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.updateFileVars = this.updateFileVars.bind(this);
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

  public async reset(): Promise<void> {
    this.selections = Array<Variable>();
    await this.setState({
      fileVariables: Array<Variable>(),
      variablesToShow: Array<Variable>()
    });
  }

  /**
   * @description Toggles the variable loader modal
   */
  public async toggle(): Promise<void> {
    // Reset the state of the var loader when done
    await this.reset();
    await this.setState({
      show: !this.state.show
    });
  }

  public isSelected(varID: string): boolean {
    return (
      this.props.varTracker.findVariableByID(varID, this.selections)[0] >= 0
    );
  }

  // Loads all the selected variables into the notebook, returns the number loaded
  public async loadSelectedVariables(varsToLoad: Variable[]): Promise<void> {
    // Exit early if no variable selected for loading
    if (this.selections.length === 0) {
      this.selections = Array<Variable>();
      return;
    }

    // Exit early if duplicate variable names found
    const varCount: { [varID: string]: Variable } = {};
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
        this.deselectVariableForLoad(variable);
      });
      return;
    }

    // Reset the state of the var loader when done
    await this.reset();

    await this.props.loadSelectedVariables(varsToLoad);

    this.setState({ show: false });

    // Save the notebook after variables have been added
    await this.props.varTracker.saveMetaData();
  }

  /**
   *
   * @param variable The Variable the user has selected to get loaded
   */
  public selectVariableForLoad(variable: Variable): void {
    const newSelection: Variable[] = this.selections
      ? this.selections
      : Array<Variable>();

    newSelection.push(variable);
    this.selections = newSelection;
  }

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  public deselectVariableForLoad(variable: Variable): void {
    const idx: number = this.props.varTracker.findVariableByAlias(
      variable.alias,
      this.selections
    )[0];
    const selectedVars: Variable[] = this.selections;
    if (idx >= 0) {
      selectedVars.splice(idx, 1);
    }
    this.selections = selectedVars;
  }

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

  public variableSort(a: Variable, b: Variable) {
    let comp = 0;
    const aName = a.name.toLocaleLowerCase();
    const bName = b.name.toLocaleLowerCase();
    if (aName > bName) {
      comp = 1;
    } else if (aName < bName) {
      comp = -1;
    }
    return comp;
  }

  public updateFileVars(vars: Variable[]) {
    this.setState({
      fileVariables: vars,
      variablesToShow: vars.sort(this.variableSort)
    });
  }

  public resetSearch() {
    this.setState({
      variablesToShow: this.state.fileVariables
    });
  }

  public handleSearchChange(e: any) {
    const value = e.target.value;

    if (value.length < 1) {
      this.setState({
        variablesToShow: this.state.fileVariables
      });
    }

    const targets = Array<string>();
    this.state.fileVariables.forEach((variable: Variable) => {
      targets.push(variable.alias);
    });

    const re = new RegExp(value, "i");
    const isMatch = (result: string) => re.test(result);

    const searchResults = _.filter(targets, isMatch);
    const newVarsToShow = Array<Variable>();
    searchResults.forEach((searchName: string) => {
      this.state.fileVariables.forEach((v: Variable) => {
        if (v.alias === searchName) {
          newVarsToShow.push(v);
        }
      });
    });
    this.setState({
      variablesToShow: newVarsToShow.sort(this.variableSort)
    });
  }

  public renameVariable(newName: string, varID: string): void {
    this.state.fileVariables.forEach(
      (fileVariable: Variable, varIndex: number) => {
        if (fileVariable.varID !== varID) {
          return;
        }
        const newVariables = this.state.fileVariables;
        newVariables[varIndex].alias = newName;
        const newSelection = this.selections;
        const idx: number = this.props.varTracker.findVariableByID(
          varID,
          this.selections
        )[0];
        if (idx >= 0) {
          newSelection[idx] = newVariables[varIndex];
        }
        this.selections = newSelection;
        this.updateFileVars(newVariables);
      }
    );
  }

  public varAliasExists(alias: string, varLoaderSelection: boolean): boolean {
    let array: Variable[] = this.props.varTracker.variables;
    if (varLoaderSelection) {
      array = this.selections;
    }
    return this.props.varTracker.findVariableByAlias(alias, array)[0] >= 0;
  }

  public handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  }

  public render(): JSX.Element {
    return (
      <div>
        <Modal isOpen={this.state.show} toggle={this.toggle} size="lg">
          <ModalHeader toggle={this.toggle}>Load Variable</ModalHeader>
          <ModalBody
            className={/*@tag<var-loader-modal>*/ "var-loader-modal-vcdat"}
          >
            <div
              style={noScroll}
              className={/*@tag<var-loader-search>*/ "var-loader-search-vcdat"}
            >
              <form>
                <label>
                  Search:
                  <input
                    className={
                      /*@tag<var-loader-search-input>*/ "var-loader-search-input-vcdat"
                    }
                    type="text"
                    name="name"
                    onChange={this.handleSearchChange}
                    onKeyDown={this.handleKeyDown}
                  />
                </label>
              </form>
            </div>
            <div
              style={modalOverflow}
              className={/*@tag<var-loader-items>*/ "var-loader-items-vcdat"}
            >
              {this.state.variablesToShow.length !== 0 &&
                this.state.variablesToShow.map((item: Variable) => {
                  return (
                    <VarCard
                      renameVariable={this.renameVariable}
                      varAliasExists={this.varAliasExists}
                      varSelectionChanged={this.selectionChanged}
                      updateDimInfo={this.updateDimInfo}
                      isSelected={this.isSelected}
                      selected={this.isSelected(item.varID)}
                      key={item.name}
                      variable={item}
                      selectVariable={this.selectVariableForLoad}
                      deselectVariable={this.deselectVariableForLoad}
                    />
                  );
                })}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              className={
                /*@tag<var-loader-load-btn>*/ "var-loader-load-btn-vcdat"
              }
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
    this.loadSelectedVariables(this.selections);
  }
}
