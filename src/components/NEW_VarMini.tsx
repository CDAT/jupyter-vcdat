// Dependencies
import React, { useState } from "react";
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
import Utilities from "../modules/Utilities/Utilities";
import AxisInfo from "../modules/types/AxisInfo";
import DimensionSlider from "./DimensionSlider";
import Variable from "../modules/types/Variable";
import NotebookUtilities from "../modules/Utilities/NotebookUtilities";
import { checkForExportedFileCommand } from "../modules/PythonCommands";
import AppControl from "../modules/AppControl";
import {
  AppActions,
  useApp,
  useVariable,
  VariableActions,
} from "../modules/contexts/MainContext";

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
  // codeInjector: CodeInjector;
  variable: Variable; // the variable this component will show
  // varSelectionChanged: ISignal<VariableTracker, string[]>;
  varAliasExists: (varAlias: string) => boolean; // Method that returns true if specified variable name is already taken
  isSelected: (alias: string) => boolean; // method to check if this variable is selected in parent
  selected: boolean; // should the axis be hidden by default
  modalOpen: (isOpen: boolean) => void;
  selectOrder: number;
  allowReload: boolean; // is this variable allowed to be reloaded
  reload: (item: Variable, newAlias?: string) => void; // a function to reload the variable
  setPlotInfo: (plotName: string, plotFormat: string) => void;
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

