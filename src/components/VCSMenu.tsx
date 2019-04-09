// Dependencies
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import * as React from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Col,
  CustomInput,
  Row,
  Spinner
} from "reactstrap";

// Project Components
import Container from "reactstrap/lib/Container";
import {
  CANVAS_DIMENSIONS_CMD,
  GRAPHICS_METHOD_KEY,
  MAX_SLABS,
  TEMPLATE_KEY,
  VARIABLE_SOURCES_KEY,
  VARIABLES_KEY,
  VARIABLES_LOADED_KEY
} from "../constants";
import { NotebookUtilities } from "../NotebookUtilities";
import AxisInfo from "./AxisInfo";
import ExportPlotModal from "./ExportPlotModal";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";
import VarMenu from "./VarMenu";

const btnStyle: React.CSSProperties = {
  width: "100%"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

const sidebarOverflow: React.CSSProperties = {
  maxHeight: "100vh",
  minWidth: "360px",
  overflow: "auto"
};

// The defaults export size to use if the canvas dimensions weren't obtained
const DEFAULT_WIDTH: number = 800;
const DEFAULT_HEIGHT: number = 600;

export interface VCSMenuProps {
  inject: Function; // a method to inject code into the controllers notebook
  commands: CommandRegistry; // the command executor
  notebookPanel: NotebookPanel;
  plotReady: boolean; // The notebook is ready for code injection an plots
  plotExists: boolean; // whether a plot already exists
  plotExistTrue: Function; // sets the widget's plotExist state to true (called by plot function)
  getDataVarList: Function; // A dictionary containing data variable names and associated file
  getGraphicsList: Function; // function that reads the current graphics list
  refreshGraphicsList: Function; // function that refreshes the graphics method list
  getTemplatesList: Function; // function that reads the widget's current template list
  getFileVariables: Function; // Function that reads the current notebook file and retrieves variable data
  updateVariables: Function; // function that updates the variables list in the main widget
  updateNotebookPanel: Function; // Function passed to the var menu
  syncNotebook: Function; // Function passed to the var menu
}
interface VCSMenuState {
  plotReady: boolean; // are we ready to plot
  plotExists: boolean; // whether a plot already exists
  variables: Variable[]; // All the variables, loaded from files and derived by users
  variableSources: { [varName: string]: string }; // Tracks what data reader each variable came from
  selectedVariables: string[]; // Unique names of all the variables that are currently selected
  selectedGM: string;
  selectedGMgroup: string;
  selectedTemplate: string;
  notebookPanel: NotebookPanel;
  isModalOpen: boolean;
  savePlotAlert: boolean;
  exportSuccessAlert: boolean;
  plotName: string;
  plotFormat: string;
  overlayMode: boolean;
}

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  public varMenuRef: VarMenu;
  public graphicsMenuRef: GraphicsMenu;
  public templateMenuRef: TemplateMenu;
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      plotReady: this.props.plotReady,
      plotExists: this.props.plotExists,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: "",
      notebookPanel: this.props.notebookPanel,
      isModalOpen: false,
      savePlotAlert: false,
      exportSuccessAlert: false,
      plotName: "",
      plotFormat: "",
      overlayMode: false,
      variableSources: {}
    };
    this.varMenuRef = (React as any).createRef();
    this.graphicsMenuRef = (React as any).createRef();
    this.plot = this.plot.bind(this);
    this.clear = this.clear.bind(this);
    this.saveNotebook = this.saveNotebook.bind(this);
    this.resetState = this.resetState.bind(this);
    this.getCanvasDimensions = this.getCanvasDimensions.bind(this);
    this.copyGraphicsMethod = this.copyGraphicsMethod.bind(this);
    this.getGraphicsSelections = this.getGraphicsSelections.bind(this);
    this.getVariableSelections = this.getVariableSelections.bind(this);
    this.getTemplateSelection = this.getTemplateSelection.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.launchVarSelect = this.launchVarSelect.bind(this);
    this.updatePlotReady = this.updatePlotReady.bind(this);
    this.updateVariables = this.updateVariables.bind(this);
    this.updateSelectedVariables = this.updateSelectedVariables.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.toggleOverlayMode = this.toggleOverlayMode.bind(this);
    this.exportPlotAlerts = this.exportPlotAlerts.bind(this);
    this.dismissSavePlotSpinnerAlert = this.dismissSavePlotSpinnerAlert.bind(
      this
    );
    this.dismissExportSuccessAlert = this.dismissExportSuccessAlert.bind(this);
    this.setPlotInfo = this.setPlotInfo.bind(this);
  }

  public saveNotebook() {
    this.state.notebookPanel.context.save();
  }

  public setPlotInfo(plotName: string, plotFormat: string) {
    this.setState({ plotName, plotFormat });
  }

  public dismissSavePlotSpinnerAlert() {
    this.setState({ savePlotAlert: false });
  }

  public dismissExportSuccessAlert() {
    this.setState({ exportSuccessAlert: false });
  }

  public exportPlotAlerts() {
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

  public toggleModal() {
    this.setState({ isModalOpen: !this.state.isModalOpen });
  }

  public toggleOverlayMode() {
    this.setState({ overlayMode: !this.state.overlayMode });
  }

  public async resetState() {
    this.varMenuRef.resetVarMenuState();
    this.graphicsMenuRef.resetGraphicsState();
    this.templateMenuRef.resetTemplateMenuState();
    this.setState({
      plotReady: false,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: ""
    });
  }

  public async getCanvasDimensions(): Promise<{
    width: number;
    height: number;
  }> {
    try {
      if (this.state.plotReady) {
        // Check the dimensions of the current canvas object
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.state.notebookPanel,
          CANVAS_DIMENSIONS_CMD
        );
        const dimensions: [number, number] = eval(output);
        return { width: dimensions[0], height: dimensions[1] };
      }
      return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    } catch (error) {
      console.log(error);
      return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    }
  }

  public getVariableSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    const selection: string[] = NotebookUtilities.getMetaDataNow(
      this.state.notebookPanel,
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

  public getGraphicsSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    const gmData: [string, string] = NotebookUtilities.getMetaDataNow(
      this.state.notebookPanel,
      GRAPHICS_METHOD_KEY
    );

    if (gmData == null) {
      // No meta data means fresh notebook, reset the graphics
      this.graphicsMenuRef.resetGraphicsState();
      this.setState({
        selectedGM: "",
        selectedGMgroup: ""
      });
      return;
    }

    // Set state based on meta data from notebook
    this.setState({
      selectedGMgroup: gmData[0],
      selectedGM: gmData[1]
    });
    this.graphicsMenuRef.setState({
      selectedGroup: gmData[0],
      selectedMethod: gmData[1],
      tempGroup: gmData[0]
    });
  }

  public getTemplateSelection(): void {
    // Load the selected template from meta data (if exists)
    const template: string = NotebookUtilities.getMetaDataNow(
      this.state.notebookPanel,
      TEMPLATE_KEY
    );

    // If the data is not null, set the selected graphic method and group
    if (template == null) {
      // No meta data means fresh notebook, reset the graphics
      this.templateMenuRef.resetTemplateMenuState();
      return;
    }
    this.setState({
      selectedTemplate: template
    });
    this.templateMenuRef.setState({
      selectedTemplate: template
    });
  }

  public async copyGraphicsMethod(
    groupName: string,
    methodName: string,
    newName: string
  ): Promise<void> {
    // Check that the method doesn't already exist in the selected group
    if (this.props.getGraphicsList()[groupName].indexOf(newName) >= 0) {
      NotebookUtilities.showMessage(
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
        selectedGMgroup: groupName,
        selectedGM: newName
      });
      // Save selected graphics method to meta data
      NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        GRAPHICS_METHOD_KEY,
        [this.state.selectedGMgroup, this.state.selectedGM]
      );
    });
  }

  /**
   * @description inject code into the notebook loading the graphics method selected by the user
   * @param group the group name that the selected GM came from
   * @param name the specific GM from the group
   */
  public async updateGraphicsOptions(
    group: string,
    name: string
  ): Promise<void> {
    let cmdString: string = "";
    if (name.indexOf(group) < 0) {
      cmdString = `${name}_${group} = vcs.get${group}('${name}')`;
    } else {
      cmdString = `${name} = vcs.get${group}('${name}')`;
    }

    // Attempt code injection
    await this.props.inject(cmdString).then(() => {
      // If successful, update the state
      this.setState({
        selectedGMgroup: group,
        selectedGM: name
      });
      // Save selected graphics method to meta data
      NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        GRAPHICS_METHOD_KEY,
        [this.state.selectedGMgroup, this.state.selectedGM]
      );
    });
  }

  public async updateTemplateOptions(templateName: string): Promise<void> {
    const cmdString: string = `${templateName} = vcs.gettemplate('${templateName}')`;

    // Attempt code injection
    await this.props.inject(cmdString).then(() => {
      // If successful, update the state
      this.setState({
        selectedTemplate: templateName
      });
      // Save selected graphics method to meta data
      NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        TEMPLATE_KEY,
        templateName
      );
    });
  }

  /**
   * @description take a variable and load it into the notebook
   * @param variable The variable to load into the notebook
   */
  public async loadVariable(variable: Variable): Promise<any> {
    // inject the code to load the variable into the notebook
    let cmdString = `${variable.name} = ${variable.sourceName}("${
      variable.name
    }"`;
    variable.axisInfo.forEach((axis: AxisInfo) => {
      cmdString += `, ${axis.name}=(${axis.min}, ${axis.max})`;
    });
    cmdString += ")";
    await this.props.inject(cmdString);

    // Save the source of the variable
    const newSource: { [varName: string]: string } = this.state.variableSources;
    newSource[variable.name] = variable.sourceName;
    this.setState({ variableSources: newSource });
    // Also save to meta data
    await NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      VARIABLE_SOURCES_KEY,
      newSource,
      true
    );

    // Get variables from meta data
    const result: any = await NotebookUtilities.getMetaData(
      this.state.notebookPanel,
      VARIABLES_LOADED_KEY
    );

    // If no variables are stored in the metadata, save the new variable to meta data
    if (result == null) {
      const varArray = new Array<Variable>();
      varArray.push(variable);
      await NotebookUtilities.setMetaDataNow(
        this.state.notebookPanel,
        VARIABLES_LOADED_KEY,
        varArray
      );
    } else {
      // If there are already variables stored but this one isn't present then save it
      const newVariableArray = result.slice();
      let found: boolean = false;
      result.forEach((storedVar: Variable, varIndex: number) => {
        if (storedVar.name == variable.name) {
          newVariableArray[varIndex] = variable;
          found = true;
        }
      });
      if (!found) {
        newVariableArray.push(variable);
      }

      // Update meta data
      await NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        VARIABLES_LOADED_KEY,
        newVariableArray,
        true
      );
    }
  }

  public updatePlotReady(value: boolean): void {
    this.setState({ plotReady: value });
    this.graphicsMenuRef.setState({ plotReady: value });
    this.templateMenuRef.setState({ plotReady: value });
  }

  /**
   * @description given the variable, graphics method, and template selected by the user, run the plot method
   */
  public plot(): void {
    try {
      if (this.state.selectedVariables.length == 0) {
        NotebookUtilities.showMessage(
          "Notice",
          "Please select a variable from the left panel."
        );
      } else {
        // Limit selection to MAX_SLABS
        let selection: string[] = this.state.selectedVariables;
        if (selection.length > MAX_SLABS) {
          selection = selection.slice(0, MAX_SLABS);
          this.updateSelectedVariables(selection);
        }

        let gm: string = this.state.selectedGM;

        if (!gm) {
          if (selection.length > 1) {
            gm = '"vector"';
          } else {
            gm = '"boxfill"';
          }
        } else if (gm.indexOf(this.state.selectedGMgroup) < 0) {
          gm += `_${this.state.selectedGMgroup}`;
        }

        let temp = this.state.selectedTemplate;
        if (temp == null || temp == "") {
          temp = '"default"';
        }

        // Create plot injection string
        let plotString: string = "";
        if (this.state.overlayMode) {
          plotString = "canvas.plot(";
        } else {
          plotString = "canvas.clear()\ncanvas.plot(";
        }

        selection.forEach(variableName => {
          plotString += variableName + ", ";
        });
        plotString += `${temp}, ${gm})`;
        this.props.inject(plotString);
        this.props.plotExistTrue();
      }
    } catch (error) {
      console.log(error);
    }
  }

  public clear(): void {
    this.props.inject("canvas.clear()");
  }

  /**
   * @description Launch the file browser, and then load variables from a file after its been selected
   * @param variables An array of variables to display in the launcher (loaded from a file)
   */
  public async launchVarSelect(variables: Variable[]): Promise<void> {
    await this.varMenuRef.launchVarLoader(variables);
  }

  public updateVariables(variables: Variable[]) {
    this.setState({ variables });
    this.varMenuRef.setState({ variables });
    this.varMenuRef.varLoaderRef.setState({ variables });
    this.props.updateVariables(variables);
  }

  /**
   * @description Adds a list of variables to the selectedVariables list after checking that they're not already there
   * @param selection the list of variables to add to the selectedVariables list
   */
  public async updateSelectedVariables(selection: string[]): Promise<any> {
    // Update meta data
    await NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      VARIABLES_KEY,
      selection
    );
    await Promise.all([
      this.setState({ selectedVariables: selection }),
      this.varMenuRef.setState({ selectedVariables: selection })
    ]);
  }

  public render(): JSX.Element {
    const GraphicsMenuProps = {
      plotReady: this.state.plotReady,
      getGraphicsList: this.props.getGraphicsList,
      updateGraphicsOptions: this.updateGraphicsOptions,
      copyGraphicsMethod: this.copyGraphicsMethod,
      varInfo: new Variable()
    };
    const VarMenuProps = {
      commands: this.props.commands,
      loadVariable: this.loadVariable,
      variables: this.state.variables,
      selectedVariables: this.state.selectedVariables,
      updateVariables: this.updateVariables,
      updateSelectedVariables: this.updateSelectedVariables,
      saveNotebook: this.saveNotebook,
      syncNotebook: this.props.syncNotebook,
      updateNotebook: this.props.updateNotebookPanel
    };
    const TemplateMenuProps = {
      plotReady: this.state.plotReady,
      getTemplatesList: this.props.getTemplatesList,
      updateTemplateOptions: this.updateTemplateOptions
    };
    const ExportPlotModalProps = {
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
              <Row>
                <Col sm={3}>
                  <Button
                    type="button"
                    color="primary"
                    style={btnStyle}
                    onClick={this.plot}
                    disabled={!this.state.plotReady}
                    title="Plot the current selected variable(s)."
                  >
                    Plot
                  </Button>
                </Col>
                <Col sm={5} style={{ padding: "0 5px" }}>
                  <Button
                    type="button"
                    color="primary"
                    style={btnStyle}
                    onClick={this.toggleModal}
                    disabled={!this.state.plotReady || !this.state.plotExists}
                    title="Exports the current canvas plot."
                  >
                    Export Plot
                  </Button>
                </Col>
                <Col sm={4}>
                  <Button
                    type="button"
                    color="primary"
                    style={btnStyle}
                    onClick={this.clear}
                    disabled={!this.state.plotReady}
                    title="Clears the canvas."
                  >
                    Clear
                  </Button>
                </Col>
              </Row>
              <CustomInput
                type="switch"
                id="overlayModeSwitch"
                name="overlayModeSwitch"
                label="Overlay Mode"
                disabled={!this.state.plotReady}
                checked={this.state.overlayMode}
                onChange={this.toggleOverlayMode}
              />
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
