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
import { BASE_GRAPHICS } from "../constants";
const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};
type GraphicsMenuProps = {
  getGraphicsList: any; // a method that gets the current list of graphics methods
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
                  {Object.keys(this.props.getGraphicsList()).map(item => {
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
        {this.props.getGraphicsList()[group].map((item: string) => {
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
