import * as React from "react";
import {
  Collapse,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  CardTitle,
  CardSubtitle,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button
} from "reactstrap";
const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};
type GraphicsMenuProps = {
  updateGraphicsOptions: any; // a method to call when the user has selected their desired graphics method
};
type GraphicsMenuState = {
  showMenu: boolean;
  showDropdown: boolean;
  selectedMethod: string;
  selectedGroup: string;
  firstSelection: boolean;
  optionsChanged: boolean;
  plotReady: boolean;
};

export default class GraphicsMenu extends React.Component<
  GraphicsMenuProps,
  GraphicsMenuState
> {
  constructor(props: GraphicsMenuProps) {
    super(props);
    this.state = {
      showMenu: false,
      showDropdown: false,
      selectedMethod: "",
      selectedGroup: "Select Plot Type",
      firstSelection: false,
      optionsChanged: false,
      plotReady: false
    };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.graphicsOptions = this.graphicsOptions.bind(this);
    this.selectFalse = this.selectFalse.bind(this);
    this.selectTrue = this.selectTrue.bind(this);
  }
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
            if (!this.state.showMenu) {
              this.setState({ showMenu: true });
            }
          }}
        >
          <CardBody>
            <CardTitle>Graphics Options</CardTitle>
            <CardSubtitle>
              <Dropdown
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle disabled={!this.state.plotReady} caret>
                  {this.state.selectedGroup}
                </DropdownToggle>
                <DropdownMenu style={dropdownMenuStype}>
                  {Object.keys(data).map(item => {
                    return (
                      <DropdownItem
                        onClick={() =>
                          this.setState({
                            selectedGroup: item,
                            firstSelection: true,
                            showDropdown: true
                          })
                        }
                        key={item}
                      >
                        {item}
                      </DropdownItem>
                    );
                  })}
                </DropdownMenu>
              </Dropdown>
            </CardSubtitle>
            <Collapse isOpen={this.state.showMenu}>
              {this.state.firstSelection &&
                this.graphicsOptions(this.state.selectedGroup)}
            </Collapse>
          </CardBody>
        </Card>
      </div>
    );
  }
  selectTrue() {
    this.setState({
      showMenu: false
    });
    this.props.updateGraphicsOptions(
      this.state.selectedGroup,
      this.state.selectedMethod
    );
  }
  selectFalse() {
    this.setState({
      showMenu: false
    });
  }
  graphicsOptions(group: string) {
    return (
      <Form className={"jp-vcsWidget-Form"}>
        {data[group].map((item: string) => {
          return (
            <FormGroup check key={item}>
              <Label check>
                <Input
                  type="radio"
                  name="graphics_method_radio"
                  onClick={() => {
                    this.setState({
                      selectedMethod: item,
                      optionsChanged: true
                    });
                  }}
                />{" "}
                {item}
              </Label>
            </FormGroup>
          );
        })}
        <FormGroup className={"jp-vcsWidget-apply-buttons"}>
          <Button
            onClick={this.selectTrue}
            color="primary"
            disabled={!this.state.optionsChanged}
          >
            apply
          </Button>
          <Button onClick={this.selectFalse} color="danger">
            cancel
          </Button>
        </FormGroup>
      </Form>
    );
  }
}

const data: any = {
  "3d_scalar": ["Hovmoller3D", "default"],
  xvsy: [
    "a_1d",
    "a_xvsy_xvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_xvsy_",
    "default_yxvsx_",
    "red_yxvsx"
  ],
  xyvsy: ["a_xyvsy_xyvsy_", "default_xyvsy_"],
  isoline: [
    "P_and_height",
    "a_isoline",
    "a_lambert_isoline",
    "a_mollweide_isoline",
    "a_polar_isoline",
    "a_robinson_isoline",
    "default",
    "polar",
    "quick"
  ],
  boxfill: [
    "a_boxfill",
    "a_lambert_boxfill",
    "a_mollweide_boxfill",
    "a_polar_boxfill",
    "a_robinson_boxfill",
    "default",
    "polar",
    "quick",
    "robinson"
  ],
  isofill: [
    "a_isofill",
    "a_lambert_isofill",
    "a_mollweide_isofill",
    "a_polar_isofill",
    "a_robinson_isofill",
    "default",
    "polar",
    "quick",
    "robinson"
  ],
  streamline: ["default"],
  "3d_dual_scalar": ["default"],
  meshfill: [
    "a_lambert_meshfill",
    "a_meshfill",
    "a_mollweide_meshfill",
    "a_polar_meshfill",
    "a_robinson_meshfill",
    "default"
  ],
  "3d_vector": ["default"],
  yxvsx: [
    "a_1d",
    "a_xvsy_xvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_xvsy_",
    "default_yxvsx_",
    "red_yxvsx"
  ],
  taylordiagram: ["default"],
  vector: ["default"],
  "1d": [
    "a_1d",
    "a_scatter_scatter_",
    "a_xvsy_xvsy_",
    "a_xyvsy_xyvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_scatter_",
    "default_xvsy_",
    "default_xyvsy_",
    "default_yxvsx_",
    "quick_scatter",
    "red_yxvsx"
  ],
  scatter: ["a_scatter_scatter_", "default_scatter_", "quick_scatter"]
};
