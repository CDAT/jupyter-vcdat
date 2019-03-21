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

const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};

interface TemplateMenuProps {
  getTemplatesList: Function; // a method to call when the user has seleted a template
  updateTemplateOptions: Function;
}
interface TemplateMenuState {
  showMenu: boolean;
  showDropdown: boolean;
  selectedTemplate: string;
  optionsChanged: boolean;
  plotReady: boolean;
}

export default class TemplateMenu extends React.Component<
  TemplateMenuProps,
  TemplateMenuState
> {
  constructor(props: TemplateMenuProps) {
    super(props);
    this.state = {
      showMenu: false,
      showDropdown: false,
      selectedTemplate: "",
      optionsChanged: false,
      plotReady: false
    };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.resetTemplateMenuState = this.resetTemplateMenuState.bind(this);
  }

  // Resets the graphics menu to initial, (for when a new notebook is selected)
  public resetTemplateMenuState(): void {
    this.setState({
      showMenu: false,
      showDropdown: false,
      selectedTemplate: "",
      optionsChanged: false
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
    if (this.state.selectedTemplate == "") {
      dropDownTitle = "Select A Template";
    }
    return (
      <div>
        <Card>
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
                    return (
                      <DropdownItem
                        onClick={() => {
                          this.props.updateTemplateOptions(item);
                          this.setState({
                            showDropdown: false,
                            showMenu: false,
                            optionsChanged: false,
                            selectedTemplate: item
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
          </CardBody>
        </Card>
      </div>
    );
  }
}
