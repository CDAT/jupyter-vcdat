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
  commands: any; // the command executer
};

type VarMenuState = {
  showMenu: boolean; // should the collapse be open
  showModal: boolean; // should we show the axis select/subset modal
  selectedVariables: Array<Variable>; // the variable the user has selected
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
      showMenu: false,
      showModal: false,
      selectedVariables: new Array<Variable>(),
      variablesFetched: false,
      variables: new Array<Variable>()
    };
    this.varLoaderRef = (React as any).createRef();
    this.addVariables = this.addVariables.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.clear = this.clear.bind(this);
    this.launchFilebrowser = this.launchFilebrowser.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.getVariablesFromFile = this.getVariablesFromFile.bind(this);
    this.launchVarLoader = this.launchVarLoader.bind(this);
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
        v.axisInfo = new Array<AxisInfo>();
        variableAxes.vars[item].axisList.map((item: any) => {
          v.axisInfo.push(variableAxes.axes[item]);
        });
        v.units = variableAxes.vars[item].units;
        newVars.push(v);
      });
    });
    this.setState({
      variables: newVars,
      variablesFetched: true
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
   * @description the user clicked on a checkbox to select the variable
   * @param event the incoming onClick event
   * @param item the variable associated with the checkbox
   */
  selectVariable(event: any, item: Variable) {
    if (event.target.checked) {
      this.setState({
        selectedVariables: this.state.selectedVariables.concat([item])
      });
    } else {
      let index = this.state.selectedVariables.indexOf(item);
      this.setState({
        selectedVariables: this.state.selectedVariables.splice(index, 1)
      });
    }
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
    this.varLoaderRef.toggle();
  }

  render() {
    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>Variable Options</CardTitle>
            <CardSubtitle>
              <Row>
                <Col>
                  <Button onClick={this.toggleMenu} style={varButtonStyle}>
                    Select Plot Variables
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button
                    onClick={this.launchFilebrowser}
                    style={varButtonStyle}
                  >
                    Load File Variables
                  </Button>
                </Col>
              </Row>
            </CardSubtitle>
            <Collapse
              isOpen={this.state.showMenu && this.props.file_path != ""}
            >
              {this.state.variablesFetched && (
                <Form>
                  {this.state.variables.map(item => {
                    return (
                      <div key={item.name}>
                        <FormGroup check>
                          <Label
                            check
                            style={labelStyle}
                            onClick={(event: any) => {
                              this.selectVariable(event, item);
                            }}
                          >
                            <Input type="checkbox" />
                            {item.name} - {item.longName}
                          </Label>
                        </FormGroup>
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
          loadVariable={this.props.loadVariable}
          ref={(loader: VarLoader) => (this.varLoaderRef = loader)}
        />
      </div>
    );
  }
}
