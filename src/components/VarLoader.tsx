// import * as ReactDOM from "react-dom";
import * as React from "react";
// import * as $ from "jquery";
// import * as _ from "lodash";

import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Row,
    Col,
    FormGroup,
    Input
} from "reactstrap";
import { DimensionSlider } from './DimensionSlider';

import 'bootstrap/dist/css/bootstrap.min.css';

type VarLoaderProps = {
    file_path: string   // path to input file
    loadVariable: any   // function to call when user hits load
};
type VarLoaderState = {
    show: boolean                   // should the modal be shown
    variables: any                  // list of variable objects
    axis: any                       // variable axis information
    selectedVariableName: string    // cdms name of selected variable
    selectedVariableInfo: any       // axis objects for selected variab;le
    dimInfo: any                    // information returned from the loader about the selected dimenesions
}

export class VarLoader extends React.Component<VarLoaderProps, VarLoaderState> {
    constructor(props: VarLoaderProps) {
        super(props);
        this.state = {
            show: false,
            selectedVariableName: '',
            selectedVariableInfo: {},
            axis: {},
            variables: {},
            dimInfo: {}
        };

        this.toggle = this.toggle.bind(this);
        this.setVariables = this.setVariables.bind(this);
        this.selectVariable = this.selectVariable.bind(this);
        this.loadVariable = this.loadVariable.bind(this);
        this.updateDimInfo = this.updateDimInfo.bind(this);
    }
    // open and close the variable loader modal
    toggle() {
        this.setState({
            show: !this.state.show
        });
    }
    // set the variables and axis info
    setVariables(variables: any, axis: any) {
        this.setState({
            variables: variables,
            axis: axis
        })
    }
    // user has selected a variable from the drop down list
    selectVariable(event: any) {
        if (event.target.value == 'select variable') return

        let vName = event.target.selectedOptions[0].title
        this.setState({
            selectedVariableName: vName,
            selectedVariableInfo: this.state.variables[vName]
        });
    }
    // user has clicked the load button
    loadVariable() {
        this.toggle();
        let dimInfo: any = {};
        this.state.selectedVariableInfo.axisList.map((info: string) => {
            dimInfo[info] = {
                min: this.state.dimInfo[info].min,
                max: this.state.dimInfo[info].max
            }
        });
        this.props.loadVariable(
            this.state.selectedVariableName,
            dimInfo
        );
    }
    // user has moved one of the dimension sliders
    updateDimInfo(dimInfo: any){
        let newDimInfo = this.state.dimInfo;
        newDimInfo[dimInfo.name] = {
            min: dimInfo.min,
            max: dimInfo.max
        }
        this.setState({
            dimInfo: newDimInfo
        });
    }
    render() {
        return (
            <div>
                <Modal className="jupyter-vcdat-ext" id="var-loader-modal" isOpen={this.state.show} toggle={this.toggle} size="lg">
                    <ModalHeader toggle={this.toggle}>
                        Load Variable
                    </ModalHeader>
                    <ModalBody>
                        <div className="load-from">
                            <Row>
                                <Col className="text-right" sm={2}>
                                    File
                                </Col>
                                <Col sm={9}>
                                    <p>{this.props.file_path}</p>
                                </Col>
                            </Row>
                        </div>
                        <Row>
                            <Col className="text-right" sm={2}>
                                Variable(s)
                            </Col>
                            <Col sm={9}>
                                <FormGroup>
                                    <Input type="select" onChange={this.selectVariable}>
                                        <option key="default">select variable</option>
                                        {Object.keys(this.state.variables).map((key: any) => {
                                            return (<option key={key} title={key}>{key}: {this.state.variables[key].name}</option>)
                                        })}
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    {/* Once the user selects a variable show the dimension sliders */}
                    {<this.DimSliders
                        selectedVariableName={this.state.selectedVariableName}
                        selectedVariableInfo={this.state.selectedVariableInfo}
                        axis={this.state.axis}
                        variables={this.state.variables}
                        updateDimInfo={this.updateDimInfo} />}
                    <ModalFooter>
                        <Button color="primary" onClick={this.loadVariable}>Load</Button>{' '}
                    </ModalFooter>
                </Modal>
            </div>);
    }
    DimSliders(props: any) {
        if (props.selectedVariableName) {
            let axisNames = props.variables[props.selectedVariableName].axisList;
            return (
                axisNames.map((item: any) => {
                    let axisInfo = props.axis[item];
                    axisInfo.updateDimInfo = props.updateDimInfo;
                    return (<DimensionSlider key={item} {...axisInfo} />)
                })
            );
        } else {
            return null;
        }
    }
}
