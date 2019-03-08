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
  CardBody,
  Badge
} from "reactstrap";

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
  //isPrimaryVariable: Function; // a method to test if the variable for this component is the primary
  variable: Variable; // the variable this component will show
  updateDimInfo: Function; // method passed by the parent to update their copy of the variables dimension info
  isSelected: Function; // method to check if this variable is selected in parent
  selectionRank: number; // The order that the variable was selected
  allowReload: boolean; // is this variable allowed to be reloaded
  reload: Function; // a function to reload the variable
};
type VarMiniState = {
  showAxis: boolean; // should the edit axis modal be shown
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
    let color = "secondary";
    let badge = "";
    if (this.props.isSelected(this.varName)) {
      if (this.props.selectionRank == 1) {
        color = "success";
        badge = "primary";
      } else {
        color = "info";
        badge = "secondary";
      }
    }
    return (
      <div>
        <div className="clearfix">
          <Button
            outline
            active={this.props.isSelected(this.varName)}
            color={color}
          >
            {this.props.variable.name}
          </Button>
          <Button
            outline
            style={axisStyle}
            color="secondary"
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
            <Badge color={color} style={badgeStyle}>
              {badge}
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
