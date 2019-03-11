// Dependencies
import * as React from "react";
import { CommandRegistry } from "@phosphor/commands";
import { Alert, Button, Card, CardBody, Spinner } from "reactstrap";

// Project Components
import { notebook_utils } from "../notebook_utils";
import {
  VARIABLES_LOADED_KEY,
  GRAPHICS_METHOD_KEY,
  MAX_SLABS,
  TEMPLATE_KEY,
  VARIABLES_KEY
} from "../constants";
import VarMenu from "./VarMenu";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";
import AxisInfo from "./AxisInfo";
import ExportPlotModal from "./ExportPlotModal";
import { NotebookPanel } from "@jupyterlab/notebook";

const btnStyle: React.CSSProperties = {
  margin: "5px"
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
  commands: CommandRegistry; // the command executor
  notebook_panel: NotebookPanel;
  plotReady: boolean; // The notebook is ready for code injection an plots
  plotExists: boolean; // whether a plot already exists
  getGraphicsList: Function; // function that reads the current graphics list
  refreshGraphicsList: Function; // function that refreshes the graphics method list
  getTemplatesList: Function; // function that reads the widget's current template list
  getFileVariables: Function; // Function that reads the current notebook file and retrieves variable data
  updateVariables: Function; // function that updates the variables list in the main widget
};
type VCSMenuState = {
  plotReady: boolean; // are we ready to plot
  plotExists: boolean; // whether a plot already exists
  variables: Array<Variable>; // All the variables, loaded from files and derived by users
  selectedVariables: Array<string>; // Unique names of all the variables that are currently selected
  selected_gm: string;
  selected_gm_group: string;
  selected_template: string;
  notebook_panel: any;
  isModalOpen: boolean;
  savePlotAlert: boolean;
  exportSuccessAlert: boolean;
  plotName: string;
  plotFormat: string;
};

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  varMenuRef: VarMenu;
  graphicsMenuRef: GraphicsMenu;
  templateMenuRef: TemplateMenu;
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      plotReady: this.props.plotReady,
      plotExists: this.props.plotExists,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selected_gm: "",
      selected_gm_group: "",
      selected_template: "",
      notebook_panel: this.props.notebook_panel,
      isModalOpen: false,
      savePlotAlert: false,
      exportSuccessAlert: false,
      plotName: "",
      plotFormat: ""
    };
    this.varMenuRef = (React as any).createRef();
    this.graphicsMenuRef = (React as any).createRef();
    this.plot = this.plot.bind(this);
    this.clear = this.clear.bind(this);
    this.resetState = this.resetState.bind(this);
    this.getCanvasDimensions = this.getCanvasDimensions.bind(this);
    this.copyGraphicsMethod = this.copyGraphicsMethod.bind(this);
    this.getGraphicsSelections = this.getGraphicsSelections.bind(this);
    this.getTemplateSelection = this.getTemplateSelection.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.updatePlotReady = this.updatePlotReady.bind(this);
    this.updateVariables = this.updateVariables.bind(this);
    this.updateSelectedVariables = this.updateSelectedVariables.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.exportPlotAlerts = this.exportPlotAlerts.bind(this);
    this.dismissSavePlotSpinnerAlert = this.dismissSavePlotSpinnerAlert.bind(
      this
    );
    this.dismissExportSuccessAlert = this.dismissExportSuccessAlert.bind(this);
    this.setPlotInfo = this.setPlotInfo.bind(this);
  }

  update(vars: Array<string>, gms: Array<any>, templates: Array<any>) {
    console.log(vars, gms, templates);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
  }

  setPlotInfo(plotName: string, plotFormat: string) {
    this.setState({ plotName: plotName, plotFormat: plotFormat });
  }

  dismissSavePlotSpinnerAlert() {
    this.setState({ savePlotAlert: false });
  }

  dismissExportSuccessAlert() {
    this.setState({ exportSuccessAlert: false });
  }

  exportPlotAlerts() {
    this.setState({ savePlotAlert: true }, () => {
      window.setTimeout(() => {
        this.setState({ savePlotAlert: false });
        this.setState({ exportSuccessAlert: true }, () => {
          window.setTimeout(() => {
            this.setState({ exportSuccessAlert: false });
          }, 5000);
        });
      }, 5000);
    });
  }

  toggleModal() {
    this.setState(prevState => ({
      isModalOpen: !prevState.isModalOpen
    }));
  }

  async resetState() {
    this.varMenuRef.resetVarMenuState();
    this.graphicsMenuRef.resetGraphicsState();
    this.templateMenuRef.resetTemplateMenuState();
    this.setState({
      plotReady: false,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selected_gm: "",
      selected_gm_group: "",
      selected_template: ""
    });
  }

  async getCanvasDimensions(): Promise<{ width: number; height: number }> {
    try {
      // Check the dimensions of the current canvas object
      let output: string = await notebook_utils.sendSimpleKernelRequest(
        this.state.notebook_panel,
        "output=[canvas.width,canvas.height]"
      );
      let dimensions: [number, number] = eval(output);
      return { width: dimensions[0], height: dimensions[1] };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  getVariableSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    let selection: Array<string> = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
      VARIABLES_KEY
    );

    // No meta data means fresh notebook with no selections
    if (selection == null) {
      this.varMenuRef.resetVarMenuState();
      this.setState({
        selectedVariables: new Array<string>()
      });
      return;
    }

    // Set state based on meta data from notebook
    this.setState({ selectedVariables: selection });
    this.varMenuRef.setState({ selectedVariables: selection });
  }

  getGraphicsSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    let gm_data: [string, string] = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
      GRAPHICS_METHOD_KEY
    );

    if (gm_data == null) {
      // No meta data means fresh notebook, reset the graphics
      this.graphicsMenuRef.resetGraphicsState();
      this.setState({
        selected_gm: "",
        selected_gm_group: ""
      });
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

  getTemplateSelection(): void {
    // Load the selected template from meta data (if exists)
    let template: string = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
      TEMPLATE_KEY
    );

    // If the data is not null, set the selected graphic method and group
    if (template == null) {
      // No meta data means fresh notebook, reset the graphics
      this.templateMenuRef.resetTemplateMenuState();
      return;
    }
    this.setState({
      selected_template: template
    });
    this.templateMenuRef.setState({
      selectedTemplate: template
    });
  }

  async copyGraphicsMethod(
    groupName: string,
    methodName: string,
    newName: string
  ): Promise<void> {
    //Check that the method doesn't already exist in the selected group
    if (this.props.getGraphicsList()[groupName].indexOf(newName) >= 0) {
      notebook_utils.showMessage(
        "Notice",
        "There is already a graphic method with that name."
      );
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

  async updateTemplateOptions(templateName: string): Promise<void> {
    let cmd_string: string = `${templateName} = vcs.gettemplate('${templateName}')`;

    // Attempt code injection
    await this.props.inject(cmd_string).then(() => {
      // If successful, update the state
      this.setState({
        selected_template: templateName
      });
      // Save selected graphics method to meta data
      notebook_utils.setMetaData(
        this.state.notebook_panel,
        TEMPLATE_KEY,
        templateName
      );
    });
  }

  /**
   * @description take a variable and load it into the notebook
   * @param variable The variable to load into the notebook
   */
  async loadVariable(variable: Variable): Promise<any> {
    // inject the code to load the variable into the notebook
    let var_string = `${variable.name} = data("${variable.cdmsID}"`;
    variable.axisInfo.forEach((axis: AxisInfo) => {
      var_string += `, ${axis.name}=(${axis.min}, ${axis.max})`;
    });
    var_string += ")";
    this.props.inject(var_string);
    // Get variables from meta data
    let res: any = await notebook_utils.getMetaData(
      this.state.notebook_panel,
      VARIABLES_LOADED_KEY
    );

    // If no variables are stored in the metadata, save the new one
    if (res == null) {
      let varArray = new Array<Variable>();
      varArray.push(variable);
      await notebook_utils.setMetaData(
        this.state.notebook_panel,
        VARIABLES_LOADED_KEY,
        varArray
      );
    } else {
      // If there are already variables stored but this one isn't present then save it
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
      // Update meta data
      await notebook_utils.setMetaData(
        this.state.notebook_panel,
        VARIABLES_LOADED_KEY,
        newVariableArray
      );
    }
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
        "Notice",
        "Please select a variable from the left panel"
      );
    } else {
      let gm: string = this.state.selected_gm;
      if (gm.indexOf(this.state.selected_gm_group) < 0) {
        gm += `_${this.state.selected_gm_group}`;
      }

      let temp = this.state.selected_template;
      if (!gm) {
        if (this.state.selectedVariables.length > 1) {
          gm = '"vector"';
          this.setState({ selected_gm: '"vector"' });
        } else {
          gm = '"boxfill"';
          this.setState({ selected_gm: '"boxfill"' });
        }
      }
      if (!temp) {
        temp = '"default"';
      }
      let plotString = "canvas.clear()\ncanvas.plot(";
      let selection: Array<string> = this.state.selectedVariables;

      if (selection.length > MAX_SLABS) {
        selection = selection.slice(0, MAX_SLABS);
        this.updateSelectedVariables(selection);
      }
      selection.forEach(variableName => {
        plotString += variableName + ", ";
      });
      plotString += `${temp}, ${gm})`;
      console.log("plotString:", plotString);
      this.props.inject(plotString);
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

  updateVariables(variables: Array<Variable>) {
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
    // Update meta data
    await notebook_utils.setMetaData(
      this.state.notebook_panel,
      VARIABLES_KEY,
      selection
    );
    await Promise.all([
      this.setState({ selectedVariables: selection }),
      this.varMenuRef.setState({ selectedVariables: selection })
    ]);
  }

  render(): JSX.Element {
    let GraphicsMenuProps = {
      getGraphicsList: this.props.getGraphicsList,
      updateGraphicsOptions: this.updateGraphicsOptions,
      copyGraphicsMethod: this.copyGraphicsMethod,
      varInfo: new Variable(),
      plotReady: this.state.plotReady
    };
    let VarMenuProps = {
      commands: this.props.commands,
      loadVariable: this.loadVariable,
      variables: this.state.variables,
      selectedVariables: this.state.selectedVariables,
      updateVariables: this.updateVariables,
      updateSelectedVariables: this.updateSelectedVariables
    };
    let TemplateMenuProps = {
      plotReady: this.state.plotReady,
      getTemplatesList: this.props.getTemplatesList,
      updateTemplateOptions: this.updateTemplateOptions
    };
    let ExportPlotModalProps = {
      isOpen: this.state.isModalOpen,
      toggle: this.toggleModal,
      inject: this.props.inject,
      exportAlerts: this.exportPlotAlerts,
      setPlotInfo: this.setPlotInfo,
      getCanvasDimensions: this.getCanvasDimensions
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
                onClick={this.toggleModal}
                disabled={!this.state.plotReady || !this.state.plotExists}
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
        <ExportPlotModal {...ExportPlotModalProps} />
        <div>
          <Alert
            color="info"
            isOpen={this.state.savePlotAlert}
            toggle={this.dismissSavePlotSpinnerAlert}
          >
            {"Saving " +
              this.state.plotName +
              "." +
              this.state.plotFormat +
              "  "}
            {"  "}
            <Spinner color="info" />
          </Alert>
          <Alert
            color="primary"
            isOpen={this.state.exportSuccessAlert}
            toggle={this.dismissExportSuccessAlert}
          >
            {"Exported " + this.state.plotName + "." + this.state.plotFormat}
          </Alert>
        </div>
      </div>
    );
  }
}

export default VCSMenu;
