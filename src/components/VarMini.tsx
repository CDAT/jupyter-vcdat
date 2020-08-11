// Dependencies
import * as React from "react";
import { ISignal } from "@lumino/signaling";
import { NotebookPanel } from "@jupyterlab/notebook";
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Collapse,
  CustomInput,
  Input,
  InputGroupAddon,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";

// Project Components
import CodeInjector from "../modules/CodeInjector";
import Utilities from "../modules/utils/Utilities";
import AxisInfo from "../modules/types/AxisInfo";
import DimensionSlider from "./DimensionSlider";
import Variable from "../modules/types/Variable";
import NotebookUtilities from "../modules/utils/NotebookUtilities";
import { checkForExportedFileCommand } from "../modules/PythonCommands";
import VariableTracker from "../modules/VariableTracker";
import { boundMethod } from "autobind-decorator";

const axisStyle: React.CSSProperties = {
  marginLeft: ".5em",
};
const badgeStyle: React.CSSProperties = {
  margin: "auto",
  marginLeft: "0.5em",
};

const modalOverflow: React.CSSProperties = {
  maxHeight: "70vh",
  overflow: "auto",
};

// Regex filter for unallowed variable names
const forbidden = /^[^a-z_]|[^a-z0-9_]+/i;

interface IVarMiniProps {
  buttonColor: string; // The hex value for the color
  codeInjector: CodeInjector;
  variable: Variable; // the variable this component will show
  varSelectionChanged: ISignal<VariableTracker, string[]>;
  varAliasExists: (varAlias: string) => boolean; // Method that returns true if specified variable name is already taken
  isSelected: (alias: string) => boolean; // method to check if this variable is selected in parent
  selected: boolean; // should the axis be hidden by default
  copyVariable: (
    variable: Variable,
    newName: string,
    addVariable: boolean
  ) => Variable;
  deleteVariable: (variable: Variable) => Promise<void>;
  selectVariable: (varID: string) => Promise<void>;
  modalOpen: (isOpen: boolean) => void;
  selectOrder: number;
  allowReload: boolean; // is this variable allowed to be reloaded
  reload: (item: Variable, newAlias?: string) => void; // a function to reload the variable
  setPlotInfo: (plotName: string, plotFormat: string) => void;
  exportAlerts: () => void;
  dismissSavePlotSpinnerAlert: () => void;
  showExportSuccessAlert: () => void;
  notebookPanel: NotebookPanel;
}
interface IVarMiniState {
  activateAppend: boolean;
  activateShuffle: boolean;
  activateDeflate: boolean;
  deflateValue: number;
  filename: string;
  nameState: NAME_STATUS;
  nameValue: string;
  newVariableSaveName: string;
  selected: boolean;
  showAxis: boolean; // should the edit axis modal be shown
  showSaveModal: boolean;
  validateFileName: boolean;
  variable: Variable;
}

export type NAME_STATUS = "Invalid!" | "Variable Already Exists!" | "Valid";

export default class VarMini extends React.Component<
  IVarMiniProps,
  IVarMiniState
