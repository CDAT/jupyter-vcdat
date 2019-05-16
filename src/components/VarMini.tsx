// Dependencies
import * as React from "react";
import {
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
  ModalHeader
} from "reactstrap";

// Project Components
import { CodeInjector } from "../CodeInjector";
import { Utilities } from "../Utilities";
import { AxisInfo } from "./AxisInfo";
import { DimensionSlider } from "./DimensionSlider";
import { Variable } from "./Variable";

const axisStyle: React.CSSProperties = {
  marginLeft: ".5em"
};
const badgeStyle: React.CSSProperties = {
  margin: "auto",
  marginLeft: "0.5em"
};

interface IVarMiniProps {
  buttonColor: string; // The hex value for the color
  codeInjector: CodeInjector;
  variable: Variable; // the variable this component will show
  updateDimInfo: (newInfo: any, varID: string) => void; // method passed by the parent to update their copy of the variables dimension info
  isSelected: (variable: Variable) => boolean; // method to check if this variable is selected in parent
  copyVariable: (variable: Variable, newName: string) => Promise<void>;
  deleteVariable: (variable: Variable) => Promise<void>;
  modalOpen: (isOpen: boolean) => void;
  selectOrder: number;
  allowReload: boolean; // is this variable allowed to be reloaded
  reload: () => void; // a function to reload the variable
}
interface IVarMiniState {
  activateAppend: boolean;
  activateShuffle: boolean;
  activateDeflate: boolean;
  deflateValue: string;
  filename: string;
  newVariableName: string;
  showAxis: boolean; // should the edit axis modal be shown
  showSaveModal: boolean;
}

export class VarMini extends React.Component<IVarMiniProps, IVarMiniState> {
  constructor(props: IVarMiniProps) {
    super(props);
    this.state = {
      activateAppend: false,
      activateDeflate: false,
      activateShuffle: false,
      deflateValue: null,
      filename: "",
      newVariableName: "",
      showAxis: false,
      showSaveModal: false
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
    this.setState({
      activateDeflate: !this.state.activateDeflate
    });
    this.setState({
      deflateValue: null
    });
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
    console.log("updating deflateValue");
    this.setState({ deflateValue: event.target.value }, () => {
      console.log("this.state.deflateValue:", this.state.deflateValue);
    });
  }

  public updateNewVariableName(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ newVariableName: event.target.value }, () => {
      console.log("newVariableName: ", this.state.newVariableName);
    });
  }

  public async save() {
    console.log("in save method.");
    await this.props.codeInjector.saveNetCDFFile(
      this.state.filename,
      this.varName,
      this.state.newVariableName
    );
  }

  public render(): JSX.Element {
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
            active={this.props.isSelected(this.props.variable)}
          >
            {this.props.variable.alias}
          </Button>
          <Button
            className={/*@tag<varmini-edit-btn>*/ "varmini-edit-btn-vcdat"}
            outline={true}
            style={axisStyle}
            title={
              this.props.variable.sourceName === ""
                ? "Editing of modified variables disabled for now."
                : ""
            }
            disabled={this.props.variable.sourceName === ""}
            color={this.props.variable.sourceName === "" ? "dark" : "danger"}
            onClick={this.handleEditClick}
          >
            edit
          </Button>
          <Button
            outline={true}
            style={axisStyle}
            onClick={this.handleSaveClick}
          >
            save variable
          </Button>
          {this.props.isSelected(this.varName) && (
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
          <ModalHeader toggle={this.toggleModal}>Edit Axis</ModalHeader>
          <ModalBody
            className={/*@tag<varmini-edit-modal>*/ "varmini-edit-modal-vcdat"}
          >
            {this.state.showAxis &&
              this.props.variable.axisInfo.length > 0 &&
              this.props.variable.axisInfo.map((item: AxisInfo) => {
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
                          varID={this.props.variable.varID}
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
              placeholder={this.varName}
              value={this.state.newVariableName}
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
              Export
            </Button>{" "}
            <Button color="secondary" onClick={this.toggleModal}>
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
    await this.props.copyVariable(this.props.variable, "Test");
  }

  private async handleDeleteClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    clickEvent.stopPropagation();
    await this.props.deleteVariable(this.props.variable);
  }

  private handleEditClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): void {
    clickEvent.stopPropagation();
    this.props.modalOpen(!this.state.showAxis);
    this.setState({
      showAxis: !this.state.showAxis
    });
  }

  private handleUpdateClick(): void {
    this.toggleModal();
    this.props.reload();
  }

  private handleSaveClick(
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ): void {
    console.log("clicked save button");
    this.toggleSaveModal();
    clickEvent.stopPropagation();
  }
}
