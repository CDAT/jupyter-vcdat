// Dependencies
import * as React from "react";
import { Button, Card, CardBody } from "reactstrap";
// Project Components
import VarMenu from "./VarMenu";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";

const btnStyle: React.CSSProperties = {
  margin: "5px"
};
const divStyle: React.CSSProperties = {
  overflow: "scroll"
};

// plotAction: any; // the method to call when the user hits the "Plot" button
// refreshAction: any; // the method to call when the user hits the "refresh" button
// updatePlotOptions: any; // a method to cause the plot options to be updated
export type VCSMenuProps = {
  inject: any; // a method to inject code into the controllers notebook
  file_path: string; // the file path for the selected netCDF file
  commands: any; // the command executor
};
type VCSMenuState = {
  file_path: string;
  plotReady: boolean; // are we ready to plot
  selected_variables: Array<Variable>;
  selected_gm: string;
  selected_gm_group: string;
  selected_template: string;
};

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      file_path: props.file_path,
      plotReady: false,
      selected_variables: new Array<Variable>(),
      selected_gm: "",
      selected_gm_group: "",
      selected_template: ""
    };

    this.update = this.update.bind(this);
    this.plot = this.plot.bind(this);
    this.switchNotebook = this.switchNotebook.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.updateVarOptions = this.updateVarOptions.bind(this);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
  }
  switchNotebook(){

  }
  update(vars: Array<string>, gms: Array<any>, templates: Array<any>) {
    console.log(vars, gms, templates);
  }
  updateGraphicsOptions(group: string, name: string) {
    this.setState({
      selected_gm_group: group,
      selected_gm: `${group}_${name}`
    });
    let gm_string = `${group}_${name} = vcs.get${group}('${name}')`;
    this.props.inject(gm_string);
  }
  updateVarOptions(variableList: Array<Variable>) {
    this.setState({
      selected_variables: variableList
    });
    variableList.forEach((item: Variable) => {
      let var_string = `${item.name} = data("${item.name}"`;
      item.axisInfo.forEach((axis: any) => {
        var_string += `, ${axis.name}=(${axis.data[0]}, ${
          axis.data[axis.data.length - 1]
        })`;
      });
      var_string += ")";
      this.props.inject(var_string);
    });
  }
  updateTemplateOptions() {}
  plot() {
    if (this.state.selected_variables.length == 0) {
      this.props.inject("# Please select a variable from the left panel");
    } else {
      let gm = this.state.selected_gm;
      let temp = this.state.selected_template;
      if (!gm) {
        gm = '"default"';
      }
      if (!temp) {
        temp = '"default"';
      }
      let plotString = "canvas.clear()\ncanvas.plot(";
      this.state.selected_variables.forEach(variable => {
        plotString += variable.name + ", ";
      });
      plotString += `${gm}, ${temp})`;
      this.props.inject(plotString);
    }
  }
  render() {
    let GraphicsMenuProps = {
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable()
    };
    let VarMenuProps = {
      file_path: this.state.file_path,
      loadVariable: this.updateVarOptions,
      commands: this.props.commands
    };
    let TemplateMenuProps = {
      updateTemplate: () => {} //TODO: this
    };

    return (
      <div>
        <GraphicsMenu {...GraphicsMenuProps} />
        <VarMenu {...VarMenuProps} />
        <TemplateMenu {...TemplateMenuProps} />
        <Card>
          <CardBody>
            <Button
              type="button"
              color="primary"
              className="col-sm-3"
              style={btnStyle}
              onClick={this.plot}
              disabled={this.state.plotReady}
            >
              Generate Plot
            </Button>
            <Button
              type="button"
              color="primary"
              className="col-sm-3"
              style={btnStyle}
              onClick={this.plot}
              disabled={this.state.plotReady}
            >
              Save Plot
            </Button>
            <Button
              type="button"
              color="primary"
              className="col-sm-3"
              style={btnStyle}
              onClick={this.plot}
              disabled={this.state.plotReady}
            >
              Clear Plot
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default VCSMenu;