> {
  constructor(props: IVarMiniProps) {
    super(props);
    this.state = {
      activateAppend: false,
      activateDeflate: false,
      activateShuffle: false,
      deflateValue: 0,
      filename: "",
      nameState: "Valid",
      nameValue: this.props.variable.alias,
      newVariableSaveName: "",
      selected: props.selected,
      showAxis: false,
      showSaveModal: false,
      validateFileName: false,
      variable: this.props.variable,
    };
  }

  public componentDidMount(): void {
    this.props.varSelectionChanged.connect(this.updateSelections);
  }

  public componentWillUnmount(): void {
    this.props.varSelectionChanged.disconnect(this.updateSelections);
  }

  @boundMethod
  public reset(): void {
    this.setState({
      activateAppend: false,
      activateDeflate: false,
      activateShuffle: false,
      deflateValue: 0,
      filename: "",
      nameState: "Valid",
      nameValue: this.props.variable.alias,
      newVariableSaveName: "",
      selected: this.props.selected,
      showAxis: false,
      showSaveModal: false,
      validateFileName: false,
      variable: this.props.variable,
    });
  }

  @boundMethod
  public updateSelections(): void {
    this.setState({
      selected: this.props.isSelected(this.state.variable.varID),
    });
  }

  /**
   * @description open the menu if its closed
   */
  @boundMethod
  public openMenu(): void {
    if (!this.state.showAxis) {
      this.setState({
        showAxis: true,
      });
    }
  }

  /**
   * @description Toggles the variable loader modal
   */
  @boundMethod
  public toggleModal(): void {
    this.props.modalOpen(!this.state.showAxis);
    this.setState({
      showAxis: !this.state.showAxis,
    });
  }

  /**
   * @description Toggles the save variable modal
   */
  @boundMethod
  public toggleSaveModal(): void {
    if (this.state.showSaveModal) {
      this.props.modalOpen(false);
    } else {
      this.props.modalOpen(true);
    }
    this.setState({
      activateDeflate: false,
      activateShuffle: false,
      deflateValue: 0,
      filename: "",
      showSaveModal: !this.state.showSaveModal,
    });
  }

  /**
   * @description Toggles the shuffle switch
   */
  @boundMethod
  public toggleShuffle(): void {
    this.setState({
      activateShuffle: !this.state.activateShuffle,
    });
  }

  /**
   * @description Toggles the deflate switch
   */
  @boundMethod
  public toggleDeflate(): void {
    this.setState(
      {
        activateDeflate: !this.state.activateDeflate,
      },
      () => {
        if (!this.state.activateDeflate) {
          this.setState({
            deflateValue: 0,
          });
        }
      }
    );
  }

  /**
   * @description Toggles the deflate switch
   */
  @boundMethod
  public toggleAppend(): void {
    this.setState({
      activateAppend: !this.state.activateAppend,
    });
  }

  @boundMethod
  public onFilenameChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ filename: event.target.value });
  }

  @boundMethod
  public updateDeflateValue(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ deflateValue: parseInt(event.target.value, 10) });
  }

  @boundMethod
  public updateNewVariableName(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    this.setState({ newVariableSaveName: event.target.value });
  }

  @boundMethod
  public dismissFilenameValidation(): void {
    this.setState({ validateFileName: false });
  }

  @boundMethod
  public async save(): Promise<void> {
    const splitFileName = this.state.filename.split(".");

    if (!this.state.filename) {
      this.setState({ validateFileName: true });
      return;
    }
    this.setState({ validateFileName: false });
    await this.props.codeInjector.saveNetCDFFile(
      this.state.filename,
      this.state.variable.alias,
      this.state.newVariableSaveName,
      this.state.activateAppend,
      this.state.activateShuffle,
      this.state.activateDeflate,
      this.state.deflateValue
    );
    this.toggleSaveModal();
    this.props.setPlotInfo(splitFileName[0], splitFileName[1]);
    this.props.exportAlerts();

    try {
      const result: string = await Utilities.sendSimpleKernelRequest(
        this.props.notebookPanel,
        checkForExportedFileCommand(this.state.filename)
      );
      if (result === "True") {
        this.props.dismissSavePlotSpinnerAlert();
        this.props.showExportSuccessAlert();
      }
    } catch (error) {
      console.error("error with checking file:", error);
    }
  }

  @boundMethod
  public updateDimensionInfo(newInfo: any): void {
    const updatedVar: Variable = this.state.variable;
    updatedVar.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
      if (axis.name !== newInfo.name) {
        return;
      }
      updatedVar.axisInfo[axisIndex].first = newInfo.first;
      updatedVar.axisInfo[axisIndex].last = newInfo.last;
    });
    this.setState({ variable: updatedVar });
  }

  public render(): JSX.Element {
    // Set the input color
    let nameStateColor = "success";
    if (this.state.nameState === "Invalid!") {
      nameStateColor = "danger";
    } else if (this.state.nameState === "Variable Already Exists!") {
      nameStateColor = "warning";
    }

    return (
      <div>
        <div
          className={
            /* @tag<clearfix varmini-main>*/ "clearfix varmini-main-vcdat"
          }
        >
          <Button
            className={/* @tag<varmini-name-btn>*/ "varmini-name-btn-vcdat"}
            outline={true}
            color={"success"}
            active={this.props.isSelected(this.state.variable.varID)}
          >
            {this.state.variable.alias}
          </Button>
          <ButtonGroup className="float-right" size="sm" style={axisStyle}>
            {this.props.isSelected(this.state.variable.varID) && (
              <Button
                disabled={true}
                style={{
                  ...badgeStyle,
                  ...{ backgroundColor: this.props.buttonColor },
                }}
              >
                {Utilities.numToOrdStr(this.props.selectOrder)}
              </Button>
            )}
            <Button
              className={/* @tag<varmini-edit-btn>*/ "varmini-edit-btn-vcdat"}
              outline={true}
              // style={axisStyle}
              title={
                this.state.variable.sourceName === ""
                  ? "Note: This variable was not loaded from a file."
                  : ""
              }
              color={"info"}
              onClick={this.handleEditClick}
            >
              edit
            </Button>
            <Button
              outline={true}
              color={"secondary"}
              // style={axisStyle}
              onClick={this.handleSaveClick}
            >
              save
            </Button>
            <Button
              outline={true}
              color={"danger"}
              // style={axisStyle}
              onClick={this.handleDeleteClick}
            >
              delete
            </Button>
          </ButtonGroup>
        </div>
        <Modal
          className={"var-loader-modal"}
          isOpen={this.state.showAxis}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>
            Edit Variable: {this.state.variable.alias}
          </ModalHeader>
          <ModalBody
            className={/* @tag<varmini-edit-modal>*/ "varmini-edit-modal-vcdat"}
          >
            <Card>
              <CardBody>
                <ButtonGroup style={{ marginTop: "5px" }}>
                  <InputGroupAddon addonType="prepend">
                    Rename Variable:
                  </InputGroupAddon>
                  <Input
                    onChange={this.handleNameInput}
                    value={this.state.nameValue}
                    placeholder="Enter new name here."
                  />
                  <InputGroupAddon addonType="append">
                    <Button color={nameStateColor} disabled={true}>
                      {this.state.nameState}
                    </Button>
                  </InputGroupAddon>
                </ButtonGroup>
              </CardBody>
            </Card>
            {this.state.showAxis &&
              this.state.variable.axisInfo.length > 0 &&
              this.state.variable.axisInfo.map((item: AxisInfo) => {
                if (!item.data || item.data.length <= 1) {
                  return;
                }
                item.updateDimInfo = this.updateDimensionInfo;
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
          </ModalBody>
          <ModalFooter>
            <Button
              className={
                /* @tag<varmini-update-btn>*/ "varmini-update-btn-vcdat"
              }
              color="primary"
              onClick={this.handleUpdateClick}
            >
              Update
            </Button>
          </ModalFooter>
        </Modal>
        <Modal
          id="var-save-modal"
          isOpen={this.state.showSaveModal}
          toggle={this.toggleSaveModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleSaveModal}>Save Variable</ModalHeader>
          <ModalBody style={modalOverflow}>
            <Label>Filename:</Label>
            <Input
              type="text"
              name="text"
              placeholder="Name.nc"
              value={this.state.filename}
              onChange={this.onFilenameChange}
            />
            <Alert
              color="danger"
              isOpen={this.state.validateFileName}
              toggle={this.dismissFilenameValidation}
            >
              The file name can not be blank
            </Alert>
            <Label>Variable Name in File:</Label>
            <Input
              type="text"
              name="text"
              placeholder={this.state.variable.alias}
              value={this.state.newVariableSaveName}
              onChange={this.updateNewVariableName}
            />
            <br />
            <CustomInput
              type="switch"
              id="shuffleSwitch"
              name="shuffleSwitch"
              label="Shuffle"
              checked={this.state.activateShuffle}
              onChange={this.toggleShuffle}
            />
            <br />
            <CustomInput
              type="switch"
              id="deflateSwitch"
              name="deflateSwitch"
              label="Deflate"
              checked={this.state.activateDeflate}
              onChange={this.toggleDeflate}
            />
            <br />
            <Collapse isOpen={this.state.activateDeflate}>
              <Label>Deflate Level:</Label>
              <Input
                type="select"
                name="select"
                id="deflateSelect"
                value={this.state.deflateValue}
                onChange={this.updateDeflateValue}
              >
                <option>0</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
                <option>7</option>
                <option>8</option>
                <option>9</option>
              </Input>
            </Collapse>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.save}>
              Save
            </Button>{" "}
            <Button color="secondary" onClick={this.toggleSaveModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }

  @boundMethod
  private async handleCopyClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    clickEvent.stopPropagation();
    const copy: Variable = this.props.copyVariable(
      this.state.variable,
      this.state.nameValue,
      true
    );
    await this.props.codeInjector.loadVariable(copy);
  }

  @boundMethod
  private async handleDeleteClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    clickEvent.stopPropagation();
    const result: boolean = await NotebookUtilities.showYesNoDialog(
      "Warning!",
      "Are you sure you want to delete this variable?",
      "OK",
      "Cancel"
    );
    if (result) {
      await this.props.deleteVariable(this.state.variable);
    }
  }

  @boundMethod
  private async handleEditClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    clickEvent.stopPropagation();
    if (this.state.variable.axisInfo.length > 0) {
      this.setState({ showAxis: true });
      this.props.modalOpen(true);
    } else {
      this.setState({ showAxis: false });
      this.props.modalOpen(false);
    }
  }

  @boundMethod
  private handleSaveClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): void {
    this.toggleSaveModal();
    clickEvent.stopPropagation();
  }

  @boundMethod
  private validateNameInput(nameEntry: string): void {
    if (nameEntry === this.state.variable.alias) {
      this.setState({ nameState: "Valid" });
      return;
    }

    const invalid: boolean = forbidden.test(nameEntry);
    let state: NAME_STATUS = "Valid";
    if (nameEntry === "" || invalid) {
      state = "Invalid!";
    } else if (this.props.varAliasExists(nameEntry)) {
      state = "Variable Already Exists!";
    }

    this.setState({ nameState: state });
  }

  @boundMethod
  private handleNameInput(event: React.ChangeEvent<HTMLInputElement>): void {
    const nameEntry: string = event.target.value;
    this.setState({ nameValue: nameEntry });
    this.validateNameInput(nameEntry);
  }

  @boundMethod
  private async handleUpdateClick(): Promise<void> {
    if (this.state.nameState === "Variable Already Exists!") {
      const proceed: boolean = await NotebookUtilities.showYesNoDialog(
        "Warning!",
        "Another variable already has this name. In order to rename this variable the other will be replaced. Continue?",
        "Yes, replace other variable.",
        "Cancel"
      );
      if (!proceed) {
        return;
      }
    }

    this.toggleModal();
    // Load new variable
    await this.props.reload(this.state.variable, this.state.nameValue);

    // Delete old variable if rename was done
    if (this.state.variable.alias !== this.state.nameValue) {
      // Create a copy with the new name
      const copy: Variable = this.props.copyVariable(
        this.state.variable,
        this.state.nameValue,
        true
      );

      // Delete variable of the old name
      await this.props.deleteVariable(this.state.variable);
      await this.setState({ variable: copy });
    }
    // Select the new variable (if previous one deleted)
    this.props.selectVariable(this.state.variable.varID);
    this.reset();
  }
}
