// Dependencies
import * as React from "react";
import { NotebookPanel } from "@jupyterlab/notebook";
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
import CodeInjector from "../../modules/CodeInjector";
import Utilities from "../../modules/utils/Utilities";
import { ExportFormat, ImageUnit } from "../../modules/types/types";
import { boundMethod } from "autobind-decorator";

interface IExportPlotModalProps {
  isOpen: boolean;
  toggle: () => void;
  exportAlerts: () => void;
  dismissSavePlotSpinnerAlert: () => void;
  notebookPanel: NotebookPanel;
  setPlotInfo: (plotName: string, plotFormat: string) => void;
  showExportSuccessAlert: () => void;
  codeInjector: CodeInjector;
  // a method that gets the current plot dimensions
  getCanvasDimensions: () => Promise<{ width: string; height: string }>;
}

interface IExportPlotModalState {
  modal: boolean;
  plotName: string;
  plotFileFormat: ExportFormat;
  validateExportName: boolean;
  validateFileFormat: boolean;
  displayDimensions: boolean;
  disableProvenance: boolean;
  captureProvenance: boolean;
  notebookPanel: NotebookPanel;
  width: string;
  height: string;
  plotUnits: ImageUnit;
}

export default class ExportPlotModal extends React.Component<
  IExportPlotModalProps,
  IExportPlotModalState
