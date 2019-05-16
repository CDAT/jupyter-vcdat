// Dependencies
import * as React from "react";
import {
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle
} from "reactstrap";
import { ISignal } from "@phosphor/signaling";
import { LeftSideBarWidget } from "../widgets";

const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};

interface ITemplateMenuProps {
  plotReady: boolean;
  plotReadyChanged: ISignal<LeftSideBarWidget, boolean>;
  getTemplatesList: () => string[]; // a method to call when the user has seleted a template
  updateTemplateOptions: (templateName: string) => Promise<void>;
}
interface ITemplateMenuState {
  showMenu: boolean;
  showDropdown: boolean;
  selectedTemplate: string;
  optionsChanged: boolean;
  plotReady: boolean;
}

export default class TemplateMenu extends React.Component<
  ITemplateMenuProps,
  ITemplateMenuState
> {
  constructor(props: ITemplateMenuProps) {
    super(props);
    this.state = {
      optionsChanged: false,
      plotReady: this.props.plotReady,
      selectedTemplate: "",
      showDropdown: false,
      showMenu: false
    };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.resetTemplateMenuState = this.resetTemplateMenuState.bind(this);
    this.handlePlotReadyChanged = this.handlePlotReadyChanged.bind(this);

    this.props.plotReadyChanged.connect(this.handlePlotReadyChanged);
  }

  // Resets the graphics menu to initial, (for when a new notebook is selected)
  public resetTemplateMenuState(): void {
    this.setState({
      optionsChanged: false,
      selectedTemplate: "",
      showDropdown: false,
      showMenu: false
    });
  }

  public toggleMenu(): void {
    this.setState({
      showMenu: !this.state.showMenu
    });
  }

  public toggleDropdown(): void {
    this.setState({
      showDropdown: !this.state.showDropdown
    });
  }

  public render(): JSX.Element {
    let dropDownTitle: string = this.state.selectedTemplate;
    if (this.state.selectedTemplate === "") {
      dropDownTitle = "Select A Template";
    }
    return (
      <div>
        <Card id="tm_card">
          <CardBody>
            <CardTitle>Layout Template</CardTitle>
            <CardSubtitle>
              <Dropdown
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle disabled={!this.state.plotReady} caret={true}>
                  {dropDownTitle}
                </DropdownToggle>
                <DropdownMenu style={dropdownMenuStype}>
                  {this.props.getTemplatesList().map((item: string) => {
                    const handleClick = () => {
                      this.props.updateTemplateOptions(item);
                      this.setState({
                        optionsChanged: false,
                        selectedTemplate: item,
                        showDropdown: false,
                        showMenu: false
                      });
                    };
                    return (
                      <DropdownItem onClick={handleClick} key={item}>
                        {item}
                      </DropdownItem>
                    );
                  })}
                </DropdownMenu>
              </Dropdown>
            </CardSubtitle>
          </CardBody>
        </Card>
      </div>
    );
  }

  private handlePlotReadyChanged(sidebar: LeftSideBarWidget, value: boolean) {
    this.setState({ plotReady: value });
  }
}
