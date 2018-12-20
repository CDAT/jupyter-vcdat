import * as React from "react";
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
import CardText from "reactstrap/lib/CardText";

const dropdownMenuStype: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};

type TemplateMenuProps = {
  updateTemplate: any; // a method to call when the user has seleted a template
};
type TemplateMenuState = {
  showMenu: boolean;
  showDropdown: boolean;
  selectedTemplate: string;
  optionsChanged: boolean;
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
      selectedTemplate: "Select a template",
      optionsChanged: false
    };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
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
  selectTrue() {
    this.props.updateTemplate(this.state.selectedTemplate);
    this.setState({
      showDropdown: false,
      showMenu: false,
      optionsChanged: false
    });
  }
  selectFalse() {
    this.setState({
      showDropdown: false,
      showMenu: false
    });
  }
  render() {
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
                <DropdownToggle caret>
                  {this.state.selectedTemplate}
                </DropdownToggle>
                <DropdownMenu style={dropdownMenuStype}>
                  {data.map((item: string) => {
                    return (
                      <DropdownItem
                        onClick={() => {
                          this.setState({
                            selectedTemplate: item,
                            showMenu: true,
                            optionsChanged: true
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
              <Form className={"jp-vcsWidget-Form"}>
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
            </Collapse>
          </CardBody>
        </Card>
      </div>
    );
  }
}

const data: Array<string> = [
  "default",
  "ASD",
  "ASD_dud",
  "BL_of6_1legend",
  "BLof6",
  "BR_of6_1legend",
  "BRof6",
  "LLof4",
  "LLof4_dud",
  "LRof4",
  "LRof4_dud",
  "ML_of6",
  "ML_of6_1legend",
  "MR_of6",
  "MR_of6_1legend",
  "UL_of6_1legend",
  "ULof4",
  "ULof4_dud",
  "ULof6",
  "UR_of6",
  "UR_of6_1legend",
  "URof4",
  "URof4_dud",
  "bold_mid_of3",
  "bold_top_of3",
  "boldbot_of3_l",
  "boldmid_of3_l",
  "boldtop_of3_l",
  "bot_of2",
  "deftaylor",
  "hovmuller",
  "mollweide2",
  "no_legend",
  "polar",
  "por_botof3",
  "por_botof3_dud",
  "por_midof3",
  "por_midof3_dud",
  "por_topof3",
  "por_topof3_dud",
  "quick",
  "top_of2"
];
