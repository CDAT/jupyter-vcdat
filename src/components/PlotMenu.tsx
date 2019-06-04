/* tslint:disable */
// LINTING TURNED OFF UNTIL THIS FILE IS ACTUALLY USED
// Dependencies
import { Dialog, showDialog } from "@jupyterlab/apputils";
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
  Form,
  FormGroup,
  Input,
  Label
} from "reactstrap";

// Project Components
import Variable from "./Variable";

interface IPlotMenuProps {
  updatePlotOptions: (plotOptions: any) => void; // the method to call when the users wants to update the plot options
  varInfo: Variable; // variable information about the selected variable
}
interface IPlotMenuState {
  dropdownOptions: string[]; // options to select for the plot mode
  optionsChanged: boolean; // have the options been changed
  plotOptions: any; // the currently selected plot options
  selectedDropdownOption: string; // the currently selected plot mode
  showMenu: boolean; // should the menu be expanded or not
  showDropdown: boolean; // should the drop down be open
  validName: boolean; // is the given plot name valid
}

export default class PlotMenu extends React.Component<
  IPlotMenuProps,
  IPlotMenuState
> {
  constructor(props: IPlotMenuProps) {
    super(props);
    this.state = {
      showMenu: false,
      showDropdown: false,
      dropdownOptions: ["1D", "2D", "3D"],
      selectedDropdownOption: "2D",
      validName: true,
      optionsChanged: false,
      plotOptions: {
        animation: false,
        saveImg: false,
        plotName: ""
      }
    };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.plotOptions = this.plotOptions.bind(this);
    this.selectFalse = this.selectFalse.bind(this);
    this.selectTrue = this.selectTrue.bind(this);
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
  public setSelectedOption(option: string): void {
    this.setState({
      selectedDropdownOption: option,
      showMenu: true
    });
  }
  public render(): JSX.Element {
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
                <DropdownToggle caret={true}>
                  Plot Type: {this.state.selectedDropdownOption}
                </DropdownToggle>
                <DropdownMenu>
                  {this.state.dropdownOptions.map((item: string) => {
                    return (
                      <DropdownItem
                        onClick={() =>
                          this.setState({
                            selectedDropdownOption: item,
                            showMenu: true
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
              {this.plotOptions()}
            </Collapse>
          </CardBody>
        </Card>
      </div>
    );
  }
  public selectTrue(): void {
    if (this.state.plotOptions.saveImg && !this.state.plotOptions.plotName) {
      const msg =
        "A filename is required when saving plots or creating animations";
      showDialog({
        title: "Filename Required",
        body: msg,
        buttons: [Dialog.okButton()]
      });
      this.setState({
        validName: false
      });
    } else {
      this.props.updatePlotOptions(this.state.plotOptions);
      this.setState({
        showMenu: false,
        optionsChanged: false
      });
    }
  }
  public selectFalse(): void {
    this.setState({
      showMenu: false
    });
  }
  public plotOptions(): JSX.Element {
    if (this.state.selectedDropdownOption === "1D") {
      return <div>One Deee</div>;
    }
    if (this.state.selectedDropdownOption === "2D") {
      return (
        <div>
          <Form className={"jp-vcsWidget-Form"}>
            <FormGroup check={true}>
              <Label check={true}>
                <Input
                  type="radio"
                  name="radio1"
                  defaultChecked={true}
                  onClick={() => {
                    if (this.state.plotOptions.animation != false) {
                      const newPlotOptions = this.state.plotOptions;
                      newPlotOptions.animation = false;
                      this.setState({
                        plotOptions: newPlotOptions,
                        optionsChanged: true
                      });
                    }
                  }}
                />{" "}
                Generate Image
              </Label>
            </FormGroup>
            <FormGroup check={true}>
              <Label check={true}>
                <Input
                  type="radio"
                  name="radio1"
                  onClick={() => {
                    if (
                      this.state.plotOptions.animation != true ||
                      this.state.plotOptions.saveImg
                    ) {
                      const newPlotOptions = this.state.plotOptions;
                      newPlotOptions.animation = true;
                      newPlotOptions.saveImg = true;
                      this.setState({
                        plotOptions: newPlotOptions,
                        optionsChanged: true
                      });
                    }
                  }}
                />{" "}
                Generate Animation
              </Label>
            </FormGroup>
            <FormGroup check={true}>
              <Label check={true}>
                <Input
                  type="checkbox"
                  checked={this.state.plotOptions.saveImg}
                  onChange={() => {}}
                  onClick={() => {
                    const newPlotOptions = this.state.plotOptions;
                    newPlotOptions.saveImg = !newPlotOptions.saveImg;
                    this.setState({
                      plotOptions: newPlotOptions,
                      optionsChanged: true
                    });
                  }}
                />{" "}
                Save Image to Disc
              </Label>
            </FormGroup>
            {this.state.plotOptions.saveImg && (
              <FormGroup>
                <Input
                  type="text"
                  className="plotNameInput"
                  placeholder="Plot Name"
                  onChange={event => {
                    const newPlotOptions = this.state.plotOptions;
                    newPlotOptions.plotName = event.target.value;
                    this.setState({
                      plotOptions: newPlotOptions,
                      optionsChanged: true
                    });
                  }}
                />
              </FormGroup>
            )}

            <FormGroup className={"jp-vcsWidget-apply-buttons"}>
              <Button onClick={this.selectFalse} color="danger">
                cancel
              </Button>
              {this.state.optionsChanged && (
                <Button onClick={this.selectTrue} color="primary">
                  apply
                </Button>
              )}
            </FormGroup>
          </Form>
        </div>
      );
    }
    if (this.state.selectedDropdownOption === "3D") {
      return <div>Three Deee</div>;
    }
  }
}