> {
  constructor(props: IExportPlotModalProps) {
    super(props);
    this.state = {
      captureProvenance: false,
      disableProvenance: true,
      displayDimensions: false,
      height: "",
      modal: false,
      notebookPanel: this.props.notebookPanel,
      plotFileFormat: "",
      plotName: "",
      plotUnits: "px",
      validateExportName: false,
      validateFileFormat: false,
      width: "",
    };
  }

  @boundMethod
  public async toggleDimensionsDisplay(): Promise<void> {
    if (!this.state.displayDimensions) {
      const dimensions = await this.props.getCanvasDimensions();
      this.setState({ height: dimensions.height, width: dimensions.width });
    }
    this.setState((prevState) => ({
      displayDimensions: !prevState.displayDimensions,
    }));
  }

  @boundMethod
  public toggleCaptureProvenance(): void {
    this.setState((prevState) => ({
      captureProvenance: !prevState.captureProvenance,
    }));
  }

  @boundMethod
  public dismissFileFormatValidation(): void {
    this.setState({ validateFileFormat: false });
  }

  @boundMethod
  public dismissExportValidation(): void {
    this.setState({ validateExportName: false });
  }

  @boundMethod
  public clearExportInfo(): void {
    this.setState({
      captureProvenance: false,
      displayDimensions: false,
      plotName: "",
      validateExportName: false,
      validateFileFormat: false,
    });
  }

  @boundMethod
  public toggleModal(): void {
    this.setState({
      plotName: "",
      validateExportName: false,
      validateFileFormat: false,
    });
    this.props.toggle();
  }

  @boundMethod
  public async save(): Promise<void> {
    let plotName = this.state.plotName;

    if (!plotName) {
      this.setState({ validateExportName: true });
      return;
    }
    this.setState({ validateExportName: false });

    const fileFormat = this.state.plotFileFormat;
    if (!fileFormat) {
      this.setState({ validateFileFormat: true });
      return;
    }
    this.setState({ validateFileFormat: false });

    this.props.toggle();

    // Remove extension if user typed it in and it matches current format
    if (Utilities.getExtension(plotName) === fileFormat) {
      plotName = Utilities.removeExtension(plotName);
      await this.setState({
        plotName,
      });
    }

    this.props.setPlotInfo(plotName, fileFormat);
    this.props.exportAlerts();
    await this.props.codeInjector.exportPlot(
      fileFormat,
      plotName,
      this.state.width,
      this.state.height,
      this.state.plotUnits,
      this.state.captureProvenance
    );
    const plotFileName = `${plotName}.${fileFormat}`;
    try {
      const result: string = await Utilities.sendSimpleKernelRequest(
        this.props.notebookPanel,
        checkForExportedFileCommand(plotFileName)
      );
      if (result === "True") {
        this.props.showExportSuccessAlert();
      }

      this.props.dismissSavePlotSpinnerAlert();
    } catch (error) {
      console.error("error with checking file:", error);
    }
    this.clearExportInfo();
  }

  // ======= REACT COMPONENT FUNCTIONS =======
  @boundMethod
  public onInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ plotName: event.target.value });
  }

  @boundMethod
  public onWidthChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ width: event.target.value });
  }

  @boundMethod
  public onHeightChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ height: event.target.value });
  }

  @boundMethod
  public onFmtRadioBtnClick(rSelected: ExportFormat): void {
    this.setState({ plotFileFormat: rSelected });
    if (rSelected === "png") {
      this.setState({ disableProvenance: false });
    } else {
      this.setState({ disableProvenance: true });
    }
  }

  @boundMethod
  public onUnitRadioBtnClick(rSelected: ImageUnit): void {
    this.setState({ plotUnits: rSelected });
  }

  public render(): JSX.Element {
    if (!this.props.isOpen) {
      return null;
    }
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggleModal}>
        <ModalHeader toggle={this.toggleModal}>Export Plot</ModalHeader>
        <ModalBody className={/* @tag<export-modal>*/ "export-modal-vcdat"}>
          <Label>Name:</Label>
          <Input
            className={/* @tag<export-name-input>*/ "export-name-input-vcdat"}
            type="text"
            name="text"
            placeholder="Name"
            value={this.state.plotName}
            onChange={this.onInputChange}
          />
          <br />
          <Alert
            color="danger"
            isOpen={this.state.validateExportName}
            toggle={this.dismissExportValidation}
          >
            The export name can not be blank
          </Alert>
          <div>
            {this.renderFormatBtns()}
            <Alert
              color="danger"
              isOpen={this.state.validateFileFormat}
              toggle={this.dismissFileFormatValidation}
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
              checked={this.state.displayDimensions}
              onChange={this.toggleDimensionsDisplay}
            />
            <br />
            <div>
              <Collapse isOpen={this.state.displayDimensions}>
                {this.renderUnitBtns()}
                <br />
                <Label for="width">Width</Label>
                <Input
                  className={
                    /* @tag<export-width-input>*/ "export-width-input-vcdat"
                  }
                  type="number"
                  name="width"
                  placeholder="Width"
                  value={this.state.width}
                  onChange={this.onWidthChange}
                />
                <Label for="height">Height</Label>
                <Input
                  className={
                    /* @tag<export-height-input>*/ "export-height-input-vcdat"
                  }
                  type="number"
                  name="height"
                  placeholder="Height"
                  value={this.state.height}
                  onChange={this.onHeightChange}
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
            disabled={this.state.disableProvenance}
            checked={this.state.captureProvenance}
            onChange={this.toggleCaptureProvenance}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            className={/* @tag<export-button>*/ "export-button-vcdat"}
            color="primary"
            onClick={this.save}
          >
            Export
          </Button>{" "}
          <Button
            className={
              /* @tag<export-cancel-button>*/ "export-cancel-button-vcdat"
            }
            color="secondary"
            onClick={this.toggleModal}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  @boundMethod
  private renderFormatBtns(): JSX.Element {
    // List of choices that will have buttons
    const formats: ExportFormat[] = ["png", "pdf", "svg", "ps"];
    return (
      <ButtonGroup>
        {formats.map((format: ExportFormat) => {
          const clickHandler = (): void => {
            this.onFmtRadioBtnClick(format);
          };
          return (
            <Button
              className={/* @tag<export-format-btn>*/ "export-format-btn-vcdat"}
              key={format}
              color="primary"
              onClick={clickHandler}
              active={this.state.plotFileFormat === format}
            >
              {format.toUpperCase()}
            </Button>
          );
        })}
      </ButtonGroup>
    );
  }

  @boundMethod
  private renderUnitBtns(): JSX.Element {
    // List of choices that will have buttons
    const units: ImageUnit[] = ["cm", "dot", "in", "mm", "px"];

    return (
      <ButtonGroup>
        {units.map((unit: ImageUnit) => {
          const clickHandler = (): void => {
            this.onUnitRadioBtnClick(unit);
          };
          return (
            <Button
              className={/* @tag<export-unit-btn>*/ "export-unit-btn-vcdat"}
              key={unit}
              color="primary"
              onClick={clickHandler}
              active={this.state.plotUnits === unit}
            >
              {unit}
            </Button>
          );
        })}
      </ButtonGroup>
    );
  }
}
