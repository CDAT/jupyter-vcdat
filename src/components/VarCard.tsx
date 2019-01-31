import * as React from "react";
import Variable from "./Variable";
import DimensionSlider from "./DimensionSlider";
import AxisInfo from "./AxisInfo";

import {
  Card,
  CardTitle,
  CardSubtitle,
  CardBody,
  CardFooter,
  Button,
  Collapse
} from "reactstrap";

const cardStyle: React.CSSProperties = {
  margin: "1em"
};
const hideButtonStyle: React.CSSProperties = {
  marginLeft: "0.75em"
};

type VarCardProps = {
  variable: Variable;
  selectVariable: any;    // method to call to add this variable to the list to get loaded
  deselectVariable: any;  // method to call to remove a variable from the list
  hidden: boolean;        // should the axis be hidden by default
};
type VarCardState = {
  showAxis: boolean;
  loadOrder: number;
  axisState: any;
  isSelected: boolean;
  hidden: boolean;
};

export default class VarCard extends React.Component<
  VarCardProps,
  VarCardState
> {
  constructor(props: VarCardProps) {
    super(props);
    this.state = {
      loadOrder: -1,
      axisState: [],
      showAxis: false,
      isSelected: false,
      hidden: props.hidden
    };

    this.toggleMenu = this.toggleMenu.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
  }

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  selectVariable() {
    if (!this.state.isSelected && !this.state.hidden) {
      this.toggleMenu();
    }
    if(this.state.showAxis && this.state.isSelected) {
      this.setState({
        showAxis: false
      })
    }

    this.setState(
      {
        isSelected: !this.state.isSelected,
      },
      () => {
        if(this.state.isSelected){
          this.props.selectVariable(this.props.variable);
        } else {
          this.props.deselectVariable(this.props.variable);
        }
      }
    );
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   */
  updateDimInfo(newInfo: any) {
    this.props.variable.axisInfo.forEach((axisInfo: AxisInfo) => {
      if(axisInfo.name != newInfo.name){
        return
      } else {
        axisInfo.max = newInfo.max;
        axisInfo.min = newInfo.min;
      }
    })
  }

  /**
   * @description toggle the menu state
   */
  toggleMenu() {
    this.setState({
      showAxis: !this.state.showAxis
    });
  }

  /**
   * @description open the menu if its closed
   */
  openMenu() {
    if (!this.state.showAxis && !this.state.hidden) {
      this.setState({
        showAxis: true
      });
    }
  }
  
  render() {
    let buttonString = "Select";
    if (this.state.isSelected) {
      buttonString = "Unselect";
    }
    let hideString = "hide axis";
    if (this.state.hidden) {
      hideString = "show axis";
    }
    return (
      <div>
        <Card style={cardStyle}>
          <CardBody>
            <CardTitle>{this.props.variable.name}</CardTitle>
            <CardSubtitle>{this.props.variable.longName}</CardSubtitle>
            <Collapse isOpen={this.state.showAxis} onClick={this.openMenu}>
              {this.props.variable.axisInfo.map((item: AxisInfo) => {
                if (item.data.length <= 1) {
                  return;
                }
                item.updateDimInfo = this.updateDimInfo;
                return (
                  <div key={item.name}>
                    <Card>
                      <CardBody>
                        <DimensionSlider {...item} />
                      </CardBody>
                    </Card>
                  </div>
                );
              })}
            </Collapse>
          </CardBody>
          <CardFooter>
            <Button
              outline
              color="success"
              onClick={this.selectVariable}
              active={this.state.isSelected == true}
            >
              {buttonString}
            </Button>
            {(this.state.showAxis || this.state.isSelected) && (
              <Button
                outline
                color="danger"
                onClick={() => {
                  this.setState({
                    showAxis: !this.state.showAxis,
                    hidden: !this.state.hidden
                  });
                }}
                style={hideButtonStyle}
              >
                {hideString}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }
}
