// Dependencies
import * as React from "react";
import { NotebookPanel } from "@jupyterlab/notebook";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Collapse,
  CustomInput,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  InputGroup,
  InputGroupAddon
} from "reactstrap";

// Project Components
import { CodeInjector } from "../CodeInjector";
import { Utilities } from "../Utilities";
import { AxisInfo } from "./AxisInfo";
import { DimensionSlider } from "./DimensionSlider";
import { Variable } from "./Variable";
import { NotebookUtilities } from "../NotebookUtilities";
import { OUTPUT_RESULT_NAME } from "../constants";
import { ISignal } from "@phosphor/signaling";
import { VariableTracker } from "../VariableTracker";

const axisStyle: React.CSSProperties = {
  marginLeft: ".5em"
};
const badgeStyle: React.CSSProperties = {
  margin: "auto",
  marginLeft: "0.5em"
};

const modalOverflow: React.CSSProperties = {
  maxHeight: "70vh",
  overflow: "auto"
};

// Regex filter for unallowed variable names
const forbidden: RegExp = /^[^a-z_]|[^a-z0-9_]+/i;

interface IVarMiniProps {
  buttonColor: string; // The hex value for the color
  codeInjector: CodeInjector;
  variable: Variable; // the variable this component will show
  varSelectionChanged: ISignal<VariableTracker, string[]>;
  updateDimInfo: (newInfo: any, varID: string) => void; // method passed by the parent to update their copy of the variables dimension info
  isSelected: (alias: string) => boolean; // method to check if this variable is selected in parent
  selected: boolean; // should the axis be hidden by default
  copyVariable: (variable: Variable, newName: string) => Promise<void>;
  deleteVariable: (variable: Variable) => Promise<void>;
  modalOpen: (isOpen: boolean) => void;
  selectOrder: number;
  allowReload: boolean; // is this variable allowed to be reloaded
  reload: () => void; // a function to reload the variable
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
  editedVariable: Variable;
}

export type NAME_STATUS = "Invalid!" | "Valid";

