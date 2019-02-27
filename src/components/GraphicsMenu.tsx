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
  Input,
  Button
} from "reactstrap";
import ListGroup from "reactstrap/lib/ListGroup";
import ListGroupItem from "reactstrap/lib/ListGroupItem";
import InputGroup from "reactstrap/lib/InputGroup";
import InputGroupAddon from "reactstrap/lib/InputGroupAddon";
const dropdownMenuStyle: React.CSSProperties = {
  maxHeight: "200px",
  padding: "2px",
  marginTop: "5px",
  overflow: "auto"
};
const listItemStyle: React.CSSProperties = {
  padding: "2px 7px",
  textAlign: "left"
};

type GraphicsMenuProps = {
  getGraphicsList: Function; // a method that gets the current list of graphics methods
  updateGraphicsOptions: Function; // a method to call when the user has selected their desired graphics method
  editGraphicsMethod: Function;
  copyGraphicsMethod: Function;
};
type GraphicsMenuState = {
  showMenu: boolean;
  showDropdown: boolean;
  selectedMethod: string;
  selectedGroup: string;
  tempGroup: string;
  enterName: boolean;
  nameValue: string;
  invalidName: boolean;
  plotReady: boolean;
};

export default class GraphicsMenu extends React.Component<
  GraphicsMenuProps,
  GraphicsMenuState
