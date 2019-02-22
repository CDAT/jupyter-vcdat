// Dependencies
import * as React from "react";
import { Button, Card, CardBody } from "reactstrap";
// Project Components
import { notebook_utils } from "../notebook_utils";
import { MAX_SLABS, VARIABLES_LOADED_KEY } from "../constants";
import VarMenu from "./VarMenu";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";
import AxisInfo from "./AxisInfo";

const btnStyle: React.CSSProperties = {
  margin: "5px"
};
const divStyle: React.CSSProperties = {
  overflow: "scroll"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

export type VCSMenuProps = {
  inject: any; // a method to inject code into the controllers notebook
  commands: any; // the command executor
  notebook_panel: any;
  plotReady: boolean;
  updateVariables: any; // function that updates the variables list in the main widget
  updateSelectedVariables: any; // function that updates the selected variables in main widget
};
type VCSMenuState = {
  plotReady: boolean; // are we ready to plot
  variables: Array<Variable>; // All the variables, loaded from files and derived by users
  selectedVariables: Array<string>; // Unique names of all the variables that are currently selected
  selected_gm: string;
  selected_gm_group: string;
  selected_template: string;
  notebook_panel: any;
};

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  varMenuRef: VarMenu;
  graphicsMenuRef: GraphicsMenu;
  templateMenuRef: TemplateMenu;
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      plotReady: this.props.plotReady,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selected_gm: "",
      selected_gm_group: "",
      selected_template: "",
      notebook_panel: this.props.notebook_panel
    };
    this.varMenuRef = (React as any).createRef();

    this.update = this.update.bind(this);
    this.plot = this.plot.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.updatePlotReady = this.updatePlotReady.bind(this);
    this.updateLoadedVariables = this.updateLoadedVariables.bind(this);
    this.updateSelectedVariables = this.updateSelectedVariables.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
  }

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
  async loadVariable(variable: Variable): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        console.log(
          `Loading variable with name: ${variable.name} and ID: ${
            variable.cdmsID
          }`
        );

        console.log(variable);
        // inject the code to load the variable into the notebook
        let var_string = `${variable.name} = data("${variable.cdmsID}"`;
        variable.axisInfo.forEach((axis: AxisInfo) => {
          var_string += `, ${axis.name}=(${axis.min}, ${axis.max})`;
        });
        var_string += ")";
        this.props.inject(var_string);
        notebook_utils
          .getMetaData(this.state.notebook_panel, VARIABLES_LOADED_KEY)
          .then((res: any) => {
            // if no variables are stored in the metadata, save the new one
            if (res == null) {
              let varArray = new Array<Variable>();
              varArray.push(variable);
              notebook_utils
                .setMetaData(
                  this.state.notebook_panel,
                  VARIABLES_LOADED_KEY,
                  varArray
                )
                .then((res: any) => {
                  console.log(`Meta-data loaded: `);
                  console.log(res);
                });
            } else {
              // if there are already variables stored but this one isnt present then save it
              let newVariableArray = res.slice();
              let found: boolean = false;
              res.forEach((storedVar: Variable, varIndex: number) => {
                if (storedVar.name == variable.name) {
                  newVariableArray[varIndex] = variable;
                  found = true;
                }
              });
              if (!found) {
                newVariableArray.push(variable);
              }
              notebook_utils.setMetaData(
                this.state.notebook_panel,
                VARIABLES_LOADED_KEY,
                newVariableArray
              );
            }
            console.log("Loaded and saved variable.");
            resolve();
          })
          .catch(error => {
            console.log(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  updateTemplateOptions() {}

  updatePlotReady(value: boolean) {
    this.setState({ plotReady: value });

    this.graphicsMenuRef.setState({ plotReady: value });
    this.templateMenuRef.setState({ plotReady: value });
  }

  /**
   * @description given the variable, graphics method, and template selected by the user, run the plot method
   */
  plot() {
    if (this.state.selectedVariables.length == 0) {
      alert("Please select a variable from the left panel");
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
      let selection: Array<string> = this.state.selectedVariables;

      if (selection.length > MAX_SLABS) {
        selection = selection.slice(0, MAX_SLABS);
      }
      selection.forEach(variableName => {
        plotString += variableName + ", ";
      });
      plotString += `${gm}, ${temp})`;
      this.props.inject(plotString);
    }
  }

  save() {
    let response: string | null = prompt(
      "Please enter the name to save the plot as."
    );
    if (response == null || response == "") {
      alert("Injection cancelled.");
    } else {
      this.props.inject(`canvas.png('${response}')`);
    }
  }

  clear() {
    this.props.inject("canvas.clear()");
  }

  /**
   * @description Launch the file browser, and then load variables from a file after its been selected
   * @param file_path the path of the file to load variables from
   */
  async launchVarSelect(variables: Array<Variable>) {
    await this.varMenuRef.launchVarLoader(variables);
  }

  updateLoadedVariables(variables: Array<Variable>) {
    this.setState({ variables: variables });
    this.varMenuRef.setState({ variables: variables });
    this.varMenuRef.varLoaderRef.setState({ variables: variables });
    this.props.updateVariables(variables);
  }

  /**
   * @description Adds a list of variables to the selectedVariables list after checking that they're not already there
   * @param selection the list of variables to add to the selectedVariables list
   */
  async updateSelectedVariables(selection: Array<string>): Promise<any> {
    this.props.updateSelectedVariables(selection);
    await Promise.all([
      this.setState({ selectedVariables: selection }),
      this.varMenuRef.setState({ selectedVariables: selection })
    ]);
  }

  render() {
    let GraphicsMenuProps = {
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable(),
      plotReady: this.state.plotReady
    };
    let VarMenuProps = {
      commands: this.props.commands,
      loadVariable: this.loadVariable,
      variables: this.state.variables,
      selectedVariables: this.state.selectedVariables,
      updateVariables: this.updateLoadedVariables,
      updateSelectedVariables: this.updateSelectedVariables
    };
    let TemplateMenuProps = {
      plotReady: this.state.plotReady,
      updateTemplate: () => {} //TODO: this
    };

    return (
      <div style={centered}>
        <Card>
          <CardBody>
            <div style={centered}>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.plot}
                disabled={!this.state.plotReady}
              >
                Plot
              </Button>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.save}
                disabled={!this.state.plotReady}
              >
                Save
              </Button>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.clear}
                disabled={!this.state.plotReady}
              >
                Clear
              </Button>
            </div>
          </CardBody>
        </Card>
        <VarMenu {...VarMenuProps} ref={loader => (this.varMenuRef = loader)} />
        <GraphicsMenu
          {...GraphicsMenuProps}
          ref={loader => (this.graphicsMenuRef = loader)}
        />
        <TemplateMenu
          {...TemplateMenuProps}
          ref={loader => (this.templateMenuRef = loader)}
        />
      </div>
    );
  }
}

export default VCSMenu;
