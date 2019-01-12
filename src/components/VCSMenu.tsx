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
  filePath: any; // Gets the file path for the selected netCDF file
};
type VCSMenuState = {
  plotReady: boolean; // are we ready to plot
  selected_variables: Array<string>;
  selected_gm: string;
  selected_gm_group: string; 
  selected_template: string;
};

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      plotReady: false,
      selected_variables: new Array<string>(),
      selected_gm: "",
      selected_gm_group: "",
      selected_template: ""
    };

    this.update = this.update.bind(this);
    this.plot = this.plot.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.updateVarOptions = this.updateVarOptions.bind(this);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
  }
  update(vars: Array<string>, gms: Array<any>, templates: Array<any>) {}
  updateGraphicsOptions(group: string, name: string) {
    this.setState({
      selected_gm_group: group,
      selected_gm: `${group}_${name}`
    });
    let gm_string = `${group}_${name} = vcs.get${group}('${name}')`;
    this.props.inject(gm_string);
  }
  updateVarOptions(variable: string, dimInfo: any) {
    this.setState({
      selected_variables: this.state.selected_variables.concat([variable])
    })
    let var_string = `${variable} = data("${variable}"`;
    Object.keys(dimInfo).forEach((item) => {
      var_string += `, ${item}=(${dimInfo[item].min}, ${dimInfo[item].max})`
    })
    var_string += ')'
    this.props.inject(var_string);
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
      let plotString = `canvas.clear()\ncanvas.plot(${this.state.selected_variables.join(
        ", "
      )}, ${gm}, ${temp})`;
      this.props.inject(plotString);
    }
  }
  render() {
    let GraphicsMenuProps = {
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable()
    };
    let VarMenuProps = {
      filePath: this.props.filePath,
      loadVariable: this.updateVarOptions
    };
    let TemplateMenuProps = {
      updateTemplate: () => {}
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
              style={btnStyle}
              onClick={this.plot}
              disabled={this.state.plotReady}
            >
              Plot
            </Button>
            <Button
              type="button"
              color="primary"
              style={btnStyle}
              onClick={this.plot}
              disabled={this.state.plotReady}
            >
              Save Image
            </Button>
            <Button
              type="button"
              color="primary"
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
