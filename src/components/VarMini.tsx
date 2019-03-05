import * as React from "react";
import Variable from "./Variable";
import AxisInfo from "./AxisInfo";
import DimensionSlider from "./DimensionSlider";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody
} from "reactstrap";

const axisStyle: React.CSSProperties = {
  marginLeft: ".5em"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

type VarMiniProps = {
  variable: Variable;
  selectVariable: Function; // method to call to add this variable to the list to get loaded
  deselectVariable: Function; // method to call to remove a variable from the list
  updateDimInfo: Function; // method passed by the parent to update their copy of the variables dimension info
  isSelected: Function; // method to check if this variable is selected in parent
  allowReload: boolean;
  reload: Function;
};
type VarMiniState = {
  showAxis: boolean;
};

export default class VarMini extends React.Component<
  VarMiniProps,
  VarMiniState
> {
  varName: string;
  constructor(props: VarMiniProps) {
    super(props);
    this.state = {
      showAxis: false
    };
    this.varName = this.props.variable.name;
    this.openMenu = this.openMenu.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  async selectVariable(): Promise<void> {
    if (this.props.isSelected(this.varName)) {
      await this.props.deselectVariable(this.varName);
    } else {
      await this.props.selectVariable(this.varName);
    }
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
            active={this.props.isSelected(this.varName)}
            color={
              this.props.isSelected(this.varName) ? "success" : "secondary"
            }
            onClick={this.selectVariable}
          >
            {this.props.variable.name}
          </Button>
          <Button
            outline
            style={axisStyle}
            color="secondary"
            onClick={() => {
              this.setState({
                showAxis: !this.state.showAxis
              });
            }}
          >
            edit
          </Button>
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
