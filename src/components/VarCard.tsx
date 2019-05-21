// Dependencies
import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Col,
  Collapse,
  Input,
  InputGroup,
  InputGroupAddon,
  Row
} from "reactstrap";

// Project Components
import { NotebookUtilities } from "../NotebookUtilities";
import { AxisInfo } from "./AxisInfo";
import { DimensionSlider } from "./DimensionSlider";
import { Variable } from "./Variable";
import { ISignal } from "@phosphor/signaling";
import { VarLoader } from "./VarLoader";

const cardStyle: React.CSSProperties = {
  margin: ".5em"
};
const centered: React.CSSProperties = {
  margin: "auto"
};
const axisStyle: React.CSSProperties = {
  marginTop: "0.5em"
};
const buttonsStyle: React.CSSProperties = {
  width: "inherit"
};
// Regex filter for unallowed variable names
const forbidden: RegExp = /^[^a-z_]|[^a-z0-9_]+/i;

interface IVarCardProps {
  variable: Variable;
  varSelections: () => Variable[];
  varSelectionChanged: ISignal<VarLoader, Variable[]>;
  varAliasExists: (varAlias: string, varLoaderSelection: boolean) => boolean; // Method that returns true if specified variable name is already taken
  selectVariable: (variable: Variable) => void; // method to call to add this variable to the list to get loaded
  deselectVariable: (variable: Variable) => void; // method to call to remove a variable from the list
  updateDimInfo: (newInfo: any, varID: string) => void; // method passed by the parent to update their copy of the variables dimension info
  renameVariable: (newName: string, varID: string) => void; // Method that updates a variable's name before it's loaded
  isSelected: (varAlias: string) => boolean; // method to check if this variable is selected in parent
  allowReload: boolean;
  selected: boolean; // should the axis be hidden by default
}
interface IVarCardState {
  variable: Variable;
  nameValue: string;
  showAxis: boolean;
  loadOrder: number;
  axisState: any;
  selected: boolean;
  isChanged: boolean;
  nameState: NAME_STATUS;
}

export type NAME_STATUS =
  | "Invalid!"
  | "Name already loaded!"
  | "Name already selected!"
  | "Rename";

export class VarCard extends React.Component<IVarCardProps, IVarCardState> {
  constructor(props: IVarCardProps) {
    super(props);
    this.state = {
      axisState: [],
      isChanged: false,
      loadOrder: -1,
      nameState: "Rename",
      nameValue: "",
      selected: props.selected,
      showAxis: false,
      variable: this.props.variable
    };
    this.openMenu = this.openMenu.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.handleAxesClick = this.handleAxesClick.bind(this);
    this.handleWarningsClick = this.handleWarningsClick.bind(this);
    this.handleNameInput = this.handleNameInput.bind(this);
    this.handleEnterClick = this.handleEnterClick.bind(this);
    this.updateSelections = this.updateSelections.bind(this);
    this.validateNameInput = this.validateNameInput.bind(this);
  }

  public componentDidMount(): void {
    this.props.varSelectionChanged.connect(this.updateSelections);
  }

  public componentWillUnmount(): void {
    this.props.varSelectionChanged.disconnect(this.updateSelections);
  }

  public updateSelections() {
    this.setState({
      selected: this.props.isSelected(this.state.variable.varID)
    });
  }

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  public selectVariable(): void {
    if (this.props.isSelected(this.state.variable.varID)) {
      this.setState({
        nameState: "Rename",
        nameValue: "",
        selected: false
      });
      this.props.deselectVariable(this.state.variable);
    } else {
      this.setState({
        nameState: "Rename",
        nameValue: "",
        selected: true
      });
      this.props.selectVariable(this.state.variable);
    }
  }

  /**
   * @description open the menu if its closed
   */
  public openMenu(): void {
    if (!this.state.showAxis && this.state.selected) {
      this.setState({
        showAxis: true
      });
    }
  }

  public updateDimInfo(newInfo: any, varID: string): void {
    if (this.props.allowReload) {
      this.setState({
        isChanged: true
      });
    }
    this.props.updateDimInfo(newInfo, varID);
  }

