import * as React from "react";

import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import { serial } from "../utils";
import Variable from "./Variable";
import VarCard from "./VarCard";
import AxisInfo from "./AxisInfo";

type VarLoaderProps = {
  file_path: string; // path to input file
  loadVariable: any; // function to call when user hits load
  loadedVariables: Array<Variable>; // list of already loaded variables
};
type VarLoaderState = {
  show: boolean; // should the modal be shown
  variables: Array<Variable>; // selected variable
  selectedVariables: Array<Variable>; // the variables the user has selected to be loaded
  loadedVariables: Array<Variable>; // list of already loaded variables
};

export default class VarLoader extends React.Component<
  VarLoaderProps,
  VarLoaderState
> {
  constructor(props: VarLoaderProps) {
    super(props);
    this.state = {
      show: false,
      variables: new Array<Variable>(),
      selectedVariables: new Array<Variable>(),
      loadedVariables: this.props.loadedVariables
    };

    this.toggle = this.toggle.bind(this);
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
   * @param variables An array of Variable objects to display in the loader modal
   */
  setVariables(variables: Array<Variable>) {
    if (this.state.loadedVariables.length > 0) {
      let newVariables = new Array<Variable>();
      variables.forEach((newVariable: Variable, newVarIndex: number) => {
        let found = false;
        this.state.loadedVariables.forEach((loadedVariable: Variable) => {
          if (newVariable.name == loadedVariable.name) {
            newVariables.push(loadedVariable);
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
  }

  /**
   *
   * @param variable The Variable the user has selected to get loaded
   */
  selectVariableForLoad(variable: Variable) {
    this.setState({
      selectedVariables: this.state.selectedVariables.concat([variable])
    });
  }

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  deselectVariableForLoad(variable: Variable) {
    let selectedVars = this.state.selectedVariables.slice();
    selectedVars.splice(this.state.selectedVariables.indexOf(variable), 1);
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
            {this.state.variables.length != 0 &&
              this.state.variables.map((item: Variable) => {
                return (
                  <VarCard
                    reload={() => {}}
                    allowReload={false}
                    updateDimInfo={this.updateDimInfo}
                    isSelected={this.state.loadedVariables.indexOf(item) != -1}
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
              outline
              active={this.state.selectedVariables.length > 0}
              color="primary"
              onClick={() => {
                this.toggle();
                let funcs = this.state.selectedVariables.map(
                  (variable: Variable) => async () => {
                    return this.props.loadVariable(variable);
                  }
                );
                serial(funcs);
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
