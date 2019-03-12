// Dependencies
import * as React from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  Collapse,
  CustomInput,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Label
} from "reactstrap";

export type ExportPlotModalProps = {
  isOpen: boolean;
  inject: Function; // a method to inject code into the controllers notebook
  getCanvasDimensions: Function; // a method that gets the current plot dimensions
  toggle: Function;
  exportAlerts: Function;
  setPlotInfo: Function;
};

type ExportPlotModalState = {
  modal: boolean;
  plotName: string;
  plotFileFormat: string;
  validateExportName: boolean;
  validateFileFormat: boolean;
  displayDimensions: boolean;
  width: string;
  height: string;
  plotUnits: string;
};

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
  }

  async toggleDimensionsDisplay() {
    if (!this.state.displayDimensions) {
      let dimensions = await this.props.getCanvasDimensions();
      this.setState({ width: dimensions.width });
      this.setState({ height: dimensions.height });
    }
    this.setState(prevState => ({
      displayDimensions: !prevState.displayDimensions
    }));
  }

  dismissFileFormatValidation() {
    this.setState({ validateFileFormat: false });
  }

  dismissExportValidation() {
    this.setState({ validateExportName: false });
  }

  toggleModal() {
    this.setState({ validateExportName: false });
    this.setState({ validateFileFormat: false });
    this.props.toggle();
    this.setState({ plotName: "" });
  }

  onRadioBtnClick(rSelected: string) {
    this.setState({ plotFileFormat: rSelected });
  }

  onUnitRadioBtnClick(rSelected: string) {
    this.setState({ plotUnits: rSelected });
  }

  async save() {
    let plotName = this.state.plotName;
    if (plotName == null || plotName == "") {
      this.setState({ validateExportName: true });
      return;
    } else {
      this.setState({ validateExportName: false });
    }
    let fileFormat = this.state.plotFileFormat;
    if (fileFormat == null || fileFormat == "") {
      this.setState({ validateFileFormat: true });
      return;
    } else {
      this.setState({ validateFileFormat: false });
    }

    if (fileFormat === "png") {
      if (this.state.width && this.state.height) {
        try {
          await this.props.inject(
            `canvas.png('${plotName}', height=float('${
              this.state.height
            }'), width=float('${this.state.width}'), units='${
              this.state.plotUnits
            }')`
          );
        } catch (error) {
          console.log("Failed to export with custom dimensions");
          console.log("error:", error);
          return;
        }
      } else {
        await this.props.inject(`canvas.png('${plotName}')`);
      }
    } else if (fileFormat === "pdf") {
      if (this.state.width && this.state.height) {
        try {
          await this.props.inject(
            `canvas.pdf('${plotName}', height=float('${
              this.state.height
            }'), width=float('${this.state.width}'), units='${
              this.state.plotUnits
            }')`
          );
        } catch (error) {
          console.log("Failed to export with custom dimensions");
          console.log("error:", error);
          return;
        }
      } else {
        await this.props.inject(`canvas.pdf('${plotName}')`);
      }
    } else if (fileFormat === "svg") {
      if (this.state.width && this.state.height) {
        try {
          await this.props.inject(
            `canvas.svg('${plotName}', height=float('${
              this.state.height
            }'), width=float('${this.state.width}'), units='${
              this.state.plotUnits
            }')`
          );
        } catch (error) {
          console.log("Failed to export with custom dimensions");
          console.log("error:", error);
          return;
        }
      } else {
        await this.props.inject(`canvas.svg('${plotName}')`);
      }
    } else if (fileFormat === "ps") {
      if (this.state.width && this.state.height) {
        try {
          await this.props.inject(
            `canvas.postscript('${plotName}', height=float('${
              this.state.height
            }'), width=float('${this.state.width}'), units='${
              this.state.plotUnits
            }')`
          );
        } catch (error) {
          console.log("Failed to export with custom dimensions");
          console.log("error:", error);
          return;
        }
      } else {
        await this.props.inject(`canvas.postscript('${plotName}')`);
      }
    }
    this.props.setPlotInfo(this.state.plotName, this.state.plotFileFormat);
    this.props.exportAlerts();
    this.toggleModal();
    this.setState({ displayDimensions: false });
  }

  render(): JSX.Element {
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
            onChange={e => this.setState({ plotName: e.target.value })}
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
                onClick={() => this.onRadioBtnClick("png")}
                active={this.state.plotFileFormat === "png"}
              >
                PNG
              </Button>
              <Button
                color="primary"
                onClick={() => this.onRadioBtnClick("svg")}
                active={this.state.plotFileFormat === "svg"}
              >
                SVG
              </Button>
              <Button
                color="primary"
                onClick={() => this.onRadioBtnClick("pdf")}
                active={this.state.plotFileFormat === "pdf"}
              >
                PDF
              </Button>
              <Button
                color="primary"
                onClick={() => this.onRadioBtnClick("ps")}
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
                    onClick={() => this.onUnitRadioBtnClick("pixels")}
                    active={this.state.plotUnits === "pixels"}
                  >
                    px
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => this.onUnitRadioBtnClick("in")}
                    active={this.state.plotUnits === "in"}
                  >
                    in
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => this.onUnitRadioBtnClick("cm")}
                    active={this.state.plotUnits === "cm"}
                  >
                    cm
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => this.onUnitRadioBtnClick("mm")}
                    active={this.state.plotUnits === "mm"}
                  >
                    mm
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => this.onUnitRadioBtnClick("dot")}
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
                  onChange={e => this.setState({ width: e.target.value })}
                />
                <Label for="height">Height</Label>
                <Input
                  type="text"
                  name="height"
                  placeholder="Height"
                  value={this.state.height}
                  onChange={e => this.setState({ height: e.target.value })}
                />
              </Collapse>
            </div>
          </div>
          <br />
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
