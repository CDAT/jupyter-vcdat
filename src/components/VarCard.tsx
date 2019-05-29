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
  varSelectionChanged: ISignal<VarLoader, Variable[]>;
  varAliasExists: (varAlias: string, varLoaderSelection: boolean) => boolean; // Method that returns true if specified variable name is already taken
  selectVariable: (variable: Variable) => void; // method to call to add this variable to the list to get loaded
  deselectVariable: (variable: Variable) => void; // method to call to remove a variable from the list
  updateDimInfo: (newInfo: any, varID: string) => void; // method passed by the parent to update their copy of the variables dimension info
  // renameVariable: (newName: string, varID: string) => void; // Method that updates a variable's name before it's loaded
  isSelected: (varAlias: string) => boolean; // method to check if this variable is selected in parent
  selected: boolean; // should the axis be hidden by default
}
interface IVarCardState {
  variable: Variable;
  nameValue: string;
  showAxis: boolean;
  axisState: any;
  selected: boolean;
  nameState: NAME_STATUS;
}

export type NAME_STATUS =
  | "Invalid!"
  | "Name already loaded!"
  | "Name already selected!"
  | "Valid";

export class VarCard extends React.Component<IVarCardProps, IVarCardState> {
  constructor(props: IVarCardProps) {
    super(props);
    this.state = {
      axisState: [],
      nameState: "Valid",
      nameValue: "",
      selected: props.selected,
      showAxis: false,
      variable: this.props.variable
    };
    this.openMenu = this.openMenu.bind(this);
    this.clickVariable = this.clickVariable.bind(this);
    this.handleAxesClick = this.handleAxesClick.bind(this);
    this.handleWarningsClick = this.handleWarningsClick.bind(this);
    this.handleNameInput = this.handleNameInput.bind(this);
    // this.handleRenameClick = this.handleRenameClick.bind(this);
    this.updateSelections = this.updateSelections.bind(this);
    this.validateNameInput = this.validateNameInput.bind(this);
    this.updateDimensionInfo = this.updateDimensionInfo.bind(this);
  }

  public componentDidMount(): void {
    this.props.varSelectionChanged.connect(this.updateSelections);
  }

  public componentWillUnmount(): void {
    this.props.varSelectionChanged.disconnect(this.updateSelections);
  }

  public updateSelections() {
    this.setState({
      selected: this.props.isSelected(this.state.variable.varID),
      variable: this.props.variable
    });
  }

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  public clickVariable(): void {
    const isSelected: boolean = this.props.isSelected(
      this.state.variable.varID
    );
    if (isSelected) {
      this.props.deselectVariable(this.state.variable);
    } else {
      this.props.selectVariable(this.state.variable);
    }
    this.setState({
      nameState: "Valid",
      nameValue: "",
      selected: !isSelected
    });
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

  public updateDimensionInfo(newInfo: any): void {
    const updatedVar: Variable = this.state.variable;
    updatedVar.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
      if (axis.name !== newInfo.name) {
        return;
      }
      updatedVar.axisInfo[axisIndex].min = newInfo.min;
      updatedVar.axisInfo[axisIndex].max = newInfo.max;
    });
    this.setState({ variable: updatedVar });
    // this.props.updateDimInfo(newInfo, this.state.variable.varID)
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
                <Row className={/*@tag<varcard-main>*/ "varcard-main-vcdat"}>
                  <Col xs="sm-5">
                    <Button
                      className={
                        /*@tag<varcard-name-btn>*/ "varcard-name-btn-vcdat"
                      }
                      outline={true}
                      color={"success"}
                      onClick={this.clickVariable}
                      active={this.state.selected}
                      style={buttonsStyle}
                    >
                      {this.state.variable.alias}
                    </Button>
                  </Col>
                  <Col xs="sm-4">
                    {this.state.selected && (
                      <Button
                        className={
                          /*@tag<varcard-axes-btn>*/ "varcard-axes-btn-vcdat"
                        }
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
                          className={
                            /*@tag<varcard-warning-btn>*/ "varcard-warning-btn-vcdat"
                          }
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
                          // onClick={this.handleRenameClick}
                          color={nameStateColor}
                          disabled={
                            true /*this.state.nameState === "Invalid!"*/
                          }
                        >
                          {this.state.nameState}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  </CardBody>
                </Card>
              )}
              {this.state.showAxis &&
                this.state.variable.axisInfo.map((item: AxisInfo) => {
                  if (!item.data || item.data.length <= 1) {
                    return;
                  }
                  item.updateDimInfo = this.updateDimensionInfo;
                  return (
                    <div key={item.name} style={axisStyle}>
                      <Card>
                        <CardBody
                          className={
                            /*@tag<varcard-dimension>*/ "varcard-dimension-vcdat"
                          }
                        >
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

  private async validateNameInput(nameEntry: string): Promise<void> {
    /*if (nameEntry === this.state.variable.alias) {
      this.setState({ nameState: "Rename" });
      return;
    }*/

    const invalid: boolean = forbidden.test(nameEntry);
    let state: NAME_STATUS = "Valid";
    if (nameEntry === "" || invalid) {
      state = "Invalid!";
    } else if (this.props.varAliasExists(nameEntry, true)) {
      state = "Name already selected!";
    } else if (this.props.varAliasExists(nameEntry, false)) {
      state = "Name already loaded!";
    }
    await this.setState({ nameState: state });
  }

  private async handleNameInput(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const nameEntry: string = event.target.value;
    await this.validateNameInput(nameEntry);

    if (this.state.nameState !== "Invalid!") {
      // All checks and warnings done, rename variable;
      // this.props.renameVariable(nameEntry, this.state.variable.varID);
      const updatedVariable: Variable = this.state.variable;
      updatedVariable.alias = nameEntry;
      this.setState({
        // nameState: "Valid",
        // nameValue: "",
        variable: updatedVariable
      });
    }

    this.setState({ nameValue: nameEntry });
  }

  /*private async handleRenameClick(): Promise<void> {
    const state: string = this.state.nameState;

    // Reset if name isn't being changed
    if (this.state.nameValue === this.state.variable.alias) {
      this.setState({ nameValue: "", nameState: "Rename" });
      return;
    }
    if (this.state.nameValue === "") {
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
  }*/

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
