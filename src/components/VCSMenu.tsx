// Dependencies
import * as React from "react";
import { Button, Card, CardBody } from "reactstrap";

// Project Components
import { notebook_utils } from "../notebook_utils";
import {
  MAX_SLABS,
  VARIABLES_LOADED_KEY,
  GRAPHICS_METHOD_KEY
} from "../constants";
import VarMenu from "./VarMenu";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";
import AxisInfo from "./AxisInfo";
import { NotebookPanel } from "@jupyterlab/notebook";

const btnStyle: React.CSSProperties = {
  margin: "5px"
};
const divStyle: React.CSSProperties = {
  overflow: "scroll"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

const sidebarOverflow: React.CSSProperties = {
  maxHeight: "100vh",
  minWidth: "375px",
  overflow: "auto"
};

export type VCSMenuProps = {
  inject: Function; // a method to inject code into the controllers notebook
  commands: any; // the command executor
  notebook_panel: NotebookPanel;
  plotReady: boolean;
  getGraphicsList: Function; // function that reads the current graphics list
  refreshGraphicsList: Function; // function that refreshes the graphics method list
  getFileVariables: Function; // Function that reads the current notebook file and retrieves variable data
  loadedVariables: Array<Variable>;
  updateVariables: Function; // function that updates the variables list in the main widget
  updateSelectedVariables: Function; // function that updates the selected variables in main widget
};
type VCSMenuState = {
  plotReady: boolean; // are we ready to plot
  variables: Array<Variable>; // All the variables, loaded from files and derived by users
  selectedVariables: Array<string>; // Unique names of all the variables that are currently selected
  selected_gm: string;
  selected_gm_group: string;
  selected_template: string;
  notebook_panel: NotebookPanel;
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
    this.graphicsMenuRef = (React as any).createRef();
    this.plot = this.plot.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.resetState = this.resetState.bind(this);
    this.copyGraphicsMethod = this.copyGraphicsMethod.bind(this);
    this.editGraphicsMethod = this.editGraphicsMethod.bind(this);
    this.getGraphicsSelections = this.getGraphicsSelections.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.updatePlotReady = this.updatePlotReady.bind(this);
    this.updateLoadedVariables = this.updateLoadedVariables.bind(this);
    this.updateSelectedVariables = this.updateSelectedVariables.bind(this);
  }

  async resetState(): Promise<void> {
    this.graphicsMenuRef.resetGraphicsState();
    this.varMenuRef.setState({ selectedVariables: new Array<string>() });
    this.setState({
      plotReady: false,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selected_gm_group: "",
      selected_gm: "",
      selected_template: ""
    });
  }

  updateLoadedVariables(variables: Array<Variable>): void {
    this.setState({ variables: variables });
    this.varMenuRef.setState({ variables: variables });
    this.varMenuRef.varLoaderRef.setState({ variables: variables });
    this.props.updateVariables(variables);
  }

  getGraphicsSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    let gm_data: [string, string] = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
      GRAPHICS_METHOD_KEY
    );

    // If the data is null, set the selected graphic method and group
    if (gm_data == null) {
      // No meta data means fresh notebook, reset the graphics
      this.graphicsMenuRef.resetGraphicsState();
      return;
    }

    // Set state based on meta data from notebook
    this.setState({
      selected_gm: gm_data[0],
      selected_gm_group: gm_data[1]
    });
    this.graphicsMenuRef.setState({
      selectedGroup: gm_data[0],
      selectedMethod: gm_data[1],
      tempGroup: gm_data[0]
    });
  }

  async copyGraphicsMethod(
    groupName: string,
    methodName: string,
    newName: string
  ): Promise<void> {
    //Check that the method doesn't already exist in the selected group
    if (this.props.getGraphicsList()[groupName].indexOf(newName) >= 0) {
      throw new Error("There is already a graphic method with that name.");
    }

    // If no duplicates, create command injection string
    let command: string = `${newName}_${groupName} = `;
    command += `vcs.create${groupName}('${newName}',source='${methodName}')`;
    // Attempt code injection
    await this.props.inject(command).then(async () => {
      this.props.refreshGraphicsList();
      // If successful, update the current state
      await this.setState({
        selected_gm_group: groupName,
        selected_gm: newName
      });
      // Save selected graphics method to meta data
      notebook_utils.setMetaData(
        this.state.notebook_panel,
        GRAPHICS_METHOD_KEY,
        [this.state.selected_gm_group, this.state.selected_gm]
      );
    });
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
  }

  /**
   * @description take a variable and load it into the notebook
   * @param variable The variable to load into the notebook
   */
  async loadVariable(variable: Variable): Promise<any> {
    return new Promise((resolve, reject) => {
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
            notebook_utils.setMetaData(
              this.state.notebook_panel,
              VARIABLES_LOADED_KEY,
              varArray
            );
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
          resolve();
        });
    });
  }

  updatePlotReady(value: boolean): void {
    this.setState({ plotReady: value });
    this.graphicsMenuRef.setState({ plotReady: value });
    this.templateMenuRef.setState({ plotReady: value });
  }

  /**
   * @description given the variable, graphics method, and template selected by the user, run the plot method
   */
  plot(): void {
    if (this.state.selectedVariables.length == 0) {
      notebook_utils.showMessage(
        "Test",
        "Please select a variable from the left panel"
      );
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

  save(): void {
    let response: string | null = prompt(
      "Please enter the name to save the plot as."
    );
    if (response == null || response == "") {
      notebook_utils.showMessage("Notice", "Injection cancelled.");
    } else {
      this.props.inject(`canvas.png('${response}')`);
    }
  }

  clear(): void {
    this.props.inject("canvas.clear()");
  }

  /**
   * @description Launch the file browser, and then load variables from a file after its been selected
   * @param file_path the path of the file to load variables from
   */
  async launchVarSelect(variables: Array<Variable>): Promise<void> {
    await this.varMenuRef.launchVarLoader(variables);
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

  editGraphicsMethod(): void {}

  render(): JSX.Element {
    let GraphicsMenuProps = {
      getGraphicsList: this.props.getGraphicsList,
      updateGraphicsOptions: this.updateGraphicsOptions,
      editGraphicsMethod: this.editGraphicsMethod,
      copyGraphicsMethod: this.copyGraphicsMethod,
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
      <div style={{ ...centered, ...sidebarOverflow }}>
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
