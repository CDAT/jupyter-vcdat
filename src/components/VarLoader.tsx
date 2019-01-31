import * as React from "react";

import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import { serial } from "../utils";
import Variable from "./Variable";
import VarCard from "./VarCard";

type VarLoaderProps = {
  file_path: string; // path to input file
  loadVariable: any; // function to call when user hits load
};
type VarLoaderState = {
  show: boolean; // should the modal be shown
  variables: Array<Variable>; // selected variable
  selectedVariables: Array<Variable>; // the variables the user has selected to be loaded
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
      selectedVariables: new Array<Variable>()
    };

    this.toggle = this.toggle.bind(this);
    this.selectVariableForLoad = this.selectVariableForLoad.bind(this);
    this.deselectVariableForLoad = this.deselectVariableForLoad.bind(this);
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
    this.setState({
      variables: variables
    });
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
                    hidden={false}
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
                  (variable: Variable) => () =>
                    this.props.loadVariable(variable)
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
