// Dependencies
import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "reactstrap";

// Project Components
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
  showAxis: boolean; // should the edit axis modal be shown
}

export class VarMini extends React.Component<IVarMiniProps, IVarMiniState> {
  constructor(props: IVarMiniProps) {
    super(props);
    this.state = {
      showAxis: false
    };
    this.openMenu = this.openMenu.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleUpdateClick = this.handleUpdateClick.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);
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
          {this.props.isSelected(this.props.variable) && (
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
}
