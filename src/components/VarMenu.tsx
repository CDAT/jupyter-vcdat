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
  FormFeedback,
  CardTitle,
  CardSubtitle,
  Button,
  Card,
  CardBody
} from "reactstrap";
import Variable from "./Variable";
import { VarLoader } from "./VarLoader";
// import { showDialog } from "@jupyterlab/apputils";

const base_url = "/vcs";

type VarMenuProps = {
  filePath: string; // the path to our file of interest
  loadVariable: any; // a method to call when loading the variable
};

type VarMenuState = {
  showMenu: boolean; // should the collapse be open
  showDropdown: boolean; // should the variable select drop down be open
  showModal: boolean; // should we show the axis select/subset modal
  selectedVariable: Variable; // the variable the user has selected
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
      showDropdown: false,
      showModal: false,
      selectedVariable: new Variable(),
      variablesFetched: false,
      variables: [new Variable()]
    };
    this.varLoader = (React as any).createRef();
    this.addVariables = this.addVariables.bind(this);
    this.callApi = this.callApi.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
  }
  addVariables() {
    let params = $.param({
      file_path: this.props.filePath
    });
    let url = base_url + "/get_vars?" + params;
    this.callApi(url).then((variableAxes: any) => {
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
        variables: newVars
      });
    });
  }
  // call an external API
  callApi = async (url: string) => {
    const response = await fetch(url);
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  };
  toggleMenu() {
    this.setState({
      showMenu: !this.state.showMenu
    });
  }
  toggleDropdown() {
    this.setState({
      showDropdown: !this.state.showDropdown
    });
  }
  render() {
    return (
      <div>
        <Card
          onClick={() => {
            if (!this.state.variablesFetched) {
              this.addVariables();
            }
            if (!this.state.showMenu) {
              this.setState({ showMenu: true });
            }
          }}
        >
          <CardBody>
            <CardTitle>Variable Options</CardTitle>
            <CardSubtitle>
              <Dropdown
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle caret>
                  {this.state.variablesFetched &&
                    this.state.selectedVariable.name}
                  {!this.state.variablesFetched && "Select Variable"}
                </DropdownToggle>
                <DropdownMenu>
                  {this.state.variables.map((item: Variable) => {
                    return (
                      <DropdownItem
                        key={item.name}
                        onClick={() => {
                          this.setState({
                            variablesFetched: true,
                            selectedVariable: item,
                            showMenu: true
                          });
                          this.varLoader.toggle();
                          this.varLoader.setVariable(item);
                        }}
                      >
                        {item.name}: {item.longName}
                      </DropdownItem>
                    );
                  })}
                </DropdownMenu>
              </Dropdown>
            </CardSubtitle>
            <Collapse isOpen={this.state.showMenu}></Collapse>
          </CardBody>
        </Card>
        <VarLoader
          filePath={this.props.filePath}
          loadVariable={this.props.loadVariable}
          ref={(loader: VarLoader) => (this.varLoader = loader)}
        />
      </div>
    );
  }
}
