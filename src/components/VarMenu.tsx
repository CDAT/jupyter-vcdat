import * as React from "react";
import * as $ from "jquery";
import {
  Collapse,
  Form,
  FormGroup,
  Label,
  Input,
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
import { callApi } from "../utils";
import { BASE_URL } from "../constants";
import AxisInfo from "./AxisInfo";
import VarCard from "./VarCard";
// import { showDialog } from "@jupyterlab/apputils";

const labelStyle: React.CSSProperties = {
  paddingLeft: "1em"
};
const buttonStyle: React.CSSProperties = {
  marginLeft: "1em"
};
const varButtonStyle: React.CSSProperties = {
  marginBottom: "1em"
};

type VarMenuProps = {
  file_path: string; // the path to our file of interest
  loadVariable: any; // a method to call when loading the variable
  loadedVariables: any; //
  commands?: any; // the command executer
  updateSelected: any; // update the list of selected variables
};

type VarMenuState = {
  showMenu: boolean; // should the collapse be open
  showModal: boolean; // should we show the axis select/subset modal
  selectedVariables: Array<Variable>; // the variable the user has selected
  loadedVariables: Array<Variable>;
  variables: Array<Variable>; // variables from the selected file
  variablesFetched: boolean; // have the variables been fetched from the backend yet
};

export default class VarMenu extends React.Component<
  VarMenuProps,
  VarMenuState
> {
  varLoaderRef: VarLoader;
  constructor(props: VarMenuProps) {
    super(props);
    this.state = {
      showMenu: true,
      showModal: false,
      selectedVariables: this.props.loadedVariables.slice(), //new Array<Variable>(),
      loadedVariables: this.props.loadedVariables,
      variablesFetched: false,
      variables: new Array<Variable>()
    };
    this.varLoaderRef = (React as any).createRef();
    this.addVariables = this.addVariables.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.clear = this.clear.bind(this);
    this.launchFilebrowser = this.launchFilebrowser.bind(this);
    this.getVariablesFromFile = this.getVariablesFromFile.bind(this);
    this.launchVarLoader = this.launchVarLoader.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.deselectVariable = this.deselectVariable.bind(this);
    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
  }

  /**
   * @description call the backend API and get the variable information out of the selected file
   * @returns an Array<Variable> of all the variables from the file
   */
  async addVariables() {
    let params = $.param({
      file_path: this.props.file_path
    });
    let url = BASE_URL + "/get_vars?" + params;
    let newVars = new Array<Variable>();
    await callApi(url).then((variableAxes: any) => {
      Object.keys(variableAxes.vars).map((item: string) => {
        let v = new Variable();
        v.name = item;
        v.longName = variableAxes.vars[item].name;
        v.axisList = variableAxes.vars[item].axisList;
        v.units = variableAxes.vars[item].units;
        v.axisInfo = new Array<AxisInfo>();
        variableAxes.vars[item].axisList.map((item: any) => {
          variableAxes.axes[item].min = variableAxes.axes[item].data[0];
          variableAxes.axes[item].max =
            variableAxes.axes[item].data[
              variableAxes.axes[item].data.length - 1
            ];
          v.axisInfo.push(variableAxes.axes[item]);
        });
        newVars.push(v);
      });
    });
    this.setState({
      variablesFetched: true,
      variables: newVars
    });
    return newVars;
  }

  /**
   * @description sets everything back the their defaults
   */
  clear() {
    this.setState({
      variables: new Array<Variable>(),
      variablesFetched: false,
      selectedVariables: new Array<Variable>(),
      showMenu: false
    });
  }

  /**
   * @description Toggles the menu state. If no variables have been loaded, calls the backend API to fetch them
   */
  toggleMenu() {
    if (this.state.variables.length == 0 && this.props.file_path) {
      this.addVariables();
    }
    this.setState({
      showMenu: !this.state.showMenu
    });
  }

  /**
   * @description launches the notebooks filebrowser so the user can select a data file
   */
  launchFilebrowser() {
    this.props.commands.execute("vcs:load-data").then(() => {
      console.log("starting file select");
    });
  }

  /**
   * @description loads the variables from the file and sets the state
   */
  async getVariablesFromFile() {
    let newVars = await this.addVariables();
    if (this.state.variables) {
      this.varLoaderRef.setVariables(this.state.variables);
    } else {
      this.varLoaderRef.setVariables(newVars);
    }
  }

  /**
   * @description toggles the varLoaders menu
   */
  launchVarLoader() {
    this.varLoaderRef.setState(
      {
        loadedVariables: this.state.loadedVariables
      },
      () => {
        this.varLoaderRef.toggle();
      }
    );
  }

  /**
   *
   * @param variable the variable to load
   */
  loadVariable(variable: Variable) {
    // if the variable ISNT already selected, add it to the selected list
    if (this.state.selectedVariables.indexOf(variable) == -1) {
      this.setState({
        selectedVariables: this.state.selectedVariables.concat([variable])
      });
    }
    // if the variable ISNT already loaded, add it to the loaded list
    if (this.state.loadedVariables.indexOf(variable) == -1) {
      this.setState({
        loadedVariables: this.state.loadedVariables.concat([variable])
      });
      return this.props.loadVariable(variable);
    }
  }

  selectVariable(variable: Variable) {
    if (this.state.selectedVariables.indexOf(variable) == -1) {
      this.setState(
        {
          selectedVariables: this.state.selectedVariables.concat([variable])
        },
        () => {
          this.props.updateSelected(this.state.selectedVariables);
        }
      );
    }
  }

  deselectVariable(variable: Variable) {
    // console.log(this.state.selectedVariables);
    let varIndex = this.state.selectedVariables.indexOf(variable);
    if (varIndex != -1) {
      let array = this.state.selectedVariables;
      array.splice(varIndex, 1);
      this.setState(
        {
          selectedVariables: array
        },
        () => {
          this.props.updateSelected(this.state.selectedVariables);
        }
      );
    }
  }

  handleStatusChange(status: any) {
    console.log(status);
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varName the name of the variable to update
   */
  updateDimInfo(newInfo: any, varName: string) {
    this.state.selectedVariables.forEach(
      (variable: Variable, varIndex: number) => {
        if (variable.name != varName) {
          return;
        }
        variable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
          if (axis.name != newInfo.name) {
            return;
          }
          let variables = this.state.selectedVariables;
          variables[varIndex].axisInfo[axisIndex].min = newInfo.min;
          variables[varIndex].axisInfo[axisIndex].max = newInfo.max;
          this.setState({
            selectedVariables: variables
          });
        });
      }
    );
  }

  reloadVariable(variable: Variable) {
    this.props.loadVariable(variable);
  }

  render() {
    let showHideString = "Show Selected";
    if (this.state.showMenu) {
      showHideString = "Hide Selected";
    }
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
              <Row>
                <Col>
                  <Button
                    outline
                    active={this.state.loadedVariables.length > 0}
                    disabled={this.state.loadedVariables.length == 0}
                    color="info"
                    onClick={this.toggleMenu}
                    style={varButtonStyle}
                  >
                    {showHideString}
                  </Button>
                </Col>
              </Row>
            </CardSubtitle>
            <Collapse
              isOpen={this.state.showMenu && this.props.file_path != ""}
            >
              {(this.state.variablesFetched ||
                this.state.loadedVariables.length > 0) && (
                <Form>
                  {this.state.loadedVariables.map(item => {
                    return (
                      <div key={item.name}>
                        <VarCard
                          reload={() => {
                            this.reloadVariable(item);
                          }}
                          allowReload={true}
                          isSelected={
                            this.state.selectedVariables.indexOf(item) != -1
                          }
                          updateDimInfo={this.updateDimInfo}
                          variable={item}
                          selectVariable={this.selectVariable}
                          deselectVariable={this.deselectVariable}
                          hidden={true}
                        />
                      </div>
                    );
                  })}
                </Form>
              )}
            </Collapse>
          </CardBody>
        </Card>
        <VarLoader
          file_path={this.props.file_path}
          loadVariable={this.loadVariable}
          loadedVariables={this.state.loadedVariables}
          ref={(loader: VarLoader) => (this.varLoaderRef = loader)}
        />
      </div>
    );
  }
}
