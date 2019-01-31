import * as React from "react";

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Row,
  Col,
} from "reactstrap";

import { DimensionSlider } from "./DimensionSlider";
import Variable from "./Variable";
import "bootstrap/dist/css/bootstrap.min.css";

type VarLoaderProps = {
  file_path: string; // path to input file
  loadVariable: any; // function to call when user hits load
};
type VarLoaderState = {
  show: boolean; // should the modal be shown
  variable: Variable; // selected variable
  axis: any; // variable axis information
  selectedVariableName: string; // cdms name of selected variable
  selectedVariableInfo: any; // axis objects for selected variab;le
  dimInfo: any; // information returned from the loader about the selected dimenesions
};

export default class VarLoader extends React.Component<VarLoaderProps, VarLoaderState> {
  constructor(props: VarLoaderProps) {
    super(props);
    this.state = {
      show: false,
      selectedVariableName: "",
      selectedVariableInfo: {},
      axis: {},
      variable: new Variable(),
      dimInfo: {}
    };

    this.toggle = this.toggle.bind(this);
    this.setVariable = this.setVariable.bind(this);
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
  setVariable(variable: Variable) {
    this.setState({
      variable: variable
    });
  }
  // user has clicked the load button
  loadVariable() {
    this.toggle();
    let dimInfo: any = {};
    this.state.variable.axisList.map((info: string) => {
      dimInfo[info] = {
        min: this.state.dimInfo[info].min,
        max: this.state.dimInfo[info].max
      };
    });
    this.props.loadVariable(this.state.variable.name, dimInfo);
  }
  // user has moved one of the dimension sliders
  updateDimInfo(dimInfo: any) {
    let newDimInfo = this.state.dimInfo;
    newDimInfo[dimInfo.name] = {
      min: dimInfo.min,
      max: dimInfo.max
    };
    this.setState({
      dimInfo: newDimInfo
    });
  }
  render() {
    return (
      <div>
        <Modal
          id="var-loader-modal"
          isOpen={this.state.show}
          toggle={this.toggle}
          size="lg"
        >
          <ModalHeader toggle={this.toggle}>Load Variable</ModalHeader>
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
            {/* <Row>
              <Col className="text-right" sm={2}>
                Variable(s)
              </Col>
              <Col sm={9}>
                <FormGroup>
                  <Input type="select" onChange={this.selectVariable}>
                    <option key="default">select variable</option>
                    {Object.keys(this.state.variables).map((key: any) => {
                      return (
                        <option key={key} title={key}>
                          {key}: {this.state.variables[key].name}
                        </option>
                      );
                    })}
                  </Input>
                </FormGroup>
              </Col>
            </Row> */}
          </ModalBody>
          {this.state.variable.axisInfo &&
            this.state.variable.axisInfo.map((item: any) => {
              item.updateDimInfo = this.updateDimInfo;
              return <DimensionSlider key={item.name} {...item} />;
            })}
          <ModalFooter>
            <Button color="primary" onClick={this.loadVariable}>
              Load
            </Button>{" "}
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
