// Dependencies
import * as React from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
  Badge
} from "reactstrap";
import { MiscUtilities } from "../Utilities";

// Project Components
import Variable from "./Variable";
import AxisInfo from "./AxisInfo";
import DimensionSlider from "./DimensionSlider";

const axisStyle: React.CSSProperties = {
  marginLeft: ".5em"
};
const badgeStyle: React.CSSProperties = {
  margin: "auto",
  marginLeft: "0.5em"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

type VarMiniProps = {
  buttonColor: string; // The hex value for the color
  variable: Variable; // the variable this component will show
  updateDimInfo: Function; // method passed by the parent to update their copy of the variables dimension info
  isSelected: Function; // method to check if this variable is selected in parent
  selectOrder: number;
  allowReload: boolean; // is this variable allowed to be reloaded
  reload: Function; // a function to reload the variable
};
type VarMiniState = {
  showAxis: boolean; // should the edit axis modal be shown
  isDerived: boolean;
};

export default class VarMini extends React.Component<
  VarMiniProps,
  VarMiniState
> {
  varName: string;
  constructor(props: VarMiniProps) {
    super(props);
    this.state = {
      showAxis: false,
      isDerived: this.props.variable.sourceName == ""
    };
    this.varName = this.props.variable.name;
    this.openMenu = this.openMenu.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  /**
   * @description open the menu if its closed
   */
  openMenu(): void {
    if (!this.state.showAxis) {
      this.setState({
        showAxis: true
      });
    }
  }

  updateDimInfo(newInfo: any, varName: string): void {
    this.props.updateDimInfo(newInfo, varName);
  }

  /**
   * @description Toggles the variable loader modal
   */
  toggleModal(): void {
    this.setState({
      showAxis: !this.state.showAxis
    });
  }

  render(): JSX.Element {
    return (
      <div>
        <div className="clearfix">
          <Button
            outline
            color={this.props.isSelected ? "success" : "secondary"}
            style={
              this.props.isSelected && {
                backgroundColor: this.props.buttonColor
              }
            }
            active={this.props.isSelected(this.varName)}
          >
            {this.props.variable.name}
          </Button>
          <Button
            outline
            style={axisStyle}
            title={this.state.isDerived ? "This is a modified variable." : ""}
            color={"danger"}
            onClick={(clickEvent: React.MouseEvent<HTMLButtonElement>) => {
              this.setState({
                showAxis: !this.state.showAxis
              });
              clickEvent.stopPropagation();
            }}
          >
            edit
          </Button>
          {this.props.isSelected(this.varName) && (
            <Badge
              className="float-right"
              style={{
                ...badgeStyle,
                ...{ backgroundColor: this.props.buttonColor }
              }}
            >
              {MiscUtilities.numToOrdStr(this.props.selectOrder)} Variable
            </Badge>
          )}
        </div>
        <Modal
          id="var-loader-modal"
          isOpen={this.state.showAxis}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>Edit Axis</ModalHeader>
          <ModalBody>
            {this.props.variable.axisInfo.map((item: AxisInfo) => {
              if (item.data.length <= 1) {
                return;
              }
              item.updateDimInfo = this.updateDimInfo;
              // Adjust min and max to fit slider
              item.min = Math.floor(item.min);
              item.max = Math.floor(item.max);
              return (
                <div key={item.name} style={axisStyle}>
                  <Card>
                    <CardBody>
                      <DimensionSlider {...item} varName={this.varName} />
                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => {
                this.toggleModal();
                this.props.reload(this.props.variable);
              }}
            >
              Update
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
