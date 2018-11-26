import * as React from "react";

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

import { DimensionSlider } from "./DimensionSlider";

import "bootstrap/dist/css/bootstrap.min.css";

type VarEditorProps = {
  selectedVariableInfo: any;
  editVariable: any;
};
type VarEditorState = {
  show: boolean; // should the edit modal be shown
  dimInfo: any; // dimension information about the selected variable
  selectedVariableInfo: any;
};

export class VarEditor extends React.Component<
  VarEditorProps,
  VarEditorState
> {
  constructor(props: VarEditorProps) {
    super(props);
    this.state = {
      show: false,
      dimInfo: {},
      selectedVariableInfo: {}
    };
    this.toggle = this.toggle.bind(this);
    this.dimSliders = this.dimSliders.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
  }
  // open and close the variable editor modal
  toggle() {
    this.setState({
      show: !this.state.show
    });
  }
  // Allow the parent to update the selectedVariableInfo
  updateVariableInfo(varInfo: any) {
    this.setState({
      selectedVariableInfo: varInfo
    });
  }
  // render the component
  render() {
    return (
      <div>
        <Modal
          id="var-loader-modal"
          isOpen={this.state.show}
          toggle={this.toggle}
          size="lg"
        >
          <ModalHeader toggle={this.toggle}>Edit Variable</ModalHeader>
          <ModalBody>
            <Row>
              <Col className="text-right" sm={2}>
                Edit Variable: {this.props.selectedVariableInfo.name}
              </Col>
            </Row>

            {/* generate dimension sliders for each axis */}
            <this.dimSliders />
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.editVariable}>
              Edit
            </Button>{" "}
          </ModalFooter>
        </Modal>
      </div>
    );
  }
  // user has clicked the update button
  editVariable() {
    this.toggle();
    let dimInfo: any = {};
    this.state.selectedVariableInfo.axisList.map((info: string) => {
      dimInfo[info] = {
        min: this.state.dimInfo[info].min,
        max: this.state.dimInfo[info].max
      };
    });
    this.props.editVariable(this.state.selectedVariableInfo, dimInfo);
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
  // generate a Dimension Slider for each axis of the given variable
  dimSliders() {
    if (this.state.selectedVariableInfo.name) {
      let axisNames = this.state.selectedVariableInfo.axisList;
      return axisNames.map((item: any) => {
        let axisInfo = this.state.selectedVariableInfo.axis[item];
        axisInfo.updateDimInfo = this.updateDimInfo;
        return <DimensionSlider key={item} {...axisInfo} />;
      });
    } else {
      return null;
    }
  }
}
