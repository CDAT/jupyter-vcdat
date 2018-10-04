import * as ReactDOM from "react-dom";
import * as React from "react";
import $ from "jquery";
import _ from "lodash";

import { Modal, Button, Row, Col, Glyphicon } from "react-bootstrap";
// import { DropTarget, DragSource } from "react-dnd";
import { DimensionSlider } from "./DimensionSlider";
// import AxisTransform from "./CachedFiles/AxisTransform.jsx";


export class EditVariable extends React.Component<any, any> {
    constructor(props) {
        super(props);

        let transforms = {};
        try {
            transforms = $.extend(true, {}, this.props.variables[this.props.active_variable].transforms);
        } catch (e) {
            transforms = {};
        }
        this.state = {
            variablesAxes: null,
            selectedVariable: null,
            dimension: null,
            axis_transforms: transforms || {}
        };
        this.getVariableInfo();
        this.handleAxisTransform = this.handleAxisTransform.bind(this);
    }

    getVariableInfo() {
        let spec = {
            file_name: this.props.variables[this.props.active_variable].path,
            var_name: this.props.variables[this.props.active_variable].cdms_var_name
        };
        if (this.props.variables[this.props.active_variable].json) {
            spec = {
                json: this.props.variables[this.props.active_variable].json
            };
        }
        try {
            return vcs.variable(spec).then(variablesAxes => {
                let selectedVariable, dimension;
                selectedVariable = variablesAxes[0];
                dimension = $.extend(true, [], this.props.variables[this.props.active_variable].dimension);
                if (dimension.length === 0) {
                    dimension = variablesAxes[0].axisList.map(name => {
                        return { axisName: name };
                    });
                }
                if (this.props.variables[this.props.active_variable].json) {
                    selectedVariable.json = this.props.variables[this.props.active_variable].json;
                }
                this.setState({
                    selectedVariable,
                    variablesAxes,
                    axisList: selectedVariable.axisList,
                    dimension
                });
            });
        } catch (e) {
            console.warn(e);
        }
    }

    handleDimensionValueChange(values, axisName = undefined) {
        if (axisName) {
            let new_dimension = this.state.dimension.slice();
            new_dimension.find(dimension => dimension.axisName === axisName).values = values;
            this.setState({ dimension: new_dimension });
        } else {
            let new_dimension = this.state.dimension;
            new_dimension.values = values;
            this.setState({ dimension: new_dimension });
        }
    }

    handleAxisTransform(axis_name, transform) {
        let new_transforms = _.cloneDeep(this.state.axis_transforms);
        new_transforms[axis_name] = transform;
        this.setState({
            axis_transforms: new_transforms
        });
    }

    save() {
        this.props.updateVariable(this.props.active_variable, this.state.axisList, this.state.dimension, this.state.axis_transforms);
        this.props.onTryClose();
    }

    render() {
        let slider_values = {};
        let dimensions = this.state.dimension && this.state.dimension.length > 0 ? this.state.dimension : [];
        if (dimensions) {
            for (let dimension of dimensions) {
                if (dimension.values) {
                    slider_values[dimension.axisName] = {
                        range: dimension.values.range,
                        stride: dimension.stride
                    };
                } else {
                    slider_values[dimension.axisName] = {
                        range: [undefined, undefined],
                        stride: undefined
                    };
                }
            }
        }
        return (
            <Modal show={this.props.show} bsSize="large" onHide={this.props.onTryClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Variable</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {this.state.selectedVariable && (
                        <div className="dimensions">
                            <Row>
                                <Col className="text-right" sm={2}>
                                    <h4>Dimensions</h4>
                                </Col>
                            </Row>
                            {/* If is a variable */}
                            {this.state.dimension.length > 0 &&
                                this.state.dimension.map(dimension => dimension.axisName).map((axisName, i) => {
                                    let axis = this.state.variablesAxes[1][axisName];
                                    return (
                                        <div key={axisName} className="axis">
                                            <DimensionDnDContainer
                                                key={axisName}
                                                low_value={slider_values[axisName].range[0]}
                                                high_value={slider_values[axisName].range[1]}
                                                index={i}
                                                axis={axis}
                                                axisName={axisName}
                                                handleDimensionValueChange={values => this.handleDimensionValueChange(values, axisName)}
                                                moveDimension={(dragIndex, hoverIndex) => this.moveDimension(dragIndex, hoverIndex)}
                                                axis_transform={this.state.axis_transforms[axisName] || "def"}
                                                handleAxisTransform={this.handleAxisTransform}
                                            />
                                        </div>
                                    );
                                })}
                            {/* if is an Axis */}
                            {!this.state.selectedVariable.axisList && (
                                <div key={this.state.selectedVariable.name} className="dimension">
                                    <div className="text-right">
                                        <span>{this.state.selectedVariable.name}</span>
                                    </div>
                                    <div className="right-content">
                                        <DimensionSlider
                                            {...this.state.selectedVariable}
                                            onChange={values => this.handleDimensionValueChange(values)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button id="edit-var-save" bsStyle="primary" onClick={() => this.save()}>
                        Save
                    </Button>
                    <Button id="edit-var-close" bsStyle="default" onClick={() => this.props.onTryClose()}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    moveDimension(dragIndex, hoverIndex) {
        var dimensions = this.state.dimension.slice();
        dimensions.splice(hoverIndex, 0, dimensions.splice(dragIndex, 1)[0]);
        this.setState({ dimension: dimensions });
    }
}

var DimensionContainer = props => {
    const opacity = props.isDragging ? 0 : 1;
    return props.connectDropTarget(
        props.connectDragPreview(
            <div className="dimension" style={{ opacity }}>
                <div className="axis-name text-right">
                    <span>{props.axis.name}</span>
                </div>
                {props.connectDragSource(
                    <div className="sort">
                        <Glyphicon glyph="menu-hamburger" />
                    </div>
                )}
                <div className="right-content">
                    <DimensionSlider
                        {...props.axis}
                        low_value={props.low_value}
                        high_value={props.high_value}
                        onChange={props.handleDimensionValueChange}
                    />
                </div>
                <AxisTransform axis_name={props.axis.name} axis_transform={props.axis_transform} handleAxisTransform={props.handleAxisTransform} />
            </div>
        )
    );
};

