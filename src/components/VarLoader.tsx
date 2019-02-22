import * as React from "react";

import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import Variable from "./Variable";
import VarCard from "./VarCard";
import AxisInfo from "./AxisInfo";

type VarLoaderProps = {
  loadFileVariable: any; // function to call when user hits load
  variables: Array<Variable>; // list of all currently available variables
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

  /**
   *
   * @param variables An array of variable objects to display in the loader modal
   */
  /*
  setVariables(variables: Array<Variable>) {
    if (this.state.loadedVariables.length > 0) {
      let newVariables = new Array<Variable>();
      variables.forEach((newVariable: Variable, newVarIndex: number) => {
        let found = false;
        this.state.loadedVariables.forEach((loadedVariable: Variable) => {
          if (newVariable.name == loadedVariable.name) {
            //newVariables.push(loadedVariable);
            found = true;
          }
        });
        if (!found) {
          newVariables.push(newVariable);
        }
      });
      this.setState({
        variables: newVariables
      });
    } else {
      this.setState({
        variables: variables
      });
    }
  }*/

  async loadSelectedVariables() {
    console.log(`Variable selections: ${this.state.selectedVariables}`);
    console.log(`Loaded file variables:`);
    console.log(this.state.fileVariables);
    console.log(`All variables: `);
    console.log(this.state.variables);

    try {
      //let funcs: Array<Promise<void>> = new Array<Promise<void>>();
      this.state.fileVariables.forEach(async (variable: Variable) => {
        let ind = this.state.selectedVariables.indexOf(variable.cdmsID);
        if (ind >= 0) {
          console.log(`Added: ${variable.name}`);
          await this.props.loadFileVariable(variable);
        } else {
          console.log(`Skipped: ${variable.cdmsID}`);
        }
      });
      //serial(funcs);
      //console.log(funcs);
      //await Promise.all(funcs);
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
    this.setState({
      selectedVariables: this.state.selectedVariables.concat([variableName])
    });
  }

  isLoaded(variableName: string): boolean {
    if (this.state.unloadedVariables.indexOf(variableName) < 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  deselectVariableForLoad(variableName: string) {
    let selectedVars: Array<string> = this.state.selectedVariables.splice(
      this.state.selectedVariables.indexOf(variableName),
      1
    );
    this.setState({
      selectedVariables: selectedVars
    });
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varName the name of the variable to update
   */
  updateDimInfo(newInfo: any, varName: string) {
    this.state.variables.forEach((variable: Variable, varIndex: number) => {
      if (variable.name != varName) {
        return;
      }
      variable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
        if (axis.name != newInfo.name) {
          return;
        }
        let variables = this.state.variables;
        variables[varIndex].axisInfo[axisIndex].min = newInfo.min;
        variables[varIndex].axisInfo[axisIndex].max = newInfo.max;
        this.setState({
          variables: variables
        });
      });
    });
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
                    isSelected={
                      this.state.selectedVariables.indexOf(item.name) != -1
                    }
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
