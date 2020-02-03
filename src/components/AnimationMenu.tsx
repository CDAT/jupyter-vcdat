// Dependencies
import * as React from "react";
import {
    Row,
    Col,
    Label,
    Input,
    CustomInput
} from "reactstrap";

// Project Components
import VariableTracker from "../VariableTracker";
import { boundMethod } from "autobind-decorator";

interface IAnimationMenuProps {
  axisIds?: string[];
  invertAxis?: boolean;
  rate?: number;
  plotReady: boolean;
  toggleInverse?: () => void;
  toggleAnimate: () => void;
  updateAxisId?: (event: any) => void;
  updateRate?: (event: any) => void;
  varTracker: VariableTracker;
}
interface IAnimateMenuState {
  selectedAxisId: number;
  axisIds: string[];
  invertAxis: boolean;
  rate: number;
  shouldAnimate: boolean;
  selectedVariables: string[]
}

export default class AnimationMenu extends React.Component<
  IAnimationMenuProps,
  IAnimateMenuState
> {
  constructor(props: IAnimationMenuProps) {
    super(props);
    this.state = {
      axisIds: props.axisIds ? props.axisIds : [''],
      selectedAxisId: 0,
      invertAxis: props.invertAxis ? props.invertAxis : false,
      rate: props.rate ? props.rate : 5,
      shouldAnimate: false,
      selectedVariables: new Array<string>()
    }
  }
  @boundMethod
  public handleSelectionChanged(
    varTracker: VariableTracker,
    newSelection: string[]
  ): void {
    let selectedVariableName = "";
    let selectedVariable: any = undefined;
    let axisNames = new Array<string>();
    for(let i = 0; i < varTracker.selectedVariables.length; i-=-1){
      selectedVariableName = varTracker.selectedVariables[0].slice(0, varTracker.selectedVariables[0].length/2);
      selectedVariable = varTracker.findVariableByAlias(selectedVariableName);
      if(selectedVariable[0] != -1){
        for(let i = 0; i < selectedVariable[1].axisList.length; i++){
          axisNames.push(selectedVariable[1].axisList[i]);
        }
      }
    }
    this.setState({ 
      selectedVariables: newSelection,
      axisIds: axisNames
     });
  }
  @boundMethod
  public toggleAnimate(){
    this.setState({
      shouldAnimate: !this.state.shouldAnimate
    })
    this.props.toggleAnimate();
  }
  @boundMethod
  public updateRate(event: any){
    let newRate = event.currentTarget.value;
    this.setState({
      rate: newRate
    });
    this.props.updateRate(newRate);
  }
  @boundMethod
  public updateAxisId(event: any){
    let newId = event.currentTarget.value;
    this.setState({
      selectedAxisId: newId
    });
    this.props.updateAxisId(newId);
  }
  public render(): JSX.Element { 
    return (<div>
      <Row>
        <Col xs="auto">
          <CustomInput
            type="switch"
            id={
              /*@tag<animation-menu-switch>*/ "animation-menu-switch-vcdat"
            }
            name="animateSwitch"
            label="Animate"
            disabled={!this.props.plotReady}
            onChange={this.toggleAnimate}
            />
        </Col>
      </Row>
        {this.state.shouldAnimate && (
          <div>
            <Row>
              <Col xs="2">
                <Label for="animation-menu-axis-select">Axis:</Label>
              </Col>
              <Col xs="6">
                <CustomInput
                  type="select"
                  id={
                    /*@tag<vcsmenu-animate-select>*/ "animation-menu-axis-select"
                  }
                  name="animation-menu-axis-select"
                  onClick={this.updateAxisId}
                  disabled={!this.state.shouldAnimate}>
                    {this.state.axisIds.map((name: string, idx: number) => {
                      return (<option value={idx} key={idx}>{name}</option>)
                    })}
                </CustomInput>
              </Col>
            </Row>
            <Row>
              <Col xs="2">
                <Label for="animation-menu-axis-inverse">
                  <span>
                    Invert: 
                  </span>
                </Label>
              </Col>
              <Col xs="6">
                <CustomInput 
                  type="checkbox" 
                  id="animation-menu-axis-inverse" 
                  onClick={this.props.toggleInverse}/>
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
                  onChange={this.updateRate} />
              </Col>
            </Row>
          </div>
        )}
    </div>)
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