// Dependencies
import React, { useState } from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  Collapse,
  CustomInput,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";

// Project Components
import { checkForExportedFileCommand } from "../../modules/PythonCommands";
import Utilities from "../../modules/Utilities/Utilities";
import { ExportFormat, ImageUnit } from "../../modules/types/types";
import AppControl from "../../modules/AppControl";
import {
  useModal,
  ModalActions,
  useApp,
  usePlot,
  AppActions,
  PlotActions,
} from "../../modules/contexts/MainContext";

interface IExportPlotModalProps {
  app: AppControl;
  modalID: string;
  // a method that gets the current plot dimensions
  getCanvasDimensions: () => Promise<{ width: string; height: string }>;
}

interface IExportPlotModalState {
  plotName: string;
  plotFileFormat: ExportFormat;
  validateExportName: boolean;
  validateFileFormat: boolean;
  displayDimensions: boolean;
  disableProvenance: boolean;
  captureProvenance: boolean;
  width: string;
  height: string;
  plotUnits: ImageUnit;
}

const ExportPlotModal = (props: IExportPlotModalProps): JSX.Element => {
  const [modalState, modalDispatch] = useModal();
  const [appState, appDispatch] = useApp();
  const [plotState, plotDispatch] = usePlot();

  const [state, setState] = useState<IExportPlotModalState>({
    captureProvenance: false,
    disableProvenance: true,
    displayDimensions: false,
    height: "",
    plotFileFormat: "",
    plotName: "",
    plotUnits: "px",
    validateExportName: false,
    validateFileFormat: false,
    width: "",
  });

  const toggleDimensionsDisplay = async (): Promise<void> => {
    if (!state.displayDimensions) {
      const dimensions = await props.getCanvasDimensions();
      setState({
        ...state,
        height: dimensions.height,
        width: dimensions.width,
      });
    }
    setState((prevState) => ({
      ...state,
      displayDimensions: !prevState.displayDimensions,
    }));
  };

  const toggleCaptureProvenance = (): void => {
    setState((prevState) => ({
      ...state,
      captureProvenance: !prevState.captureProvenance,
    }));
  };

  const dismissFileFormatValidation = (): void => {
    setState({ ...state, validateFileFormat: false });
  };

  const dismissExportValidation = (): void => {
    setState({ ...state, validateExportName: false });
  };

  const clearExportInfo = (): void => {
    setState({
      ...state,
      captureProvenance: false,
      displayDimensions: false,
      plotName: "",
      validateExportName: false,
      validateFileFormat: false,
    });
  };

  const toggle = (): void => {
    setState({
      ...state,
      plotName: "",
      validateExportName: false,
      validateFileFormat: false,
    });
    modalDispatch(ModalActions.toggle(props.modalID));
  };

  const save = async (): Promise<void> => {
    if (!state.plotName) {
      setState({ ...state, validateExportName: true });
      return;
    }
    setState({ ...state, validateExportName: false });

    if (!state.plotFileFormat) {
      setState({ ...state, validateFileFormat: true });
      return;
    }
    setState({ ...state, validateFileFormat: false });

    modalDispatch(ModalActions.toggle(props.modalID));

    // Remove extension if user typed it in and it matches current format
    if (Utilities.getExtension(state.plotName) === state.plotFileFormat) {
      const plotName = Utilities.removeExtension(state.plotName);
      setState({ ...state, plotName });
    }

    plotDispatch(PlotActions.setPlotName(state.plotName));
    plotDispatch(PlotActions.setPlotFormat(state.plotFileFormat));

    appDispatch(AppActions.setSavePlotAlert(true));
    await props.app.codeInjector.exportPlot(
      state.plotFileFormat,
      state.plotName,
      state.width,
      state.height,
      state.plotUnits,
      state.captureProvenance
    );
    const plotFileName = `${state.plotName}.${state.plotFileFormat}`;
    try {
      const result: string = await props.app.labControl.runBackendCode(
        checkForExportedFileCommand(plotFileName)
      );

      if (result === "True") {
        appDispatch(AppActions.setExportSuccessAlert(true));
        window.setTimeout(() => {
          appDispatch(AppActions.setExportSuccessAlert(false));
        }, 5000);
      }
      appDispatch(AppActions.setSavePlotAlert(false));
    } catch (error) {
      console.error("error with checking file:", error);
    }
    clearExportInfo();
  };

  // ======= REACT COMPONENT FUNCTIONS =======
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setState({ ...state, plotName: event.target.value });
  };

  const onWidthChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setState({ ...state, width: event.target.value });
  };

  const onHeightChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setState({ ...state, height: event.target.value });
  };

  const onFmtRadioBtnClick = (rSelected: ExportFormat): void => {
    if (rSelected === "png") {
      setState({
        ...state,
        disableProvenance: false,
        plotFileFormat: rSelected,
      });
    } else {
      setState({
        ...state,
        disableProvenance: true,
        plotFileFormat: rSelected,
      });
    }
  };

  const onUnitRadioBtnClick = (rSelected: ImageUnit): void => {
    setState({ ...state, plotUnits: rSelected });
  };

  const renderFormatBtns = (): JSX.Element => {
    // List of choices that will have buttons
    const formats: ExportFormat[] = ["png", "pdf", "svg", "ps"];
    return (
      <ButtonGroup>
        {formats.map((format: ExportFormat) => {
          const clickHandler = (): void => {
            onFmtRadioBtnClick(format);
          };
          return (
            <Button
              className={/* @tag<export-format-btn>*/ "export-format-btn-vcdat"}
              key={format}
              color="primary"
              onClick={clickHandler}
              active={state.plotFileFormat === format}
            >
              {format.toUpperCase()}
            </Button>
          );
        })}
      </ButtonGroup>
    );
  };

  const renderUnitBtns = (): JSX.Element => {
    // List of choices that will have buttons
    const units: ImageUnit[] = ["cm", "dot", "in", "mm", "px"];

    return (
      <ButtonGroup>
        {units.map((unit: ImageUnit) => {
          const clickHandler = (): void => {
            onUnitRadioBtnClick(unit);
          };
          return (
            <Button
              className={/* @tag<export-unit-btn>*/ "export-unit-btn-vcdat"}
              key={unit}
              color="primary"
              onClick={clickHandler}
              active={state.plotUnits === unit}
            >
              {unit}
            </Button>
          );
        })}
      </ButtonGroup>
    );
  };

  return (
    <Modal isOpen={modalState.modalOpen === props.modalID} toggle={toggle}>
      <ModalHeader toggle={toggle}>Export Plot</ModalHeader>
      <ModalBody className={/* @tag<export-modal>*/ "export-modal-vcdat"}>
        <Label>Name:</Label>
        <Input
          className={/* @tag<export-name-input>*/ "export-name-input-vcdat"}
          type="text"
          name="text"
          placeholder="Name"
          value={state.plotName}
          onChange={onInputChange}
        />
        <br />
        <Alert
          color="danger"
          isOpen={state.validateExportName}
          toggle={dismissExportValidation}
        >
          The export name can not be blank
        </Alert>
        <div>
          {renderFormatBtns()}
          <Alert
            color="danger"
            isOpen={state.validateFileFormat}
            toggle={dismissFileFormatValidation}
          >
            You must choose a file format
          </Alert>
          <br />
          <CustomInput
            type="switch"
            id={
              /* @tag<export-dimension-switch>*/ "export-dimension-switch-vcdat"
            }
            name="dimensionsSwitch"
            label="Custom dimensions"
            checked={state.displayDimensions}
            onChange={toggleDimensionsDisplay}
          />
          <br />
          <div>
            <Collapse isOpen={state.displayDimensions}>
              {renderUnitBtns()}
              <br />
              <Label for="width">Width</Label>
              <Input
                className={
                  /* @tag<export-width-input>*/ "export-width-input-vcdat"
                }
                type="number"
                name="width"
                placeholder="Width"
                value={state.width}
                onChange={onWidthChange}
              />
              <Label for="height">Height</Label>
              <Input
                className={
                  /* @tag<export-height-input>*/ "export-height-input-vcdat"
                }
                type="number"
                name="height"
                placeholder="Height"
                value={state.height}
                onChange={onHeightChange}
              />
            </Collapse>
          </div>
        </div>
        <br />
        <CustomInput
          id={
            /* @tag<export-capture-provenance-switch>*/ "export-capture-provenance-switch-vcdat"
          }
          type="switch"
          name="customSwitch"
          label="Capture Provenance"
          disabled={state.disableProvenance}
          checked={state.captureProvenance}
          onChange={toggleCaptureProvenance}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          className={/* @tag<export-button>*/ "export-button-vcdat"}
          color="primary"
          onClick={save}
        >
          Export
        </Button>{" "}
        <Button
          className={
            /* @tag<export-cancel-button>*/ "export-cancel-button-vcdat"
          }
          color="secondary"
          onClick={toggle}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ExportPlotModal;
