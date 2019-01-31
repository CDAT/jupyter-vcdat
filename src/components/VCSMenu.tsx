// Dependencies
import * as React from "react";
import { Button, Card, CardBody, Row, Col } from "reactstrap";
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
const centered: React.CSSProperties = {
  margin: "auto"
};

// plotAction: any; // the method to call when the user hits the "Plot" button
// refreshAction: any; // the method to call when the user hits the "refresh" button
// updatePlotOptions: any; // a method to cause the plot options to be updated
export type VCSMenuProps = {
  inject: any; // a method to inject code into the controllers notebook
  file_path: string; // the file path for the selected netCDF file
  commands: any; // the command executor
  plotReady: boolean;
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
  varMenuRef: any;
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      file_path: props.file_path,
      plotReady: props.plotReady,
      selected_variables: new Array<Variable>(),
      selected_gm: "",
      selected_gm_group: "",
      selected_template: ""
    };
    this.varMenuRef = (React as any).createRef();

    this.update = this.update.bind(this);
    this.plot = this.plot.bind(this);
    this.switchNotebook = this.switchNotebook.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.updateVarOptions = this.updateVarOptions.bind(this);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
  }

  switchNotebook() {}

  update(vars: Array<string>, gms: Array<any>, templates: Array<any>) {
    console.log(vars, gms, templates);
  }

  /**
   * @description inject code into the notebook loading the graphics method selected by the user
   * @param group the group name that the selected GM came from
   * @param name the specific GM from the group
   */
  updateGraphicsOptions(group: string, name: string) {
    this.setState({
      selected_gm_group: group,
      selected_gm: `${group}_${name}`
    });
    let gm_string = `${group}_${name} = vcs.get${group}('${name}')`;
    this.props.inject(gm_string);
  }

  /**
   * @description take a variable and load it into the notebook
   * @param variable The variable to load into the notebook
   */
  async updateVarOptions(variable: Variable) {
    let var_string = `${variable.name} = data("${variable.name}"`;
    variable.axisInfo.forEach((axis: any) => {
      var_string += `, ${axis.name}=(${axis.min}, ${axis.max})`;
    });
    var_string += ")";
    await this.props.inject(var_string);
  }

  updateTemplateOptions() {}

  /**
   * @description given the variable, graphics method, and template selected by the user, run the plot method
   */
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

  /**
   * @description Launch the file browser, and then load variables from a file after its been selected
   * @param file_path the path of the file to load variables from
   */
  async launchVarSelect(file_path: string) {
    await this.varMenuRef.getVariablesFromFile();
    this.varMenuRef.launchVarLoader();
  }

  render() {
    let GraphicsMenuProps = {
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable()
    };
    let VarMenuProps = {
      file_path: this.state.file_path,
      vcs_ready: this.state.plotReady,
      loadVariable: this.updateVarOptions,
      commands: this.props.commands
    };
    let TemplateMenuProps = {
      updateTemplate: () => {} //TODO: this
    };

    return (
      <div>
        <VarMenu {...VarMenuProps} ref={loader => (this.varMenuRef = loader)} />
        <GraphicsMenu {...GraphicsMenuProps} />
        <TemplateMenu {...TemplateMenuProps} />
        <Card>
          <CardBody>
            <div style={centered}>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.plot}
                disabled={this.state.plotReady}
              >
                Plot
              </Button>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.plot}
                disabled={this.state.plotReady}
              >
                Save
              </Button>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.plot}
                disabled={this.state.plotReady}
              >
                Clear
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default VCSMenu;
