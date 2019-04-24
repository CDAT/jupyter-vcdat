// Dependencies
import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Col,
  Collapse,
  Row
} from "reactstrap";

// Project Components
import { NotebookUtilities } from "../NotebookUtilities";
import { AxisInfo } from "./AxisInfo";
import { DimensionSlider } from "./DimensionSlider";
import { Variable } from "./Variable";

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

interface IVarCardProps {
  variable: Variable;
  selectVariable: Function; // method to call to add this variable to the list to get loaded
  deselectVariable: Function; // method to call to remove a variable from the list
  hidden: boolean; // should the axis be hidden by default
  updateDimInfo: Function; // method passed by the parent to update their copy of the variables dimension info
  isSelected: Function; // method to check if this variable is selected in parent
  allowReload: boolean;
  reload: Function;
  isLoaded: boolean; // Whether a variable already exists/was loaded
}
interface IVarCardState {
  showAxis: boolean;
  loadOrder: number;
  axisState: any;
  hidden: boolean;
  isChanged: boolean;
}

export class VarCard extends React.Component<IVarCardProps, IVarCardState> {
  public varName: string;
  constructor(props: IVarCardProps) {
    super(props);
    this.state = {
      loadOrder: -1,
      axisState: [],
      showAxis: false,
      hidden: props.hidden,
      isChanged: false
    };
    this.varName = this.props.variable.name;
    this.openMenu = this.openMenu.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
  }

  /**
   * @description sets the isSelected attribute, and propagates up the selection action to the parent
   */
  public async selectVariable(): Promise<void> {
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
  public openMenu(): void {
    if (!this.state.showAxis && !this.state.hidden) {
      this.setState({
        showAxis: true
      });
    }
  }

  public updateDimInfo(newInfo: any, varName: string): void {
    if (this.props.allowReload) {
      this.setState({
        isChanged: true
      });
    }
    this.props.updateDimInfo(newInfo, varName);
  }

  public render(): JSX.Element {
    return (
      <div>
        <Card style={cardStyle}>
          <CardBody>
            <CardTitle>
              <div style={centered}>
                <Row>
                  <Col xs="sm-5">
                    <Button
                      outline={true}
                      color={"success"}
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
                        outline={true}
                        color={"danger"}
                        active={this.state.showAxis}
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
                  {this.props.isLoaded && this.props.isSelected(this.varName) && (
                    <Col xs="sm-3">
                      <Button
                        color={"warning"}
                        onClick={() => {
                          NotebookUtilities.showMessage(
                            "Warning",
                            `Loading '${
                              this.varName
                            }' from this file will overwrite the previous '${
                              this.varName
                            }' variable.`,
                            "Dismiss"
                          );
                        }}
                      >
                        !
                      </Button>
                    </Col>
                  )}
                </Row>
              </div>
            </CardTitle>
            <Collapse isOpen={this.state.showAxis} onClick={this.openMenu}>
              {this.state.showAxis &&
                this.props.variable.axisInfo.map((item: AxisInfo) => {
                  if (!item.data || item.data.length <= 1) {
                    return;
                  }
                  item.updateDimInfo = this.updateDimInfo;
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
