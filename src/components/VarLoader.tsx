import * as React from "react";

import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import Variable from "./Variable";
import VarCard from "./VarCard";
import AxisInfo from "./AxisInfo";
import { MAX_SLABS } from "../constants";

type VarLoaderProps = {
  loadFileVariable: Function; // function to call when user hits load
  variables: Array<Variable>; // list of all currently available variables
  updateSelectedVariables: Function; // update the list of selected variables
};
type VarLoaderState = {
  show: boolean; // should the modal be shown
  variables: Array<Variable>; // list of already loaded variables
  fileVariables: Array<Variable>; // the list of variables from within the file
  unloadedVariables: Array<string>; // the list of variables that haven't been loaded from the file
  selectedVariables: Array<string>; // the variables the user has selected to be loaded
};

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
  toggle() {
    this.setState({
      show: !this.state.show
    });
  }

  isSelected(varName: string) {
    return this.state.selectedVariables.indexOf(varName) >= 0;
  }

  async loadSelectedVariables() {
    // Once the load button is clicked, load only the files that were selected.
    try {
      this.state.fileVariables.forEach(async (variable: Variable) => {
        let ind = this.state.selectedVariables.indexOf(variable.cdmsID);
        if (ind >= 0) {
          console.log(`Added: ${variable.name}`);
          await this.props.loadFileVariable(variable);
        } else {
          console.log(`Skipped: ${variable.cdmsID}`);
        }
      });
      // Select only the max number of slabs allowed for plot injection
      let selection = this.state.selectedVariables;
      if (selection.length > MAX_SLABS) {
        selection = selection.slice(0, MAX_SLABS);
      }
      // Update the main widget's current selected variables
      await this.props.updateSelectedVariables(selection);
      // Reset the selected files in the var loader when done
      this.setState({ selectedVariables: new Array<string>() });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   *
   * @param variable The Variable the user has selected to get loaded
   */
  selectVariableForLoad(variableName: string): void {
    console.log(`Variable ${variableName} selected and added`);
    this.setState({
      selectedVariables: this.state.selectedVariables.concat([variableName])
    });
  }

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  deselectVariableForLoad(variableName: string) {
    console.log(`Variable ${variableName} deselected`);
    let ind: number = this.state.selectedVariables.indexOf(variableName);
    let selectedVars: Array<string> = this.state.selectedVariables;
    if (ind >= 0) {
      selectedVars.splice(ind, 1);
      console.log("Removed from selected");
    }
    this.setState({
      selectedVariables: selectedVars
    });
  }

  // Returns true if the variable name has already been loaded into vcdat
  isLoaded(variableName: string): boolean {
    if (this.state.unloadedVariables.indexOf(variableName) < 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varName the name of the variable to update
   */
  updateDimInfo(newInfo: any, varName: string) {
    this.state.fileVariables.forEach(
      (fileVariable: Variable, varIndex: number) => {
        if (fileVariable.name != varName) {
          return;
        }
        fileVariable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
          if (axis.name != newInfo.name) {
            return;
          }
          let fileVariables = this.state.fileVariables;
          fileVariables[varIndex].axisInfo[axisIndex].min = newInfo.min;
          fileVariables[varIndex].axisInfo[axisIndex].max = newInfo.max;
          this.setState({
            fileVariables: fileVariables
          });
        });
      }
    );
  }

  render() {
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
              outline
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
