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
import { CodeInjector } from "../CodeInjector";

export interface ExportPlotModalProps {
  isOpen: boolean;
  inject: Function; // a method to inject code into the controllers notebook
  getCanvasDimensions: Function; // a method that gets the current plot dimensions
  toggle: Function;
  exportAlerts: Function;
  setPlotInfo: Function;
  cmdManager: CodeInjector;
}

interface ExportPlotModalState {
  modal: boolean;
  plotName: string;
  plotFileFormat: string;
  validateExportName: boolean;
  validateFileFormat: boolean;
  displayDimensions: boolean;
  disableProvenance: boolean;
  captureProvenance: boolean;
  width: string;
  height: string;
  plotUnits: string;
}

export class ExportPlotModal extends React.Component<
  ExportPlotModalProps,
  ExportPlotModalState
> {
  constructor(props: ExportPlotModalProps) {
    super(props);
    this.state = {
      modal: false,
      plotName: "",
      plotFileFormat: "",
      validateExportName: false,
      validateFileFormat: false,
      disableProvenance: true,
      captureProvenance: false,
      displayDimensions: false,
      width: "",
      height: "",
      plotUnits: "pixels"
    };
    this.save = this.save.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.dismissExportValidation = this.dismissExportValidation.bind(this);
    this.dismissFileFormatValidation = this.dismissFileFormatValidation.bind(
      this
    );
    this.toggleDimensionsDisplay = this.toggleDimensionsDisplay.bind(this);
    this.toggleCaptureProvenance = this.toggleCaptureProvenance.bind(this);
  }

  public async toggleDimensionsDisplay() {
    if (!this.state.displayDimensions) {
      const dimensions = await this.props.getCanvasDimensions();
      this.setState({ width: dimensions.width });
      this.setState({ height: dimensions.height });
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
    this.setState({ validateExportName: false });
    this.setState({ validateFileFormat: false });
    this.props.toggle();
    this.setState({ plotName: "" });
  }

  public onRadioBtnClick(rSelected: string) {
    this.setState({ plotFileFormat: rSelected });
    if (rSelected === "png") {
      this.setState({ disableProvenance: false });
    } else {
      this.setState({ disableProvenance: true });
    }
  }

  public onUnitRadioBtnClick(rSelected: string) {
    this.setState({ plotUnits: rSelected });
  }

  public async save() {
    const plotName = this.state.plotName;
    if (plotName == null || plotName == "") {
      this.setState({ validateExportName: true });
      return;
    }
    this.setState({ validateExportName: false });

    const fileFormat = this.state.plotFileFormat;
    if (fileFormat == null || fileFormat == "") {
      this.setState({ validateFileFormat: true });
      return;
    }
    this.setState({ validateFileFormat: false });

    this.props.cmdManager.exportPlot(
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
            onChange={e => {
              this.setState({ plotName: e.target.value });
            }}
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
            <ButtonGroup>
              <Button
                color="primary"
                onClick={() => {
                  this.onRadioBtnClick("png");
                }}
                active={this.state.plotFileFormat === "png"}
              >
                PNG
              </Button>
              <Button
                color="primary"
                onClick={() => {
                  this.onRadioBtnClick("svg");
                }}
                active={this.state.plotFileFormat === "svg"}
              >
                SVG
              </Button>
              <Button
                color="primary"
                onClick={() => {
                  this.onRadioBtnClick("pdf");
                }}
                active={this.state.plotFileFormat === "pdf"}
              >
                PDF
              </Button>
              <Button
                color="primary"
                onClick={() => {
                  this.onRadioBtnClick("ps");
                }}
                active={this.state.plotFileFormat === "ps"}
              >
                PS
              </Button>
            </ButtonGroup>
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
                <ButtonGroup>
                  <Button
                    color="primary"
                    onClick={() => {
                      this.onUnitRadioBtnClick("pixels");
                    }}
                    active={this.state.plotUnits === "pixels"}
                  >
                    px
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      this.onUnitRadioBtnClick("in");
                    }}
                    active={this.state.plotUnits === "in"}
                  >
                    in
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      this.onUnitRadioBtnClick("cm");
                    }}
                    active={this.state.plotUnits === "cm"}
                  >
                    cm
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      this.onUnitRadioBtnClick("mm");
                    }}
                    active={this.state.plotUnits === "mm"}
                  >
                    mm
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      this.onUnitRadioBtnClick("dot");
                    }}
                    active={this.state.plotUnits === "dot"}
                  >
                    dot
                  </Button>
                </ButtonGroup>
                <br />
                <Label for="width">Width</Label>
                <Input
                  type="text"
                  name="width"
                  placeholder="Width"
                  value={this.state.width}
                  onChange={e => {
                    this.setState({ width: e.target.value });
                  }}
                />
                <Label for="height">Height</Label>
                <Input
                  type="text"
                  name="height"
                  placeholder="Height"
                  value={this.state.height}
                  onChange={e => {
                    this.setState({ height: e.target.value });
                  }}
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
}

export default ExportPlotModal;
