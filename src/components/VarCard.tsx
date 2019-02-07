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
  Collapse,
  Row,
  Col
} from "reactstrap";

const cardStyle: React.CSSProperties = {
  margin: "1em"
};
const centered: React.CSSProperties = {
  margin: "auto"
};
const axisStyle: React.CSSProperties = {
  marginTop: "0.5em"
};
const buttonsStyle: React.CSSProperties = {
  width: "inherit"
};

type VarCardProps = {
  variable: Variable;
  selectVariable: any; // method to call to add this variable to the list to get loaded
  deselectVariable: any; // method to call to remove a variable from the list
  hidden: boolean; // should the axis be hidden by default
  updateDimInfo: any; // method passed by the parent to update their copy of the variables dimension info
  isSelected: boolean; // is this variable already selected
  allowReload: boolean;
  reload: any;
};
type VarCardState = {
  showAxis: boolean;
  loadOrder: number;
  axisState: any;
  isSelected: boolean;
  hidden: boolean;
  isChanged: boolean;
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
      isSelected: this.props.isSelected,
      hidden: props.hidden,
      isChanged: false
    };

    this.toggleMenu = this.toggleMenu.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.handleStatusChange = this.handleStatusChange.bind(this);
  }

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  selectVariable() {
    if (!this.state.isSelected && !this.state.hidden) {
      this.toggleMenu();
    }
    if (this.state.showAxis && this.state.isSelected) {
      this.setState({
        showAxis: false
      });
    }

    this.setState(
      {
        isSelected: !this.state.isSelected
      },
      () => {
        if (this.state.isSelected) {
          this.props.selectVariable(this.props.variable);
        } else {
          this.props.deselectVariable(this.props.variable);
        }
      }
    );
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

  updateDimInfo(newInfo: any, varName: string) {
    if (this.props.allowReload) {
      this.setState({
        isChanged: true
      });
    }
    this.props.updateDimInfo(newInfo, varName);
  }

  handleStatusChange(status: any) {
    console.log(status);
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
            <CardTitle>
              {this.props.variable.name}: {this.props.variable.longName}
            </CardTitle>
            <CardSubtitle>
              <div style={centered}>
                <Row>
                  <Col xs="sm-4">
                    <Button
                      outline
                      color="success"
                      onClick={this.selectVariable}
                      active={this.state.isSelected == true}
                      style={buttonsStyle}
                    >
                      {buttonString}
                    </Button>
                  </Col>
                  <Col xs="sm-4">
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
                        style={buttonsStyle}
                      >
                        {hideString}
                      </Button>
                    )}
                  </Col>
                  {this.props.allowReload && this.state.isChanged && (
                    <Col xs="sm-4">
                      <Button
                        outline
                        color="info"
                        onClick={() => {
                          this.setState({
                            isChanged: false
                          });
                          this.props.reload();
                        }}
                      >
                        Reload
                      </Button>
                    </Col>
                  )}
                </Row>
              </div>
            </CardSubtitle>
            <Collapse isOpen={this.state.showAxis} onClick={this.openMenu}>
              {this.props.variable.axisInfo.map((item: AxisInfo) => {
                if (item.data.length <= 1) {
                  return;
                }
                item.updateDimInfo = this.updateDimInfo;
                return (
                  <div key={item.name} style={axisStyle}>
                    <Card>
                      <CardBody>
                        <DimensionSlider
                          {...item}
                          varName={this.props.variable.name}
                        />
                      </CardBody>
                    </Card>
                  </div>
                );
              })}
            </Collapse>
          </CardBody>
          <CardFooter />
        </Card>
      </div>
    );
  }
}
