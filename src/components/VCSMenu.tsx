// Dependencies
import * as React from "react";
import { Button, Card, CardBody } from "reactstrap";
// Project Components
import { notebook_utils } from "../notebook_utils";
import { VARIABLES_LOADED_KEY, GRAPHICS_METHOD_KEY } from "../constants";
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

const MAX_SLABS = 2;

// plotAction: any; // the method to call when the user hits the "Plot" button
// refreshAction: any; // the method to call when the user hits the "refresh" button
// updatePlotOptions: any; // a method to cause the plot options to be updated
export type VCSMenuProps = {
  inject: any; // a method to inject code into the controllers notebook
  file_path: string; // the file path for the selected netCDF file
  commands: any; // the command executor
  notebook_panel: any;
  plotReady: boolean;
  getGraphicsList: any; // function that reads the current graphics list
  getFileVariables: any; // Function that reads the current notebook file and retrieves variable data
  loadedVariables: Array<Variable>;
};
type VCSMenuState = {
  file_path: string;
  plotReady: boolean; // are we ready to plot
  selectedVariables: Array<Variable>;
  loadedVariables: Array<Variable>;
  selected_gm: string;
  selected_gm_group: string;
  selected_template: string;
  notebook_panel: any;
};

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  varMenuRef: any;
  graphicsMenuRef: GraphicsMenu;
  templateMenuRef: TemplateMenu;
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      file_path: props.file_path,
      plotReady: this.props.plotReady,
      selectedVariables: this.props.loadedVariables,
      loadedVariables: this.props.loadedVariables,
      selected_gm: "",
      selected_gm_group: "",
      selected_template: "",
      notebook_panel: this.props.notebook_panel
    };
    this.varMenuRef = (React as any).createRef();
    this.graphicsMenuRef = (React as any).createRef();

    this.update = this.update.bind(this);
    this.plot = this.plot.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.resetSelected = this.resetSelected.bind(this);
    this.getGraphicsMetaData = this.getGraphicsMetaData.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.updatePlotReady = this.updatePlotReady.bind(this);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
    this.updateLoadedVariables = this.updateLoadedVariables.bind(this);
    this.updateSelectedVariables = this.updateSelectedVariables.bind(this);
  }

  update(vars: Array<string>, gms: Array<any>, templates: Array<any>) {
    console.log(vars, gms, templates);
  }

  getGraphicsMetaData() {
    // Load the selected graphics method from meta data (if exists)
    let gm_data: [string, string] = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
      GRAPHICS_METHOD_KEY
    );

    // If the data is not null, set the selected graphic method and group
    if (gm_data) {
      this.setState({
        selected_gm: gm_data[0],
        selected_gm_group: gm_data[1]
      });
      this.graphicsMenuRef.setState({
        selectedGroup: gm_data[0],
        selectedMethod: gm_data[1],
        tempGroup: gm_data[0]
      });
      console.log("Graphics selection loaded.");
    } else {
      // No meta data means fresh notebook, reset the graphics
      this.graphicsMenuRef.resetGraphicsState();
    }
  }

  /**
   * @description inject code into the notebook loading the graphics method selected by the user
   * @param group the group name that the selected GM came from
   * @param name the specific GM from the group
   */
  async updateGraphicsOptions(group: string, name: string): Promise<void> {
    let gm_string: string = "";
    if (name.indexOf(group) < 0) {
      gm_string = `${name}_${group} = vcs.get${group}('${name}')`;
    } else {
      gm_string = `${name} = vcs.get${group}('${name}')`;
    }

    // Attempt code injection
    try {
      await this.props.inject(gm_string).then(() => {
        // If successful, update the state
        this.setState({
          selected_gm_group: group,
          selected_gm: name
        });
        // Save selected graphics method to meta data
        notebook_utils.setMetaData(
          this.state.notebook_panel,
          GRAPHICS_METHOD_KEY,
          [this.state.selected_gm_group, this.state.selected_gm]
        );
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description take a variable and load it into the notebook
   * @param variable The variable to load into the notebook
   */
  loadVariable(variable: Variable) {
    return new Promise((resolve, reject) => {
      try {
        // inject the code to load the variable into the notebook
        let var_string = `${variable.name} = data("${variable.name}"`;
        variable.axisInfo.forEach((axis: any) => {
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
            console.log("Loaded variable: ");
            console.log(res);
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
    this.varMenuRef.setState({ plotReady: value });
    this.graphicsMenuRef.setState({ plotReady: value });
    this.templateMenuRef.setState({ plotReady: value });
  }

  /**
   * @description given the variable, graphics method, and template selected by the user, run the plot method
   */
  plot() {
    if (this.state.selectedVariables.length == 0) {
      this.props.inject("# Please select a variable from the left panel");
    } else {
      let gm: string = this.state.selected_gm;
      if (gm.indexOf(this.state.selected_gm_group) < 0) {
        gm += `_${this.state.selected_gm_group}`;
      }

      let temp = this.state.selected_template;
      if (!gm) {
        gm = '"default"';
      }
      if (!temp) {
        temp = '"default"';
      }
      let plotString = "canvas.clear()\ncanvas.plot(";
      let selection: Array<Variable> = this.state.selectedVariables;

      if (selection.length > MAX_SLABS) {
        selection = selection.slice(0, 2);
      }
      selection.forEach(variable => {
        plotString += variable.name + ", ";
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
    await this.varMenuRef.setLoaderVariables(variables);
    this.varMenuRef.launchVarLoader();
  }

  updateLoadedVariables(variables: Array<Variable>) {
    /*let newLoadedVariables = this.state.loadedVariables;
    variables.forEach(variable => {
      if (newLoadedVariables.indexOf(variable) == -1) {
        newLoadedVariables.push(variable);
      }
    });*/
    this.setState({
      loadedVariables: variables,
      selectedVariables: this.state.selectedVariables.concat(variables)
    });
    this.varMenuRef.setState({
      loadedVariables: variables,
      showMenu: true
    });
  }

  async resetSelected() {
    // Nothing selected
    console.log("Nothing selected");
    await this.setState({ selectedVariables: new Array<Variable>() });
    await this.varMenuRef.setSelected(new Array<Variable>());
  }

  /**
   * @description Adds a list of variables to the selectedVariables list after checking that they're not already there
   * @param variables the list of variables to add to the selectedVariables list
   */
  updateSelectedVariables(variables: Array<Variable>) {
    // let newSelectedVariables = this.state.selectedVariables.slice();
    // variables.forEach((variable: Variable) => {
    //   if (newSelectedVariables.indexOf(variable) == -1) {
    //     newSelectedVariables.push(variable);
    //   }
    // });

    // this.setState({
    //   selectedVariables: newSelectedVariables
    // });
    console.log(variables);
    this.setState({
      selectedVariables: variables
    });
  }

  render() {
    let GraphicsMenuProps = {
      getGraphicsList: this.props.getGraphicsList,
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable(),
      plotReady: this.state.plotReady
    };
    let VarMenuProps = {
      file_path: this.state.file_path,
      getFileVariables: this.props.getFileVariables,
      loadedVariables: this.state.loadedVariables,
      loadVariable: this.loadVariable,
      commands: this.props.commands,
      updateSelected: this.updateSelectedVariables
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
