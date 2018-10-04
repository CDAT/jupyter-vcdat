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
import 'bootstrap/dist/css/bootstrap.min.css';

type VarLoaderProps = {
    file_path: string   // path to input file
    loadVariable: any   // function to call when user hits load
};
type VarLoaderState = {
    show: boolean                   // should the modal be shown
    variables: any                  // list of variable objects
    selectedVariableName: string    // cdms name of selected variable
    selectedVariableAxis: any       // axis objects for selected variab;le
}

export class VarLoader extends React.Component<VarLoaderProps, VarLoaderState> {
    constructor(props: any) {
        super(props);
        this.state = {
            show: false,
            selectedVariableName: '',
            selectedVariableAxis: {},
            variables: {}
        };

        this.toggle = this.toggle.bind(this);
        this.setVariables = this.setVariables.bind(this);
        this.selectVariable = this.selectVariable.bind(this);
        this.loadVariable = this.loadVariable.bind(this);
    }
    toggle() {
        this.setState({
            show: !this.state.show
        });
    }
    setVariables(variables: any) {
        this.setState({
            variables: variables
        })
    }
    selectVariable(event: any) {
        if (event.target.value == 'select variable') return

        this.setState({
            selectedVariableName: event.target.value,
            selectedVariableAxis: this.state.variables[event.target.value].axisList
        });
    }
    loadVariable(){
        this.toggle();
        this.props.loadVariable(
            this.state.selectedVariableName);
    }
    render() {
        return (
            <div>
                <Modal id="var-loader-modal" isOpen={this.state.show} toggle={this.toggle} size="lg">
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
                                            return (<option key={key}>{key}</option>)
                                        })}
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    {/* Once the user selects a variable show the dimension sliders */}
                    {/* { this.state.selectedVariableName &&
                        Object.keys(this.state.selectedVariableAxis).forEach((item: string) => {
                            if(item){
                                debugger;
                            }
                        })
                    } */}
                    <ModalFooter>
                        <Button color="primary" onClick={this.loadVariable}>Load</Button>{' '}
                    </ModalFooter>
                </Modal>
            </div>);
    }
}