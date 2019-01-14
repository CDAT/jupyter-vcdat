import * as React from "react";
import * as $ from "jquery";
import {
  Collapse,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Form,
  FormGroup,
  Label,
  Input,
  CardTitle,
  CardSubtitle,
  Button,
  Card,
  CardBody
} from "reactstrap";
import Variable from "./Variable";
import { VarLoader } from "./VarLoader";
import { callApi } from "./../utils";
import { BASE_URL } from "./../constants";
// import { showDialog } from "@jupyterlab/apputils";

var labelStyle: React.CSSProperties = {
  paddingLeft: "1em"
};
var buttonStyle: React.CSSProperties = {
  marginLeft: "1em"
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
  varLoader: VarLoader;
  constructor(props: VarMenuProps) {
    super(props);
    this.state = {
      showMenu: false,
      showModal: false,
      selectedVariables: new Array<Variable>(),
      variablesFetched: false,
      variables: new Array<Variable>()
    };
    this.varLoader = (React as any).createRef();
    this.addVariables = this.addVariables.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.clear = this.clear.bind(this);
    this.launchFilebrowser = this.launchFilebrowser.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
  }

  addVariables() {
    let params = $.param({
      file_path: this.props.file_path
    });
    let url = BASE_URL + "/get_vars?" + params;
    callApi(url).then((variableAxes: any) => {
      let newVars = new Array<Variable>();
      Object.keys(variableAxes.vars).map((item: string) => {
        let v = new Variable();
        v.name = item;
        v.longName = variableAxes.vars[item].name;
        v.axisList = variableAxes.vars[item].axisList;
        v.axisInfo = new Array<Object>();
        variableAxes.vars[item].axisList.map((item: any) => {
          v.axisInfo.push(variableAxes.axes[item]);
        });
        v.units = variableAxes.vars[item].units;
        newVars.push(v);
      });
      this.setState({
        variables: newVars,
        variablesFetched: true
      });
    });
  }

  clear() {
    this.setState({
      variables: new Array<Variable>(),
      variablesFetched: false,
      selectedVariables: new Array<Variable>()
    });
  }

  toggleMenu() {
    if (this.state.variables.length == 0 && this.props.file_path) {
      this.addVariables();
    }
    this.setState({
      showMenu: !this.state.showMenu
    });
  }

  launchFilebrowser() {
    this.props.commands.execute("vcs:load-data").then(() => {
      console.log("file selected");
    });
  }

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

  render() {
    var buttonClicker;
    if (!this.props.file_path) {
      buttonClicker = this.launchFilebrowser;
    } else {
      buttonClicker = this.toggleMenu;
    }
    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>Variable Options</CardTitle>
            <CardSubtitle>
              <Button onClick={buttonClicker}>
                {!this.props.file_path && <span>Load Data</span>}
                {this.props.file_path && <span>Select Variables</span>}
              </Button>
            </CardSubtitle>
            <Collapse isOpen={this.state.showMenu}>
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
                  {this.state.selectedVariables.length > 0 && (
                    <Button
                      style={buttonStyle}
                      onClick={() => {
                        this.props.loadVariable(this.state.selectedVariables);
                      }}
                    >
                      load
                    </Button>
                  )}
                </Form>
              )}
            </Collapse>
          </CardBody>
        </Card>
        <VarLoader
          file_path={this.props.file_path}
          loadVariable={this.props.loadVariable}
          ref={(loader: VarLoader) => (this.varLoader = loader)}
        />
      </div>
    );
  }
}
