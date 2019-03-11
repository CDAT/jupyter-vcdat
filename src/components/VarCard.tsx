// Dependencies
import * as React from "react";
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Button,
  Collapse,
  Row,
  Col
} from "reactstrap";

// Project components
import Variable from "./Variable";
import DimensionSlider from "./DimensionSlider";
import AxisInfo from "./AxisInfo";
import { NotebookUtilities } from "../NotebookUtilities";

const cardStyle: React.CSSProperties = {
  margin: ".5em"
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
  selectVariable: Function; // method to call to add this variable to the list to get loaded
  deselectVariable: Function; // method to call to remove a variable from the list
  hidden: boolean; // should the axis be hidden by default
  updateDimInfo: Function; // method passed by the parent to update their copy of the variables dimension info
  isSelected: Function; // method to check if this variable is selected in parent
  allowReload: boolean;
  reload: Function;
  isLoaded: boolean;
};
type VarCardState = {
  showAxis: boolean;
  loadOrder: number;
  axisState: any;
  isLoaded: boolean;
  hidden: boolean;
  isChanged: boolean;
  isDerived: boolean;
};

export default class VarCard extends React.Component<
  VarCardProps,
  VarCardState
> {
  varName: string;
  constructor(props: VarCardProps) {
    super(props);
    this.state = {
      loadOrder: -1,
      axisState: [],
      isLoaded: this.props.isLoaded,
      showAxis: false,
      hidden: props.hidden,
      isChanged: false,
      isDerived: this.props.variable.name != this.props.variable.cdmsID
    };
    this.varName = this.props.variable.name;
    this.openMenu = this.openMenu.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
  }

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  async selectVariable(): Promise<void> {
    if (this.state.isLoaded) {
      NotebookUtilities.showMessage("Notice","This variable is already loaded.");
      await this.props.deselectVariable(this.varName);
      return;
    }

    if (this.props.isSelected(this.varName)) {
      await this.props.deselectVariable(this.varName);
    } else {
      await this.props.selectVariable(this.varName);
    }

    if (this.props.isSelected(this.varName)) {
      this.setState({
        hidden: false
      });
    } else {
      this.setState({
        hidden: true
      });
    }
  }

  /**
   * @description open the menu if its closed
   */
  openMenu(): void {
    if (!this.state.showAxis && !this.state.hidden) {
      this.setState({
        showAxis: true
      });
    }
  }

  updateDimInfo(newInfo: any, varName: string): void {
    if (this.props.allowReload) {
      this.setState({
        isChanged: true
      });
    }
    this.props.updateDimInfo(newInfo, varName);
  }

  render(): JSX.Element {
    let color = "success";
    if (this.state.isLoaded) {
      color = "warning";
    }
    return (
      <div>
        <Card style={cardStyle}>
          <CardBody>
            <CardTitle>
              <div style={centered}>
                <Row>
                  <Col xs="sm-5">
                    <Button
                      outline
                      color={color}
                      onClick={this.selectVariable}
                      active={this.props.isSelected(this.varName)}
                      style={buttonsStyle}
                    >
                      {this.props.variable.name}
                    </Button>
                  </Col>
                  <Col xs="sm-4">
                    {(this.state.showAxis ||
                      this.props.isSelected(this.varName)) && (
                      <Button
                        title={
                          this.state.isDerived
                            ? "Editing of custom variables coming soon."
                            : ""
                        }
                        outline
                        color={this.state.isDerived ? "dark" : "danger"}
                        active={this.state.showAxis}
                        disabled={this.state.isDerived}
                        onClick={() => {
                          this.setState({
                            showAxis: !this.state.showAxis,
                            hidden: !this.state.hidden
                          });
                        }}
                        style={buttonsStyle}
                      >
                        Axes
                      </Button>
                    )}
                  </Col>
                  {this.props.allowReload && this.state.isChanged && (
                    <Col xs="sm-3">
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
            </CardTitle>
            <Collapse isOpen={this.state.showAxis} onClick={this.openMenu}>
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
            </Collapse>
          </CardBody>
          <CardFooter />
        </Card>
      </div>
    );
  }
}
