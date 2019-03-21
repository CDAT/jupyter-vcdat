// Dependencies
import "bootstrap/dist/css/bootstrap.min.css";
import * as React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

// Project Components
import AxisInfo from "./AxisInfo";
import VarCard from "./VarCard";
import Variable from "./Variable";

interface VarLoaderProps {
  loadFileVariable: Function; // function to call when user hits load
  variables: Variable[]; // list of all currently available variables
  updateSelectedVariables: Function; // update the list of selected variables
  saveNotebook: Function; // function that saves the current notebook
}
interface VarLoaderState {
  show: boolean; // should the modal be shown
  variables: Variable[]; // list of already loaded variables
  fileVariables: Variable[]; // the list of variables from within the file
  unloadedVariables: string[]; // the list of variables that haven't been loaded from the file
  selectedVariables: string[]; // the variables the user has selected to be loaded
}

export default class VarLoader extends React.Component<
  VarLoaderProps,
  VarLoaderState
> {
  constructor(props: VarLoaderProps) {
    super(props);
    this.state = {
      show: false,
      variables: this.props.variables,
      unloadedVariables: new Array<string>(),
      fileVariables: new Array<Variable>(),
      selectedVariables: new Array<string>()
    };

    this.toggle = this.toggle.bind(this);
    this.isLoaded = this.isLoaded.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.loadSelectedVariables = this.loadSelectedVariables.bind(this);
    this.selectVariableForLoad = this.selectVariableForLoad.bind(this);
    this.deselectVariableForLoad = this.deselectVariableForLoad.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
  }

  /**
   * @description Toggles the variable loader modal
   */
  public toggle(): void {
    this.setState({
      show: !this.state.show
    });
  }

  public isSelected(varName: string): boolean {
    return this.state.selectedVariables.indexOf(varName) >= 0;
  }

  // Loads all the selected variables into the notebook, returns the number loaded
  public async loadSelectedVariables(): Promise<void> {
    // Exit early if no variable selected for loading
    if (this.state.selectedVariables.length == 0) {
      this.setState({ selectedVariables: new Array<string>() });
      return;
    }
    // Once the load button is clicked, load only the variables that were selected
    this.state.fileVariables.forEach(async (variable: Variable) => {
      const idx = this.state.selectedVariables.indexOf(variable.name);
      if (idx >= 0) {
        // Add the variable
        this.props.loadFileVariable(variable);
      }
    });

    // Update the main widget's current selected variables
    await this.props.updateSelectedVariables(this.state.selectedVariables);

    // Reset the selected files in the var loader when done
    this.setState({ selectedVariables: new Array<string>() });

    // Save the notebook after variables have been added
    this.props.saveNotebook();
  }

  /**
   *
   * @param variable The Variable the user has selected to get loaded
   */
  public selectVariableForLoad(varName: string): void {
    // Update the state
    this.setState({
      selectedVariables: this.state.selectedVariables.concat([varName])
    });
  }

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  public deselectVariableForLoad(varName: string): void {
    const idx: number = this.state.selectedVariables.indexOf(varName);
    const selectedVars: string[] = this.state.selectedVariables;
    if (idx >= 0) {
      selectedVars.splice(idx, 1);
    }
    this.setState({
      selectedVariables: selectedVars
    });
  }

  // Returns true if the variable name has already been loaded into vcdat
  public isLoaded(varName: string): boolean {
    return this.state.unloadedVariables.indexOf(varName) < 0;
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varName the name of the variable to update
   */
  public updateDimInfo(newInfo: any, varName: string): void {
    this.state.fileVariables.forEach(
      (fileVariable: Variable, varIndex: number) => {
        if (fileVariable.name != varName) {
          return;
        }
        fileVariable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
          if (axis.name != newInfo.name) {
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
          <ModalBody>
            {this.state.fileVariables.length != 0 &&
              this.state.fileVariables.map((item: Variable) => {
                return (
                  <VarCard
                    reload={() => {}}
                    allowReload={false}
                    updateDimInfo={this.updateDimInfo}
                    isSelected={this.isSelected}
                    hidden={true}
                    key={item.name}
                    variable={item}
                    isLoaded={this.isLoaded(item.name)}
                    selectVariable={this.selectVariableForLoad}
                    deselectVariable={this.deselectVariableForLoad}
                  />
                );
              })}
          </ModalBody>
          <ModalFooter>
            <Button
              outline={true}
              active={this.state.selectedVariables.length > 0}
              color="primary"
              onClick={() => {
                this.setState({ show: false });
                this.loadSelectedVariables();
              }}
            >
              Load
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
