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
import Variable from "./Variable";

type PlotMenuProps = {
  updatePlotOptions: any; // the method to call when the users wants to update the plot options
  varInfo: Variable; // variable information about the selected variable
};
type PlotMenuState = {
  showMenu: boolean; // should the menu be expanded or not
  showDropdown: boolean; // should the drop down be open
  dropdownOptions: Array<string>; // options to select for the plot mode
  selectedDropdownOption: string; // the currently selected plot mode
  plotOptions: any; // the currently selected plot options
  valid_name: boolean; // is the given plot name valid
  options_changed: boolean; // have the options been changed
};

export default class PlotMenu extends React.Component<
  PlotMenuProps,
  PlotMenuState
> {
  constructor(props: PlotMenuProps) {
    super(props);
    this.state = {
      showMenu: false,
      showDropdown: false,
      dropdownOptions: ["1D", "2D", "3D"],
      selectedDropdownOption: "2D",
      valid_name: true,
      options_changed: false,
      plotOptions: {
        animation: false,
        save_img: false,
        plot_name: ""
      }
    };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.plotOptions = this.plotOptions.bind(this);
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
  setSelectedOption(option: string) {
    this.setState({
      selectedDropdownOption: option,
      showMenu: true
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
            <CardTitle>Plot Options</CardTitle>
            <CardSubtitle>
              <Dropdown
                isOpen={this.state.showDropdown}
                toggle={this.toggleDropdown}
              >
                <DropdownToggle caret>
                  Plot Type: {this.state.selectedDropdownOption}
                </DropdownToggle>
                <DropdownMenu>
                  {this.state.dropdownOptions.map(item => {
                    return (
                      <DropdownItem
                        onClick={() => this.setSelectedOption(item)}
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
              {this.plotOptions()}
            </Collapse>
          </CardBody>
        </Card>
      </div>
    );
  }
  selectTrue() {
    if (this.state.plotOptions.save_img && !this.state.plotOptions.plot_name) {
      this.setState({
        valid_name: false
      });
    } else {
      this.props.updatePlotOptions(this.state.plotOptions);
      this.setState({
        showMenu: false,
        options_changed: false
      });
    }
  }
  selectFalse() {
    this.setState({
      showMenu: false
    });
  }
  plotOptions() {
    if (this.state.selectedDropdownOption == "1D") {
      return <div>One Deee</div>;
    } else if (this.state.selectedDropdownOption == "2D") {
      return (
        <div>
          <Form>
            <FormGroup check>
              <Label check>
                <Input
                  type="radio"
                  name="radio1"
                  defaultChecked
                  onClick={() => {
                    if (this.state.plotOptions.animation != false) {
                      let newPlotOptions = this.state.plotOptions;
                      newPlotOptions.animation = false;
                      this.setState({
                        plotOptions: newPlotOptions,
                        options_changed: true
                      });
                    }
                  }}
                />{" "}
                Generate Image
              </Label>
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="radio"
                  name="radio1"
                  onClick={() => {
                    if (
                      this.state.plotOptions.animation != true ||
                      this.state.plotOptions.save_img
                    ) {
                      let newPlotOptions = this.state.plotOptions;
                      newPlotOptions.animation = true;
                      newPlotOptions.save_img = true;
                      this.setState({
                        plotOptions: newPlotOptions,
                        options_changed: true
                      });
                    }
                  }}
                />{" "}
                Generate Animation
              </Label>
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  checked={this.state.plotOptions.save_img}
                  onChange={() => {}}
                  onClick={() => {
                    let newPlotOptions = this.state.plotOptions;
                    newPlotOptions.save_img = !newPlotOptions.save_img;
                    this.setState({
                      plotOptions: newPlotOptions,
                      options_changed: true
                    });
                  }}
                />{" "}
                Save Image to Disc
              </Label>
            </FormGroup>
            {this.state.plotOptions.save_img && (
              <FormGroup>
                <Input
                  type="text"
                  id="plotNameInput"
                  placeholder="Plot Name"
                  onChange={event => {
                    let newPlotOptions = this.state.plotOptions;
                    newPlotOptions.plot_name = event.target.value;
                    this.setState({
                      plotOptions: newPlotOptions,
                      options_changed: true
                    });
                  }}
                />
              </FormGroup>
            )}
            {this.state.options_changed && (
              <FormGroup>
                <Button onClick={this.selectTrue} color="primary">
                  apply
                </Button>
                <Button onClick={this.selectFalse} color="danger">
                  cancel
                </Button>
              </FormGroup>
            )}
          </Form>
        </div>
      );
    } else if (this.state.selectedDropdownOption == "3D") {
      return <div>Three Deee</div>;
    }
  }
}