const VarMini = (props: IVarMiniProps): JSX.Element => {
  const app: AppControl = AppControl.getInstance();
  const [varState, varDispatch] = useVariable();
  const [appState, appDispatch] = useApp();

  const [state, setState] = useState<IVarMiniState>({
    activateAppend: false,
    activateDeflate: false,
    activateShuffle: false,
    deflateValue: 0,
    filename: "",
    nameState: "Valid",
    nameValue: props.variable.alias,
    newVariableSaveName: "",
    selected: props.selected,
    showAxis: false,
    showSaveModal: false,
    validateFileName: false,
    variable: props.variable,
  });

  const reset = (): void => {
    setState({
      activateAppend: false,
      activateDeflate: false,
      activateShuffle: false,
      deflateValue: 0,
      filename: "",
      nameState: "Valid",
      nameValue: props.variable.alias,
      newVariableSaveName: "",
      selected: props.selected,
      showAxis: false,
      showSaveModal: false,
      validateFileName: false,
      variable: props.variable,
    });
  };

  const updateSelections = (): void => {
    setState({ ...state, selected: props.isSelected(state.variable.varID) });
  };

  /**
   * @description open the menu if its closed
   */
  const openMenu = (): void => {
    if (!state.showAxis) {
      setState({ ...state, showAxis: true });
    }
  };

  /**
   * @description Toggles the variable loader modal
   */
  const toggleModal = (): void => {
    props.modalOpen(!state.showAxis);
    setState({ ...state, showAxis: !state.showAxis });
  };

  /**
   * @description Toggles the save variable modal
   */
  const toggleSaveModal = (): void => {
    if (state.showSaveModal) {
      props.modalOpen(false);
    } else {
      props.modalOpen(true);
    }
    setState({
      ...state,
      activateDeflate: false,
      activateShuffle: false,
      deflateValue: 0,
      filename: "",
      showSaveModal: !state.showSaveModal,
    });
  };

  /**
   * @description Toggles the shuffle switch
   */
  const toggleShuffle = (): void => {
    setState({ ...state, activateShuffle: !state.activateShuffle });
  };

  /**
   * @description Toggles the deflate switch
   */
  const toggleDeflate = (): void => {
    setState({ ...state, activateDeflate: !state.activateDeflate });
    if (!state.activateDeflate) {
      setState({ ...state, deflateValue: 0 });
    }
  };

  const onFilenameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setState({ ...state, filename: event.target.value });
  };

  const updateDeflateValue = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setState({ ...state, deflateValue: parseInt(event.target.value, 10) });
  };

  const updateNewVariableName = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setState({ ...state, newVariableSaveName: event.target.value });
  };

  const dismissFilenameValidation = (): void => {
    setState({ ...state, validateFileName: false });
  };

  const save = async (): Promise<void> => {
    const splitFileName = state.filename.split(".");

    if (!state.filename) {
      setState({ ...state, validateFileName: true });
      return;
    }
    setState({ ...state, validateFileName: false });
    await app.codeInjector.saveNetCDFFile(
      state.filename,
      state.variable.alias,
      state.newVariableSaveName,
      state.activateAppend,
      state.activateShuffle,
      state.activateDeflate,
      state.deflateValue
    );
    toggleSaveModal();
    props.setPlotInfo(splitFileName[0], splitFileName[1]);

    appDispatch(AppActions.setSavePlotAlert(true));

    try {
      const result: string = await app.labControl.runBackendCode(
        checkForExportedFileCommand(state.filename)
      );
      if (result === "True") {
        appDispatch(AppActions.setSavePlotAlert(false));
        appDispatch(AppActions.setExportSuccessAlert(true));
        window.setTimeout(() => {
          appDispatch(AppActions.setExportSuccessAlert(false));
        }, 5000);
      }
    } catch (error) {
      console.error("error with checking file:", error);
    }
  };

  const updateDimensionInfo = (newInfo: any): void => {
    const updatedVar: Variable = state.variable;
    updatedVar.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
      if (axis.name !== newInfo.name) {
        return;
      }
      updatedVar.axisInfo[axisIndex].first = newInfo.first;
      updatedVar.axisInfo[axisIndex].last = newInfo.last;
    });
    setState({ ...state, variable: updatedVar });
  };

  const handleCopyClick = async (
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    clickEvent.stopPropagation();
    const copy: Variable = app.varTracker.copyVariable(
      state.variable,
      state.nameValue,
      true
    );
    await app.codeInjector.loadVariable(copy);
  };

  const handleDeleteClick = async (
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    clickEvent.stopPropagation();
    const result: boolean = await NotebookUtilities.showYesNoDialog(
      "Warning!",
      "Are you sure you want to delete this variable?",
      "OK",
      "Cancel"
    );
    if (result) {
      await app.codeInjector.deleteVariable(state.variable);
    }
  };

  const handleEditClick = async (
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    clickEvent.stopPropagation();
    if (state.variable.axisInfo.length > 0) {
      setState({ ...state, showAxis: true });
      props.modalOpen(true);
    } else {
      setState({ ...state, showAxis: false });
      props.modalOpen(false);
    }
  };

  const handleSaveClick = (
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): void => {
    toggleSaveModal();
    clickEvent.stopPropagation();
  };

  const validateNameInput = (nameEntry: string): void => {
    if (nameEntry === state.variable.alias) {
      setState({ ...state, nameState: "Valid" });
      return;
    }

    const invalid: boolean = forbidden.test(nameEntry);
    let nameStatus: NAME_STATUS = "Valid";
    if (nameEntry === "" || invalid) {
      nameStatus = "Invalid!";
    } else if (props.varAliasExists(nameEntry)) {
      nameStatus = "Variable Already Exists!";
    }

    setState({ ...state, nameState: nameStatus });
  };

  const handleNameInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const nameEntry: string = event.target.value;
    setState({ ...state, nameValue: nameEntry });
    validateNameInput(nameEntry);
  };

  const handleUpdateClick = async (): Promise<void> => {
    if (state.nameState === "Variable Already Exists!") {
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

    toggleModal();
    // Load new variable
    props.reload(state.variable, state.nameValue);

    // Delete old variable if rename was done
    if (state.variable.alias !== state.nameValue) {
      // Create a copy with the new name
      const copy: Variable = app.varTracker.copyVariable(
        state.variable,
        state.nameValue,
        true
      );

      // Delete variable of the old name
      await app.codeInjector.deleteVariable(state.variable);
      setState({ ...state, variable: copy });
    }
    // Select the new variable (if previous one deleted)
    varDispatch(VariableActions.selectVariable(state.variable.varID));
    reset();
  };

  // Set the input color
  let nameStateColor = "success";
  if (state.nameState === "Invalid!") {
    nameStateColor = "danger";
  } else if (state.nameState === "Variable Already Exists!") {
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
          active={props.isSelected(state.variable.varID)}
        >
          {state.variable.alias}
        </Button>
        <ButtonGroup className="float-right" size="sm" style={axisStyle}>
          {props.isSelected(state.variable.varID) && (
            <Button
              disabled={true}
              style={{
                ...badgeStyle,
                ...{ backgroundColor: props.buttonColor },
              }}
            >
              {Utilities.numToOrdStr(props.selectOrder)}
            </Button>
          )}
          <Button
            className={/* @tag<varmini-edit-btn>*/ "varmini-edit-btn-vcdat"}
            outline={true}
            // style={axisStyle}
            title={
              state.variable.sourceName === ""
                ? "Note: This variable was not loaded from a file."
                : ""
            }
            color={"info"}
            onClick={handleEditClick}
          >
            edit
          </Button>
          <Button
            outline={true}
            color={"secondary"}
            // style={axisStyle}
            onClick={handleSaveClick}
          >
            save
          </Button>
          <Button
            outline={true}
            color={"danger"}
            // style={axisStyle}
            onClick={handleDeleteClick}
          >
            delete
          </Button>
        </ButtonGroup>
      </div>
      <Modal
        className={"var-loader-modal"}
        isOpen={state.showAxis}
        toggle={toggleModal}
        size="lg"
      >
        <ModalHeader toggle={toggleModal}>
          Edit Variable: {state.variable.alias}
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
                  onChange={handleNameInput}
                  value={state.nameValue}
                  placeholder="Enter new name here."
                />
                <InputGroupAddon addonType="append">
                  <Button color={nameStateColor} disabled={true}>
                    {state.nameState}
                  </Button>
                </InputGroupAddon>
              </ButtonGroup>
            </CardBody>
          </Card>
          {state.showAxis &&
            state.variable.axisInfo.length > 0 &&
            state.variable.axisInfo.map((item: AxisInfo) => {
              if (!item.data || item.data.length <= 1) {
                return;
              }
              item.updateDimInfo = updateDimensionInfo;
              return (
                <div key={item.name} style={axisStyle}>
                  <Card>
                    <CardBody>
                      <DimensionSlider {...item} varID={state.variable.varID} />
                    </CardBody>
                  </Card>
                </div>
              );
            })}
        </ModalBody>
        <ModalFooter>
          <Button
            className={/* @tag<varmini-update-btn>*/ "varmini-update-btn-vcdat"}
            color="primary"
            onClick={handleUpdateClick}
          >
            Update
          </Button>
        </ModalFooter>
      </Modal>
      <Modal
        id="var-save-modal"
        isOpen={state.showSaveModal}
        toggle={toggleSaveModal}
        size="lg"
      >
        <ModalHeader toggle={toggleSaveModal}>Save Variable</ModalHeader>
        <ModalBody style={modalOverflow}>
          <Label>Filename:</Label>
          <Input
            type="text"
            name="text"
            placeholder="Name.nc"
            value={state.filename}
            onChange={onFilenameChange}
          />
          <Alert
            color="danger"
            isOpen={state.validateFileName}
            toggle={dismissFilenameValidation}
          >
            The file name can not be blank
          </Alert>
          <Label>Variable Name in File:</Label>
          <Input
            type="text"
            name="text"
            placeholder={state.variable.alias}
            value={state.newVariableSaveName}
            onChange={updateNewVariableName}
          />
          <br />
          <CustomInput
            type="switch"
            id="shuffleSwitch"
            name="shuffleSwitch"
            label="Shuffle"
            checked={state.activateShuffle}
            onChange={toggleShuffle}
          />
          <br />
          <CustomInput
            type="switch"
            id="deflateSwitch"
            name="deflateSwitch"
            label="Deflate"
            checked={state.activateDeflate}
            onChange={toggleDeflate}
          />
          <br />
          <Collapse isOpen={state.activateDeflate}>
            <Label>Deflate Level:</Label>
            <Input
              type="select"
              name="select"
              id="deflateSelect"
              value={state.deflateValue}
              onChange={updateDeflateValue}
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
          <Button color="primary" onClick={save}>
            Save
          </Button>{" "}
          <Button color="secondary" onClick={toggleSaveModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export { VarMini, IVarMiniProps };