> {
  nameInputRef: Input;
  constructor(props: GraphicsMenuProps) {
    super(props);
    this.state = {
      showMenu: false,
      showDropdown: false,
      selectedMethod: "",
      selectedGroup: "",
      tempGroup: "",
      enterName: false,
      nameValue: "",
      invalidName: false,
      plotReady: false
    };
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.graphicsOptions = this.graphicsOptions.bind(this);
    this.resetGraphicsState = this.resetGraphicsState.bind(this);
    this.handleNameInput = this.handleNameInput.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.nameInputRef = (React as any).createRef();
  }

  handleNameInput(event: React.ChangeEvent<HTMLInputElement>) {
    // Regex filter for unallowed name characters
    let forbidden: RegExp = /^[^A-z_]|[^A-z0-9]+/;
    let invalid: boolean = forbidden.test(event.target.value);
    this.setState({ nameValue: event.target.value, invalidName: invalid });
  }

  toggleDropdown() {
    this.setState({
      showDropdown: !this.state.showDropdown
    });
    if (this.state.showMenu && this.state.enterName) {
      this.setState({
        showMenu: false
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
      tempGroup: "",
      enterName: false,
      nameValue: "",
      invalidName: false,
      plotReady: false
    });
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
      <ListGroup flush>
        {this.props.getGraphicsList()[group].map((item: string) => {
          return (
            <ListGroupItem
              className="text-muted"
              key={group + item}
              style={listItemStyle}
              tag="button"
              onClick={() => {
                this.selectItem(item);
              }}
              color={
                this.state.selectedGroup == group &&
                this.state.selectedMethod == item
                  ? "info"
                  : ""
              }
            >
              {item}
            </ListGroupItem>
          );
        })}
      </ListGroup>
    );
  }

  render() {
    // Set the dropdown title based on state
    let dropdownTitle = "Select Plot Type";
    /*if (this.state.selectedMethod != "") {
      if (this.state.tempGroup == "") {
        if (this.state.enterName) {
          dropdownTitle = `${this.state.selectedGroup}`;
        } else {
          dropdownTitle = `${this.state.selectedGroup} (${
            this.state.selectedMethod
          })`;
        }
      } else if (this.state.tempGroup == this.state.selectedGroup) {
        if (this.state.enterName) {
          dropdownTitle = `${this.state.tempGroup}`;
        } else {
          dropdownTitle = `${this.state.tempGroup} (${
            this.state.selectedMethod
          })`;
        }
      } else {
        dropdownTitle = `${this.state.tempGroup}`;
      }
    } else if (this.state.tempGroup != "") {
      dropdownTitle = `${this.state.tempGroup}`;
    }*/
    if (this.state.tempGroup != "") {
      if (this.state.tempGroup == this.state.selectedGroup) {
        dropdownTitle = `${this.state.tempGroup} (${
          this.state.selectedMethod
        })`;
      } else {
        dropdownTitle = `${this.state.tempGroup}`;
      }
    } else if (this.state.selectedMethod != "") {
      dropdownTitle = `${this.state.selectedGroup} (${
        this.state.selectedMethod
      })`;
    }
    // Set the input color as v
    let validInputColor = "success";
    if (this.state.invalidName) {
      validInputColor = "danger";
    }
    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>Graphics Options</CardTitle>
            <CardSubtitle className="clearfix">
              <Dropdown
                className="float-left"
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle disabled={!this.state.plotReady} caret>
                  {dropdownTitle}
                </DropdownToggle>
                {/*FOR FUTURE FUCNTIONALITY <Button
                  className="float-right"
                  hidden={
                    this.state.selectedMethod == "" ||
                    this.state.showMenu ||
                    this.state.showDropdown ||
                    this.state.enterName ||
                    this.state.selectedGroup == ""
                  }
                  onClick={() => {
                    this.props.editGraphicsMethod();
                  }}
                  outline
                  color="danger"
                >
                  Edit
                </Button>*/}

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
              <Button
                className="float-left"
                hidden={!this.state.showMenu || this.state.enterName}
                style={{ marginLeft: "5px" }}
                onClick={() => {
                  this.setState({
                    showMenu: false,
                    showDropdown: false,
                    tempGroup: this.state.selectedGroup
                  });
                }}
                color="danger"
              >
                X
              </Button>
              <Button
                className="float-right"
                hidden={
                  !this.state.plotReady ||
                  this.state.showMenu ||
                  this.state.enterName ||
                  this.state.selectedGroup == ""
                }
                outline
                onClick={() => {
                  this.setState({ enterName: true });
                }}
                color="info"
              >
                Copy
              </Button>
              <Button
                className="float-right"
                hidden={!this.state.enterName}
                onClick={() => {
                  this.setState({
                    enterName: false,
                    nameValue: "",
                    invalidName: false
                  });
                }}
                color="danger"
              >
                Cancel
              </Button>
            </CardSubtitle>
            <InputGroup
              hidden={!this.state.enterName}
              style={{ marginTop: "5px" }}
            >
              <Input
                onChange={this.handleNameInput}
                className="float-left"
                value={this.state.nameValue}
                placeholder="Enter new name here."
                ref={loader => (this.nameInputRef = loader)}
              />
              <InputGroupAddon addonType="append">
                <Button
                  className="float-right"
                  onClick={async () => {
                    if (this.state.nameValue != "" && !this.state.invalidName) {
                      try {
                        await this.props.copyGraphicsMethod(
                          this.state.selectedGroup,
                          this.state.selectedMethod,
                          this.state.nameValue
                        );
                        this.setState({
                          selectedMethod: this.state.nameValue,
                          invalidName: false,
                          enterName: false,
                          nameValue: ""
                        });
                      } catch (error) {
                        alert(error);
                      }
                    } else {
                      alert("Name cannot be empty.");
                      this.setState({ invalidName: true });
                    }
                  }}
                  color={validInputColor}
                  disabled={this.state.invalidName}
                >
                  {this.state.invalidName ? "Invalid!" : "Enter"}
                </Button>
              </InputGroupAddon>
            </InputGroup>
            <Card
              style={{ marginTop: "5px" }}
              hidden={
                this.state.tempGroup == "" ||
                !this.state.showMenu ||
                this.state.enterName
              }
            >
              <Collapse
                style={dropdownMenuStyle}
                isOpen={
                  this.state.tempGroup != "" &&
                  this.state.showMenu &&
                  !this.state.enterName
                }
              >
                {this.state.tempGroup != "" &&
                  this.graphicsOptions(this.state.tempGroup)}
              </Collapse>
            </Card>
          </CardBody>
        </Card>
      </div>
    );
  }
}
