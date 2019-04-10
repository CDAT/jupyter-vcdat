// Dependencies
import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Collapse,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  InputGroup,
  InputGroupAddon,
  ListGroup,
  ListGroupItem
} from "reactstrap";

// Project Components
import { NotebookUtilities } from "../NotebookUtilities";

const dropdownMenuStyle: React.CSSProperties = {
  maxHeight: "250px",
  padding: "2px",
  marginTop: "5px",
  overflow: "auto"
};
const listItemStyle: React.CSSProperties = {
  padding: "2px 7px",
  textAlign: "left"
};

interface GraphicsMenuProps {
  plotReady: boolean;
  getGraphicsList: Function; // a method that gets the current list of graphics methods
  updateGraphicsOptions: Function; // a method to call when the user has selected their desired graphics method
  copyGraphicsMethod: Function; // a method that will create a copy of the currently selected graphics method.
}
interface GraphicsMenuState {
  showMenu: boolean;
  showDropdown: boolean;
  selectedMethod: string;
  selectedGroup: string;
  tempGroup: string;
  enterName: boolean;
  nameValue: string;
  invalidName: boolean;
  plotReady: boolean;
}

export default class GraphicsMenu extends React.Component<
  GraphicsMenuProps,
  GraphicsMenuState
> {
  public nameInputRef: Input;
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
      plotReady: this.props.plotReady
    };
    this.handleNameInput = this.handleNameInput.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.graphicsOptions = this.graphicsOptions.bind(this);
    this.resetGraphicsState = this.resetGraphicsState.bind(this);
    this.selectItem = this.selectItem.bind(this);
  }

  public handleNameInput(event: React.ChangeEvent<HTMLInputElement>): void {
    // Regex filter for unallowed name characters
    const forbidden: RegExp = /^[^a-z_]|[^a-z0-9]+/i;
    const invalid: boolean = forbidden.test(event.target.value);
    this.setState({ nameValue: event.target.value, invalidName: invalid });
  }

  public toggleDropdown(): void {
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
  public async resetGraphicsState(): Promise<void> {
    this.setState({
      showMenu: false,
      showDropdown: false,
      selectedMethod: "",
      selectedGroup: "",
      tempGroup: "",
      enterName: false,
      nameValue: "",
      invalidName: false
    });
  }

  public async selectItem(item: string): Promise<void> {
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
    } else {
      this.setState({ showMenu: false });
    }
  }

  public graphicsOptions(group: string): JSX.Element {
    return (
      <ListGroup flush={true}>
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

  public render(): JSX.Element {
    // Set the dropdown title based on state
    let dropdownTitle = "Select Plot Type";
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
    // Set the input color
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
                style={{ maxWidth: "calc(100% - 70px)" }}
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle
                  disabled={!this.state.plotReady || this.state.enterName}
                  caret={true}
                >
                  {dropdownTitle}
                </DropdownToggle>
                <DropdownMenu style={dropdownMenuStyle}>
                  {Object.keys(this.props.getGraphicsList()).map(item => {
                    const methods: any = this.props.getGraphicsList()[item];
                    if (methods.length > 1) {
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
                    }
                    return (
                      <DropdownItem
                        onClick={() => {
                          this.setState(
                            {
                              tempGroup: item,
                              showDropdown: false,
                              showMenu: false
                            },
                            () => {
                              this.selectItem(methods[0]);
                            }
                          );
                        }}
                        key={item}
                      >
                        {item} ({methods[0]})
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
                outline={true}
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
                        console.log(error);
                      }
                    } else {
                      NotebookUtilities.showMessage(
                        "Notice",
                        "Name cannot be empty."
                      );
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
