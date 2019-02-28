import * as React from "react";
import {
  Form,
  CardTitle,
  CardSubtitle,
  Button,
  Card,
  CardBody,
  Row,
  Col
} from "reactstrap";

import Variable from "./Variable";
import VarLoader from "./VarLoader";
import AxisInfo from "./AxisInfo";
import VarCard from "./VarCard";
import { MAX_SLABS } from "../constants";
import { notebook_utils } from "../notebook_utils";

const labelStyle: React.CSSProperties = {
  paddingLeft: "1em"
};
const buttonStyle: React.CSSProperties = {
  marginLeft: "1em"
};
const varButtonStyle: React.CSSProperties = {
  marginBottom: "1em"
};

const formOverflow: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};

type VarMenuProps = {
  loadVariable: Function; // a method to call when loading the variable
  commands?: any; // the command executer
  variables: Array<Variable>; // an array of all current variables
  selectedVariables: Array<string>; // array of names for variables that have been selected
  updateSelectedVariables: Function; // update the list of selected variables
  updateVariables: Function; // update the list of all variables
};

type VarMenuState = {
  showModal: boolean; // should we show the axis select/subset modal
  variables: Array<Variable>; // all variables for list (derived and loaded)
  selectedVariables: Array<string>; // the variable the user has selected
};

export default class VarMenu extends React.Component<
  VarMenuProps,
  VarMenuState
> {
  varLoaderRef: VarLoader;
  constructor(props: VarMenuProps) {
    super(props);
    this.state = {
      showModal: false,
      selectedVariables: this.props.selectedVariables,
      variables: this.props.variables
    };
    this.varLoaderRef = (React as any).createRef();
    this.launchFilebrowser = this.launchFilebrowser.bind(this);
    this.launchVarLoader = this.launchVarLoader.bind(this);
    this.loadFileVariable = this.loadFileVariable.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.deselectVariable = this.deselectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
  }

  isSelected(varName: string): boolean {
    return this.state.selectedVariables.indexOf(varName) >= 0;
  }

  /**
   * @description launches the notebooks filebrowser so the user can select a data file
   */
  async launchFilebrowser(): Promise<void> {
    await this.props.commands.execute("vcs:load-data");
  }

  /**
   * @description toggles the varLoaders menu
   */
  async launchVarLoader(fileVariables: Array<Variable>): Promise<void> {
    try {
      // Look through current loaded variable names to see if any haven't been loaded
      let unloaded: Array<string> = new Array<string>();
      let loadedVars: Array<string> = this.state.variables.map(
        (variable: Variable) => {
          return variable.name;
        }
      );
      fileVariables.forEach((fileVar: Variable) => {
        if (loadedVars.indexOf(fileVar.name) < 0) {
          unloaded.push(fileVar.name);
        }
      });

      // Only launch loader if there are unloaed variables
      if (unloaded.length > 0) {
        await this.varLoaderRef.setState(
          {
            fileVariables: fileVariables,
            unloadedVariables: unloaded
          },
          () => {
            this.varLoaderRef.setState({ show: true });
          }
        );
      } else {
        notebook_utils.showMessage(
          "Notice",
          "All the variables in this file have already been loaded."
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param variable the variable to load
   */
  async loadFileVariable(variable: Variable): Promise<void> {
    try {
      // if the variable ISNT already loaded, add it to the loaded list
      let newVariables: Array<Variable> = this.state.variables;
      if (newVariables.indexOf(variable) == -1) {
        await this.props.loadVariable(variable);
        newVariables.push(variable);
        await this.props.updateVariables(newVariables);
      }
    } catch (error) {
      throw error;
    }
  }

  async selectVariable(variableName: string): Promise<void> {
    let ind: number = this.state.selectedVariables.indexOf(variableName);

    if (ind < 0) {
      // Limit number of variables selected by deselecting last element
      let selection = this.state.selectedVariables;
      if (selection.length >= MAX_SLABS) {
        selection.pop();
      }
      selection.push(variableName);

      await this.props.updateSelectedVariables(selection);
    }
  }

  /**
   * @description removes a variable from the state.selectedVariables list
   * @param variable the variable to remove from the selected list
   */
  async deselectVariable(variableName: string): Promise<void> {
    let ind: number = this.state.selectedVariables.indexOf(variableName);

    if (ind >= 0) {
      let newSelection = this.state.selectedVariables;
      newSelection.splice(ind, 1);
      await this.setState(
        {
          selectedVariables: newSelection
        },
        () => {
          this.props.updateSelectedVariables(this.state.selectedVariables);
        }
      );
    }
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varName the name of the variable to update
   */
  async updateDimInfo(newInfo: any, varName: string): Promise<void> {
    try {
      this.state.variables.forEach((variable: Variable, varIndex: number) => {
        if (variable.name != varName) {
          return;
        }
        variable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
          if (axis.name != newInfo.name) {
            return;
          }
          this.state.variables[varIndex].axisInfo[axisIndex].min = newInfo.min;
          this.state.variables[varIndex].axisInfo[axisIndex].max = newInfo.max;
        });
      });
    } catch (error) {
      throw error;
    }
  }

  reloadVariable(variable: Variable): void {
    this.props.loadVariable(variable);
  }

  render(): JSX.Element {
    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>Variable Options</CardTitle>
            <CardSubtitle>
              <Row>
                <Col>
                  <Button
                    color="info"
                    onClick={this.launchFilebrowser}
                    style={varButtonStyle}
                  >
                    Load Variables
                  </Button>
                </Col>
              </Row>
            </CardSubtitle>
            {this.state.variables.length > 0 && (
              <Form style={formOverflow}>
                {this.state.variables.map(item => {
                  return (
                    <div key={item.name}>
                      <VarCard
                        reload={() => {
                          this.reloadVariable(item);
                        }}
                        allowReload={true}
                        isSelected={this.isSelected}
                        updateDimInfo={this.updateDimInfo}
                        variable={item}
                        isLoaded={false}
                        selectVariable={this.selectVariable}
                        deselectVariable={this.deselectVariable}
                        hidden={true}
                      />
                    </div>
                  );
                })}
              </Form>
            )}
          </CardBody>
        </Card>
        <VarLoader
          updateSelectedVariables={this.props.updateSelectedVariables}
          loadFileVariable={this.loadFileVariable}
          variables={this.state.variables}
          ref={(loader: VarLoader) => (this.varLoaderRef = loader)}
        />
      </div>
    );
  }
}
