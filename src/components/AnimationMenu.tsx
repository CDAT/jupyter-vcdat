// Dependencies
import * as React from "react";
import { Col, CustomInput, Input, Label, Row } from "reactstrap";

// Project Components
import VariableTracker from "../VariableTracker";
import { boundMethod } from "autobind-decorator";

interface IAnimationMenuProps {
  axisIds?: string[];
  invertAxis?: boolean;
  rate?: number;
  plotReady: boolean;
  shouldAnimate: boolean;
  toggleInverse?: () => void;
  toggleAnimate: () => void;
  updateAxisId?: (event: any) => void;
  updateRate?: (event: any) => void;
  varTracker: VariableTracker;
  className?: string;
}
interface IAnimateMenuState {
  selectedAxisId: number;
  axisIds: string[];
  invertAxis: boolean;
  rate: number;
  selectedVariables: string[];
}

export default class AnimationMenu extends React.Component<
  IAnimationMenuProps,
  IAnimateMenuState
> {
  constructor(props: IAnimationMenuProps) {
    super(props);
    this.state = {
      axisIds: props.axisIds ? props.axisIds : [""],
      invertAxis: props.invertAxis ? props.invertAxis : false,
      rate: props.rate ? props.rate : 5,
      selectedAxisId: 0,
      selectedVariables: Array<string>(),
    };
  }
  @boundMethod
  public handleSelectionChanged(
    varTracker: VariableTracker,
    newSelection: string[]
  ): void {
    let selectedVariable: any;
    let axisNames = Array<string>();
    for (let i = 0; i < varTracker.selectedVariables.length; i -= -1) {
      selectedVariable = varTracker.findVariableByID(newSelection[i]);
      if (selectedVariable[0] !== -1) {
        axisNames = axisNames.concat(selectedVariable[1].axisList);
      }
    }
    this.setState({
      axisIds: axisNames,
      selectedVariables: newSelection,
    });
  }

  @boundMethod
  public updateRate(event: any): void {
    const newRate = event.currentTarget.value;
    this.setState({
      rate: newRate,
    });
    this.props.updateRate(newRate);
  }
  @boundMethod
  public updateAxisId(event: any): void {
    const newId = event.currentTarget.value;
    this.setState({
      selectedAxisId: newId,
    });
    this.props.updateAxisId(newId);
  }
  public render(): JSX.Element {
    return (
      <div>
        <Row>
          <Col xs="auto">
            <CustomInput
              type="switch"
              id={
                /* @tag<graphics-animation-switch>*/ "graphics-animation-switch-vcdat"
              }
              name="animateSwitch"
              label="Animate"
              disabled={!this.props.plotReady}
              checked={this.props.shouldAnimate}
              onChange={this.props.toggleAnimate}
            />
          </Col>
        </Row>
        {this.props.shouldAnimate && (
          <div>
            <Row>
              <Col xs="2">
                <Label for="animation-menu-axis-select">Axis:</Label>
              </Col>
              <Col xs="6">
                <CustomInput
                  type="select"
                  id={
                    /* @tag<vcsmenu-animate-select>*/ "vcsmenu-animate-select-vcdat"
                  }
                  name="animation-menu-axis-select"
                  onClick={this.updateAxisId}
                >
                  {this.state.axisIds.map((name: string, idx: number) => {
                    return (
                      <option value={idx} key={idx}>
                        {name}
                      </option>
                    );
                  })}
                </CustomInput>
              </Col>
            </Row>
            <Row>
              <Col xs="2">
                <Label for="animation-menu-axis-inverse">
                  <span>Invert:</span>
                </Label>
              </Col>
              <Col xs="6">
                <CustomInput
                  type="checkbox"
                  id="animation-menu-axis-inverse"
                  onClick={this.props.toggleInverse}
                />
              </Col>
            </Row>
            <Row>
              <Col xs="auto">
                <Label for="animation-menu-rate-slider">
                  Rate: {this.state.rate}
                </Label>
                <Input
                  id="animation-menu-rate-slider"
                  value={this.state.rate}
                  type="range"
                  min="1"
                  max="30"
                  onChange={this.updateRate}
                />
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  }
  public componentDidMount(): void {
    this.props.varTracker.selectedVariablesChanged.connect(
      this.handleSelectionChanged
    );
  }
  public componentWillUnmount(): void {
    this.props.varTracker.selectedVariablesChanged.disconnect(
      this.handleSelectionChanged
    );
  }
}