export class VarMini extends React.Component<IVarMiniProps, IVarMiniState> {
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
      editedVariable: new Variable()
    };
    this.openMenu = this.openMenu.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleUpdateClick = this.handleUpdateClick.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.toggleSaveModal = this.toggleSaveModal.bind(this);
    this.toggleShuffle = this.toggleShuffle.bind(this);
    this.toggleDeflate = this.toggleDeflate.bind(this);
    this.toggleAppend = this.toggleAppend.bind(this);
    this.onFilenameChange = this.onFilenameChange.bind(this);
    this.updateDeflateValue = this.updateDeflateValue.bind(this);
    this.updateNewVariableName = this.updateNewVariableName.bind(this);
    this.save = this.save.bind(this);
    this.dismissFilenameValidation = this.dismissFilenameValidation.bind(this);
    this.updateSelections = this.updateSelections.bind(this);
    this.handleNameInput = this.handleNameInput.bind(this);
    //this.handleRenameClick = this.handleRenameClick.bind(this);
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
   * @description open the menu if its closed
   */
  public openMenu(): void {
    if (!this.state.showAxis) {
      this.setState({
        showAxis: true
      });
    }
  }

  /**
   * @description Toggles the variable loader modal
   */
  public toggleModal(): void {
    this.props.modalOpen(!this.state.showAxis);
    this.setState({
      showAxis: !this.state.showAxis
    });
  }

  /**
   * @description Toggles the save variable modal
   */
  public toggleSaveModal(): void {
    this.setState({
      activateDeflate: false,
      activateShuffle: false,
      deflateValue: 0,
      filename: "",
      showSaveModal: !this.state.showSaveModal
    });
  }

  /**
   * @description Toggles the shuffle switch
   */
  public toggleShuffle(): void {
    this.setState({
      activateShuffle: !this.state.activateShuffle
    });
  }

  /**
   * @description Toggles the deflate switch
   */
  public toggleDeflate(): void {
    this.setState(
      {
        activateDeflate: !this.state.activateDeflate
      },
      () => {
        if (!this.state.activateDeflate) {
          this.setState({
            deflateValue: 0
          });
        }
      }
    );
  }

  /**
   * @description Toggles the deflate switch
   */
  public toggleAppend(): void {
    this.setState({
      activateAppend: !this.state.activateAppend
    });
  }

  public onFilenameChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ filename: event.target.value });
  }

  public updateDeflateValue(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ deflateValue: parseInt(event.target.value, 10) });
  }

  public updateNewVariableName(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ newVariableSaveName: event.target.value });
  }

  public dismissFilenameValidation() {
    this.setState({ validateFileName: false });
  }

  public async save() {
    console.log("this.props.variable:", this.props.variable);
    const splitFileName = this.state.filename.split(".");

    if (!this.state.filename) {
      this.setState({ validateFileName: true });
      return;
    }
    this.setState({ validateFileName: false });
    await this.props.codeInjector.saveNetCDFFile(
      this.state.filename,
      this.props.variable.name,
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
      const result: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.props.notebookPanel,
        `import os\n\
import time\n\
def check_for_exported_file():\n\
  exported_file_path = os.path.join(os.getcwd(), '${this.state.filename}')\n\
  counter = 0\n\
  while not os.path.exists(exported_file_path):\n\
    time.sleep(1)\n\
    counter +=1\n\
    if counter == 15:\n\
      raise Exception("Exporting plot timed out.")\n\
  return True\n\
${OUTPUT_RESULT_NAME}=check_for_exported_file()\n`
      );
      if (result === "True") {
        this.props.dismissSavePlotSpinnerAlert();
        this.props.showExportSuccessAlert();
      }
    } catch (error) {
      console.log("error with checking file:", error);
    }
  }

  public render(): JSX.Element {
    // Set the input color
    let nameStateColor = "success";
    if (this.state.nameState === "Invalid!") {
      nameStateColor = "danger";
    }

    return (
      <div>
        <div
          className={
            /*@tag<clearfix varmini-main>*/ "clearfix varmini-main-vcdat"
          }
        >
          <Button
            className={/*@tag<varmini-name-btn>*/ "varmini-name-btn-vcdat"}
            outline={true}
            color={"success"}
            style={{ backgroundColor: this.props.buttonColor }}
            active={this.props.isSelected(this.state.variable.varID)}
          >
            {this.state.variable.alias}
          </Button>
          <Button
            className={/*@tag<varmini-edit-btn>*/ "varmini-edit-btn-vcdat"}
            outline={true}
            style={axisStyle}
            title={
              this.state.variable.sourceName === ""
                ? "Editing of modified variables disabled for now."
                : ""
            }
            color={"danger"}
            onClick={this.handleEditClick}
          >
            edit
          </Button>
          <Button
            outline={true}
            style={axisStyle}
            onClick={this.handleSaveClick}
          >
            save
          </Button>
          {this.props.isSelected(this.state.variable.varID) && (
            <Badge
              className={"float-right"}
              style={{
                ...badgeStyle,
                ...{ backgroundColor: this.props.buttonColor }
              }}
            >
              {Utilities.numToOrdStr(this.props.selectOrder)} Variable
            </Badge>
          )}
        </div>
        <Modal
          className={"var-loader-modal"}
          isOpen={this.state.showAxis}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>
            Edit Variable: {this.state.editedVariable.alias}
          </ModalHeader>
          <ModalBody
            className={/*@tag<varmini-edit-modal>*/ "varmini-edit-modal-vcdat"}
          >
            <Card>
              <CardBody>
                <InputGroup style={{ marginTop: "5px" }}>
                  <InputGroupAddon addonType="prepend">
                    Rename Variable:
                  </InputGroupAddon>
                  <Input
                    onChange={this.handleNameInput}
                    //className="float-left"
                    value={this.state.nameValue}
                    placeholder="Enter new name here."
                  />
                  <InputGroupAddon color={nameStateColor} addonType="append">
                    {this.state.nameState}
                  </InputGroupAddon>
                </InputGroup>
              </CardBody>
            </Card>
            {this.state.showAxis &&
              this.state.editedVariable.axisInfo.length > 0 &&
              this.state.editedVariable.axisInfo.map((item: AxisInfo) => {
                if (!item.data || item.data.length <= 1) {
                  return;
                }
                item.updateDimInfo = this.props.updateDimInfo;
                return (
                  <div key={item.name} style={axisStyle}>
                    <Card>
                      <CardBody>
                        <DimensionSlider
                          {...item}
                          varID={this.state.editedVariable.varID}
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
                /*@tag<varmini-update-btn>*/ "varmini-update-btn-vcdat"
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
            <CustomInput
              type="switch"
              id="appendSwitch"
              name="appendSwitch"
              label="Append to existing file"
              checked={this.state.activateAppend}
              onChange={this.toggleAppend}
            />
            <br />
            <Label>Variable Name in File:</Label>
            <Input
              type="text"
              name="text"
              placeholder={this.props.variable.name}
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

  private async handleCopyClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    clickEvent.stopPropagation();
    await this.props.copyVariable(this.state.variable, "Test");
  }

  private async handleDeleteClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    clickEvent.stopPropagation();
    await this.props.deleteVariable(this.state.variable);
  }

  private handleEditClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): void {
    clickEvent.stopPropagation();
    if (this.state.variable.axisInfo.length > 0) {
      this.setState({ showAxis: true });
      this.props.modalOpen(true);
    } else {
      this.setState({ showAxis: false });
      this.props.modalOpen(false);
    }
  }

  private async handleUpdateClick(): Promise<void> {
    await this.setState({ variable: this.state.editedVariable });
    this.toggleModal();
    this.props.reload();
  }

  private handleSaveClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): void {
    this.toggleSaveModal();
    clickEvent.stopPropagation();
  }

  private validateNameInput(nameEntry: string): void {
    if (nameEntry === this.state.variable.alias) {
      this.setState({ nameState: "Valid" });
      return;
    }

    const invalid: boolean = forbidden.test(nameEntry);
    let state: NAME_STATUS = "Valid";
    if (nameEntry === "" || invalid) {
      state = "Invalid!";
      this.setState({ nameState: state });
    } else {
      const updatedVariable: Variable = this.state.editedVariable;
      updatedVariable.alias = this.state.nameValue;
      this.setState({ nameState: state, editedVariable: updatedVariable });
    }
  }

  /*private async handleRenameClick(): Promise<void> {
    const state: string = this.state.nameState;

    // Reset if name isn't being changed
    if (this.state.nameValue === this.state.variable.alias) {
      this.setState({ nameValue: "", nameState: "Valid" });
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

    // All checks and warnings done, create variable copy and del old variable;
    const updatedVariable: Variable = this.state.editedVariable;
    updatedVariable.alias = this.state.nameValue;
    this.setState({
      nameState: "Valid",
      nameValue: this.state.nameValue,
      editedVariable: updatedVariable
    });
  }*/

  private handleNameInput(event: React.ChangeEvent<HTMLInputElement>): void {
    const nameEntry: string = event.target.value;
    this.validateNameInput(nameEntry);
    this.setState({ nameValue: nameEntry });
  }
}
