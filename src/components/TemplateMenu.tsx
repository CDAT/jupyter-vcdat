import * as React from "react";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  CardTitle,
  CardSubtitle,
  Card,
  CardBody
} from "reactstrap";

const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};

type TemplateMenuProps = {
  getTemplatesList: Function; // a method to call when the user has seleted a template
  updateTemplateOptions: Function;
};
type TemplateMenuState = {
  showMenu: boolean;
  showDropdown: boolean;
  selectedTemplate: string;
  optionsChanged: boolean;
  plotReady: boolean;
};

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
  resetTemplateMenuState(): void {
    this.setState({
      showMenu: false,
      showDropdown: false,
      selectedTemplate: "",
      optionsChanged: false
    });
  }

  toggleMenu(): void {
    this.setState({
      showMenu: !this.state.showMenu
    });
  }

  toggleDropdown(): void {
    this.setState({
      showDropdown: !this.state.showDropdown
    });
  }

  render(): JSX.Element {
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
                <DropdownToggle disabled={!this.state.plotReady} caret>
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
