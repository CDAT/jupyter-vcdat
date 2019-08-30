// Dependencies
import { ISignal } from "@phosphor/signaling";
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
  ListGroupItem,
  CustomInput,
} from "reactstrap";

// Project Components
import NotebookUtilities from "../NotebookUtilities";
import LeftSideBarWidget from "../LeftSideBarWidget";
import ColormapEditor from "./ColormapEditor";
import { DISPLAY_MODE } from "../constants";

const dropdownMenuStyle: React.CSSProperties = {
  marginTop: "5px",
  maxHeight: "250px",
  overflow: "auto",
  padding: "2px"
};
const listItemStyle: React.CSSProperties = {
  padding: "2px 7px",
  textAlign: "left"
};

interface IGraphicsMenuProps {
  plotReady: boolean;
  plotReadyChanged: ISignal<LeftSideBarWidget, boolean>;
  getGraphicsList: () => any; // a method that gets the current list of graphics methods
  // a method to call when the user has selected their desired graphics method
  updateGraphicsOptions: (group: string, name: string) => Promise<void>;
  updateColormap: (name: string) => Promise<void>;
  overlayMode: boolean;
  toggleOverlayMode: () => void;
  toggleSidecar: () => {};
  currentDisplayMode: DISPLAY_MODE;
  copyGraphicsMethod: (
    groupName: string,
    methodName: string,
    newName: string
  ) => Promise<void>; // a method that will create a copy of the currently selected graphics method.
}
interface IGraphicsMenuState {
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
  IGraphicsMenuProps,
  IGraphicsMenuState
> {
  constructor(props: IGraphicsMenuProps) {
    super(props);
    this.state = {
      enterName: false,
      invalidName: false,
      nameValue: "",
      plotReady: this.props.plotReady,
      selectedGroup: "",
      selectedMethod: "",
      showDropdown: false,
      showMenu: false,
      tempGroup: ""
    };
    this.handleNameInput = this.handleNameInput.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);
    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleEnterClick = this.handleEnterClick.bind(this);
    this.handlePlotReadyChanged = this.handlePlotReadyChanged.bind(this);

    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.graphicsOptions = this.graphicsOptions.bind(this);
    this.resetGraphicsState = this.resetGraphicsState.bind(this);
    this.selectItem = this.selectItem.bind(this);

    this.props.plotReadyChanged.connect(this.handlePlotReadyChanged);
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
      enterName: false,
      invalidName: false,
      nameValue: "",
      selectedGroup: "",
      selectedMethod: "",
      showDropdown: false,
      showMenu: false,
      tempGroup: ""
    });
  }

  public async selectItem(item: string): Promise<void> {
    if (
      this.state.tempGroup !== this.state.selectedGroup ||
      this.state.selectedMethod !== item
    ) {
      await this.props.updateGraphicsOptions(this.state.tempGroup, item);
      this.setState({
        selectedGroup: this.state.tempGroup,
        selectedMethod: item,
        showMenu: false
      });
    } else {
      this.setState({ showMenu: false });
    }
  }

  public graphicsOptions(group: string): JSX.Element {
    return (
      <ListGroup flush={true}>
        {this.props.getGraphicsList()[group].map((item: string) => {
          const select = () => {
            this.selectItem(item);
          };
          return (
            <ListGroupItem
              className={"text-muted"}
              key={group + item}
              style={listItemStyle}
              tag="button"
              onClick={select}
              color={
                this.state.selectedGroup === group &&
                this.state.selectedMethod === item
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

  public openColormapEditor(): void {}

  public render(): JSX.Element {
    // Set the dropdown title based on state
    let dropdownTitle = "Select Plot Type";
    if (this.state.tempGroup) {
      this.state.tempGroup === this.state.selectedGroup
        ? (dropdownTitle = `${this.state.tempGroup} (${this.state.selectedMethod})`)
        : (dropdownTitle = `${this.state.tempGroup}`);
    } else if (this.state.selectedMethod) {
      dropdownTitle = `${this.state.selectedGroup} (${this.state.selectedMethod})`;
    }
    // Set the input color
    let validInputColor = "success";
    if (this.state.invalidName) {
      validInputColor = "danger";
    }
    return (
      <div>
        <Card>
          <CardBody className={/*@tag<graphics-menu>*/ "graphics-menu-vcdat"}>
            <CardTitle>Graphics Options</CardTitle>
            <CardSubtitle className={"clearfix"}>
              <CustomInput
                type="switch"
                id={
                  /*@tag<vcsmenu-overlay-mode-switch>*/ "vcsmenu-overlay-mode-switch-vcdat"
                }
                name="overlayModeSwitch"
                label="Overlay Mode"
                disabled={!this.state.plotReady}
                checked={this.props.overlayMode}
                onChange={this.props.toggleOverlayMode}
              />

              <CustomInput
                type="switch"
                id={
                  /*@tag<vcsmenu-sidecar-switch>*/ "vcsmenu-sidecar-switch-vcdat"
                }
                name="sidecarSwitch"
                label="Plot to Sidecar"
                disabled={!this.state.plotReady}
                checked={this.props.currentDisplayMode === DISPLAY_MODE.Sidecar}
                onChange={this.props.toggleSidecar}
              />
              <Dropdown
                className={"float-left"}
                style={{ maxWidth: "calc(100% - 70px)" }}
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle
                  className={
                    /*@tag<graphics-dropdown>*/ "graphics-dropdown-vcdat"
                  }
                  disabled={!this.state.plotReady || this.state.enterName}
                  caret={true}
                >
                  {dropdownTitle}
                </DropdownToggle>
                <DropdownMenu style={dropdownMenuStyle}>
                  {Object.keys(this.props.getGraphicsList()).map(item => {
                    const methods: any = this.props.getGraphicsList()[item];
                    const clickMethodGroup = () => {
                      this.setState({
                        showDropdown: false,
                        showMenu: true,
                        tempGroup: item
                      });
                    };
                    const clickMethod = async () => {
                      await this.setState({
                        showDropdown: false,
                        showMenu: false,
                        tempGroup: item
                      });
                      this.selectItem(methods[0]);
                    };
                    if (methods.length > 1) {
                      return (
                        <DropdownItem
                          className={
                            /*@tag<graphics-dropdown-item>*/ "graphics-dropdown-item-vcdat"
                          }
                          onClick={clickMethodGroup}
                          key={item}
                        >
                          {item}
                        </DropdownItem>
                      );
                    }
                    return (
                      <DropdownItem
                        className={
                          /*@tag<graphics-dropdown-item>*/ "graphics-dropdown-item-vcdat"
                        }
                        onClick={clickMethod}
                        key={item}
                      >
                        {item} ({methods[0]})
                      </DropdownItem>
                    );
                  })}
                </DropdownMenu>
              </Dropdown>
              <Button
                className={
                  /*@tag<float-left graphics-close-btn>*/ "float-left graphics-close-btn-vcdat"
                }
                hidden={!this.state.showMenu || this.state.enterName}
                style={{ marginLeft: "5px" }}
                onClick={this.handleCloseClick}
                color="danger"
              >
                X
              </Button>
              <Button
                className={
                  /*@tag<float-right graphics-copy-btn>*/ "float-left graphics-copy-btn-vcdat"
                }
                style={{marginLeft: "0.5em"}}
                hidden={
                  !this.state.plotReady ||
                  this.state.showMenu ||
                  this.state.enterName ||
                  this.state.selectedGroup === ""
                }
                outline={true}
                onClick={this.handleCopyClick}
                color="info"
              >
                Copy
              </Button>
              <Button
                className={
                  /*@tag<float-right graphics-cancel-btn>*/ "float-right graphics-cancel-btn-vcdat"
                }
                hidden={!this.state.enterName}
                onClick={this.handleCancelClick}
                color="danger"
              >
                Cancel
              </Button>
            </CardSubtitle>
            <ColormapEditor
              updateColormap={this.props.updateColormap}
              plotReady={this.state.selectedMethod ? true : false}
            />
            <InputGroup
              hidden={!this.state.enterName}
              style={{ marginTop: "5px" }}
            >
              <Input
                className={
                  /*@tag<float-left graphics-name-input>*/ "float-left graphics-name-input-vcdat"
                }
                onChange={this.handleNameInput}
                value={this.state.nameValue}
                placeholder={"Enter new name here."}
              />
              <InputGroupAddon addonType="append">
                <Button
                  className={
                    /*@tag<float-right graphics-enter-btn>*/ "float-right graphics-enter-btn-vcdat"
                  }
                  onClick={this.handleEnterClick}
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
                !this.state.tempGroup ||
                !this.state.showMenu ||
                this.state.enterName
              }
            >
              <Collapse
                style={dropdownMenuStyle}
                isOpen={
                  !!this.state.tempGroup &&
                  this.state.showMenu &&
                  !this.state.enterName
                }
              >
                {!!this.state.tempGroup &&
                  this.graphicsOptions(this.state.tempGroup)}
              </Collapse>
            </Card>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ======= REACT COMPONENT HANDLERS =======
  private handlePlotReadyChanged(sidebar: LeftSideBarWidget, value: boolean) {
    this.setState({ plotReady: value });
  }

  private handleNameInput(event: React.ChangeEvent<HTMLInputElement>): void {
    // Regex filter for unallowed name characters
    const forbidden: RegExp = /^[^_a-z]|[^_a-z0-9]+/i;
    const invalid: boolean = forbidden.test(event.target.value);
    this.setState({ nameValue: event.target.value, invalidName: invalid });
  }

  private handleCloseClick(): void {
    this.setState({
      showDropdown: false,
      showMenu: false,
      tempGroup: this.state.selectedGroup
    });
  }

  private handleCopyClick(): void {
    this.setState({ enterName: true });
  }

  private handleCancelClick(): void {
    this.setState({
      enterName: false,
      invalidName: false,
      nameValue: ""
    });
  }

  private async handleEnterClick(): Promise<void> {
    if (this.state.nameValue && !this.state.invalidName) {
      try {
        await this.props.copyGraphicsMethod(
          this.state.selectedGroup,
          this.state.selectedMethod,
          this.state.nameValue
        );
        this.setState({
          enterName: false,
          invalidName: false,
          nameValue: "",
          selectedMethod: this.state.nameValue
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      NotebookUtilities.showMessage("Notice", "Name cannot be empty.");
      this.setState({ invalidName: true });
    }
  }
}
