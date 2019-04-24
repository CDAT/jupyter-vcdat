// Dependencies
import * as React from "react";
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
  ModalHeader
} from "reactstrap";

// Project Components
import { CodeInjector } from "../CodeInjector";
import { EXPORT_FORMATS, IMAGE_UNITS } from "../constants";

export interface IExportPlotModalProps {
  isOpen: boolean;
  toggle: () => void;
  exportAlerts: () => void;
  setPlotInfo: (plotName: string, plotFormat: string) => void;
  codeInjector: CodeInjector;
  // a method that gets the current plot dimensions
  getCanvasDimensions: () => Promise<{ width: string; height: string }>;
}

interface IExportPlotModalState {
  modal: boolean;
  plotName: string;
  plotFileFormat: EXPORT_FORMATS;
  validateExportName: boolean;
  validateFileFormat: boolean;
  displayDimensions: boolean;
  disableProvenance: boolean;
  captureProvenance: boolean;
  width: string;
  height: string;
  plotUnits: IMAGE_UNITS;
}

export class ExportPlotModal extends React.Component<
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
      plotFileFormat: "",
      plotName: "",
      plotUnits: "px",
      validateExportName: false,
      validateFileFormat: false,
      width: ""
    };
    this.save = this.save.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.dismissExportValidation = this.dismissExportValidation.bind(this);
    this.dismissFileFormatValidation = this.dismissFileFormatValidation.bind(
      this
    );
    this.toggleDimensionsDisplay = this.toggleDimensionsDisplay.bind(this);
    this.toggleCaptureProvenance = this.toggleCaptureProvenance.bind(this);
    this.renderFormatBtns = this.renderFormatBtns.bind(this);
    this.renderUnitBtns = this.renderUnitBtns.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onHeightChange = this.onHeightChange.bind(this);
    this.onWidthChange = this.onWidthChange.bind(this);
  }

  public async toggleDimensionsDisplay() {
    if (!this.state.displayDimensions) {
      const dimensions = await this.props.getCanvasDimensions();
      this.setState({ height: dimensions.height, width: dimensions.width });
    }
    this.setState(prevState => ({
      displayDimensions: !prevState.displayDimensions
    }));
  }

  public toggleCaptureProvenance() {
    this.setState(prevState => ({
      captureProvenance: !prevState.captureProvenance
    }));
  }

  public dismissFileFormatValidation() {
    this.setState({ validateFileFormat: false });
  }

  public dismissExportValidation() {
    this.setState({ validateExportName: false });
  }

  public toggleModal() {
    this.setState({
      plotName: "",
      validateExportName: false,
      validateFileFormat: false
    });
    this.props.toggle();
  }

  public async save() {
    const plotName = this.state.plotName;
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

    this.props.codeInjector.exportPlot(
      fileFormat,
      plotName,
      this.state.width,
      this.state.height,
      this.state.plotUnits,
      this.state.captureProvenance
    );

    this.props.setPlotInfo(this.state.plotName, this.state.plotFileFormat);
    this.props.exportAlerts();
    this.toggleModal();
    this.setState({ displayDimensions: false });
  }

  // ======= REACT COMPONENT FUNCTIONS =======
  public onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ plotName: event.target.value });
  }

  public onWidthChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ width: event.target.value });
  }

  public onHeightChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ height: event.target.value });
  }

  public onFmtRadioBtnClick(rSelected: EXPORT_FORMATS) {
    this.setState({ plotFileFormat: rSelected });
    if (rSelected === "png") {
      this.setState({ disableProvenance: false });
    } else {
      this.setState({ disableProvenance: true });
    }
  }

  public onUnitRadioBtnClick(rSelected: IMAGE_UNITS) {
    this.setState({ plotUnits: rSelected });
  }

  public render(): JSX.Element {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggleModal}>
        <ModalHeader toggle={this.toggleModal}>Save Plot</ModalHeader>
        <ModalBody>
          <Label>Name:</Label>
          <Input
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
              id="dimensionsSwitch"
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
                  type="number"
                  name="width"
                  placeholder="Width"
                  value={this.state.width}
                  onChange={this.onWidthChange}
                />
                <Label for="height">Height</Label>
                <Input
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
            type="switch"
            id="exampleCustomSwitch"
            name="customSwitch"
            label="Capture Provenance"
            disabled={this.state.disableProvenance}
            checked={this.state.captureProvenance}
            onChange={this.toggleCaptureProvenance}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.save}>
            Export
          </Button>{" "}
          <Button color="secondary" onClick={this.toggleModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  private renderFormatBtns(): JSX.Element {
    // List of choices that will have buttons
    const formats: EXPORT_FORMATS[] = ["png", "pdf", "svg", "ps"];
    return (
      <ButtonGroup>
        {formats.map((format: EXPORT_FORMATS) => {
          const clickHandler = () => {
            this.onFmtRadioBtnClick(format);
          };
          return (
            <Button
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

  private renderUnitBtns(): JSX.Element {
    // List of choices that will have buttons
    const units: IMAGE_UNITS[] = ["cm", "dot", "in", "mm", "px"];

    return (
      <ButtonGroup>
        {units.map((unit: IMAGE_UNITS) => {
          const clickHandler = () => {
            this.onUnitRadioBtnClick(unit);
          };
          return (
            <Button
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

export default ExportPlotModal;
