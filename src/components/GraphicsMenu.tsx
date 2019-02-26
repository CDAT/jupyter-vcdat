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
  Button,
  Row
} from "reactstrap";
const dropdownMenuStyle: React.CSSProperties = {
  maxHeight: "250px",
  padding: "2px",
  marginTop: "5px",
  overflow: "auto"
};
const graphicButtonStyle: React.CSSProperties = {
  marginTop: "2px",
  padding: "2px 5px"
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
  tempGroup: string;
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
      selectedGroup: "",
      tempGroup: "",
      plotReady: false
    };
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.graphicsOptions = this.graphicsOptions.bind(this);
    this.resetGraphicsState = this.resetGraphicsState.bind(this);
    this.selectItem = this.selectItem.bind(this);
  }

  toggleDropdown() {
    this.setState({
      showDropdown: !this.state.showDropdown
    });
    if (this.state.showMenu) {
      this.setState({
        showMenu: false,
        showDropdown: false,
        tempGroup: this.state.selectedGroup
      });
    }
  }

  // Resets the graphics menu to initial, (for when a new notebook is selected)
  resetGraphicsState() {
    console.log("Graphics selections reset.");
    this.setState({
      showMenu: false,
      showDropdown: false,
      selectedMethod: "",
      selectedGroup: "",
      tempGroup: ""
    });
  }

  render() {
    let dropdownTitle = "Select Plot Type";
    if (this.state.selectedMethod != "") {
      if (this.state.tempGroup == "") {
        dropdownTitle = `${this.state.selectedGroup} (${
          this.state.selectedMethod
        })`;
      } else if (this.state.tempGroup == this.state.selectedGroup) {
        dropdownTitle = `${this.state.tempGroup} (${
          this.state.selectedMethod
        })`;
      } else {
        dropdownTitle = `${this.state.tempGroup}`;
      }
    }
    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>Graphics Options</CardTitle>
            <CardSubtitle>
              <Dropdown
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle disabled={!this.state.plotReady} caret>
                  {dropdownTitle}
                </DropdownToggle>
                <DropdownMenu style={dropdownMenuStyle}>
                  {Object.keys(this.props.getGraphicsList()).map(item => {
                    return (
                      <DropdownItem
                        onClick={() => {
                          this.setState({
                            tempGroup: item,
                            showDropdown: false,
                            showMenu: true
                          });
                        }}
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
              {this.state.tempGroup != "" &&
                this.graphicsOptions(this.state.tempGroup)}
            </Collapse>
          </CardBody>
        </Card>
      </div>
    );
  }
  async selectItem(item: string) {
    try {
      if (
        this.state.tempGroup != this.state.selectedGroup ||
        this.state.selectedMethod != item
      ) {
        await this.props.updateGraphicsOptions(this.state.tempGroup, item);

        this.setState({
          showMenu: false,
          selectedMethod: item,
          selectedGroup: this.state.tempGroup
        });
        console.log(`Updated graphics to: ${item}`);
      } else {
        this.setState({ showMenu: false });
        console.log(`No change in graphics method.`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  graphicsOptions(group: string) {
    return (
      <Card style={dropdownMenuStyle}>
        {this.props.getGraphicsList()[group].map((item: string) => {
          return (
            <div key={group + item}>
              <Button
                style={graphicButtonStyle}
                outline
                onClick={() => {
                  this.selectItem(item);
                }}
                active={
                  this.state.selectedGroup == group &&
                  this.state.selectedMethod == item
                }
                color="success"
              >
                {item}
              </Button>
              <br />
            </div>
          );
        })}
        {/* 
            <FormGroup check key={item + group}>
              <Label check>
                <Input
                  type="radio"
                  name="graphics_method_radio"
                  onClick={() => {
                    this.selectItem(item);
                  }}
                />{" "}
                {item}
              </Label>
            </FormGroup>
        <FormGroup className={"jp-vcsWidget-apply-buttons"}>
          <Button onClick={this.selectFalse} color="danger">
            cancel
          </Button>
        </FormGroup>*/}
      </Card>
    );
  }
}