  public render(): JSX.Element {
    // Set the input color
    let nameStateColor = "success";
    if (
      this.state.nameState === "Invalid!" ||
      this.state.nameState === "Name already selected!"
    ) {
      nameStateColor = "danger";
    } else if (this.state.nameState === "Name already loaded!") {
      nameStateColor = "warning";
    }

    return (
      <div>
        <Card style={cardStyle}>
          <CardBody>
            <CardTitle>
              <div style={centered}>
                <Row>
                  <Col xs="sm-5">
                    <Button
                      outline={true}
                      color={"success"}
                      onClick={this.selectVariable}
                      active={this.state.selected}
                      style={buttonsStyle}
                    >
                      {this.state.variable.alias}
                    </Button>
                  </Col>
                  <Col xs="sm-4">
                    {this.state.selected && (
                      <Button
                        outline={true}
                        color={"danger"}
                        active={this.state.showAxis}
                        onClick={this.handleAxesClick}
                        style={buttonsStyle}
                      >
                        Edit
                      </Button>
                    )}
                  </Col>
                  {// Check variable is selected before checking if alias exists for better performance
                  this.state.selected &&
                    this.props.varAliasExists(
                      this.state.variable.alias,
                      false
                    ) && (
                      <Col xs="sm-3">
                        <Button
                          color={"warning"}
                          onClick={this.handleWarningsClick}
                        >
                          !
                        </Button>
                      </Col>
                    )}
                </Row>
              </div>
            </CardTitle>
            <Collapse
              isOpen={this.state.selected && this.state.showAxis}
              onClick={this.openMenu}
            >
              {this.state.selected && (
                <Card>
                  <CardBody>
                    <InputGroup style={{ marginTop: "5px" }}>
                      <InputGroupAddon addonType="prepend">
                        Rename Variable:
                      </InputGroupAddon>
                      <Input
                        onChange={this.handleNameInput}
                        className="float-left"
                        value={this.state.nameValue}
                        placeholder="Enter new name here."
                      />
                      <InputGroupAddon addonType="append">
                        <Button
                          className="float-right"
                          onClick={this.handleEnterClick}
                          color={nameStateColor}
                          disabled={this.state.nameState === "Invalid!"}
                        >
                          {this.state.nameState}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  </CardBody>
                </Card>
              )}
              {this.state.showAxis &&
                this.props.variable.axisInfo.map((item: AxisInfo) => {
                  if (!item.data || item.data.length <= 1) {
                    return;
                  }
                  item.updateDimInfo = this.updateDimInfo;
                  return (
                    <div key={item.name} style={axisStyle}>
                      <Card>
                        <CardBody>
                          <DimensionSlider
                            {...item}
                            varID={this.state.variable.varID}
                          />
                        </CardBody>
                      </Card>
                    </div>
                  );
                })}
            </Collapse>
          </CardBody>
          <CardFooter />
        </Card>
      </div>
    );
  }

  private validateNameInput(nameEntry: string): void {
    if (nameEntry === this.state.variable.alias) {
      this.setState({ nameState: "Rename" });
      return;
    }

    const invalid: boolean = forbidden.test(nameEntry);
    let state: NAME_STATUS = "Rename";
    if (nameEntry === "" || invalid) {
      state = "Invalid!";
    } else if (this.props.varAliasExists(nameEntry, true)) {
      state = "Name already selected!";
    } else if (this.props.varAliasExists(nameEntry, false)) {
      state = "Name already loaded!";
    }
    this.setState({ nameState: state });
  }

  private handleNameInput(event: React.ChangeEvent<HTMLInputElement>): void {
    const nameEntry: string = event.target.value;
    this.validateNameInput(nameEntry);
    this.setState({ nameValue: nameEntry });
  }

  private async handleEnterClick(): Promise<void> {
    const state: string = this.state.nameState;

    // Reset if name isn't being changed
    if (this.state.nameValue === this.state.variable.alias) {
      this.setState({ nameValue: "", nameState: "Rename" });
      return;
    }
    if (state === "") {
      await NotebookUtilities.showMessage(
        "Notice",
        "Please enter the new name for the variable.",
        "OK"
      );
      this.setState({ nameState: "Invalid!" });
      return;
    }
    if (state === "Invalid!") {
      await NotebookUtilities.showMessage(
        "Notice",
        "The name you entered has invalid characters.",
        "Dismiss"
      );
      return;
    }
    if (state === "Name already selected!") {
      await NotebookUtilities.showMessage(
        "Notice",
        `The name you entered is already selected in this form. \
        You cannot load multiple variables of the same name.`,
        "Dismiss"
      );
      return;
    }
    if (state === "Name already loaded!") {
      await NotebookUtilities.showMessage(
        "Notice",
        `The selected name matches the name of another variable that has loaded. \
        You should rename this variable something else if you don't want to override the other variable.`,
        "OK"
      );
    }

    // All checks and warnings done, rename variable;
    this.props.renameVariable(state, this.state.variable.varID);
    const updatedVariable: Variable = this.state.variable;
    updatedVariable.alias = this.state.nameValue;
    this.setState({
      nameState: "Rename",
      nameValue: "",
      variable: updatedVariable
    });
  }

  private handleAxesClick(): void {
    this.setState({ showAxis: !this.state.showAxis });
  }

  private handleWarningsClick(): void {
    NotebookUtilities.showMessage(
      "Warning",
      `Loading '${
        this.state.variable.alias
      }' from this file will overwrite the current '${
        this.state.variable.alias
      }' variable. Rename this variable if you don't want to overwrite the previously loaded variable.`,
      "Dismiss"
    );
  }
}
