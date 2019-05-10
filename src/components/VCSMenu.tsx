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
import { CodeInjector } from "../CodeInjector";
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
import ExportPlotModal from "./ExportPlotModal";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import { Variable } from "./Variable";
import VarMenu from "./VarMenu";
import { Utilities } from "../Utilities";

const btnStyle: React.CSSProperties = {
  width: "100%"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

const sidebarOverflow: React.CSSProperties = {
  maxHeight: "100vh",
  minWidth: "365px",
  overflow: "auto"
};

// The defaults export size to use if the canvas dimensions weren't obtained
const DEFAULT_WIDTH: string = "800";
const DEFAULT_HEIGHT: string = "600";

interface IVCSMenuProps {
  commands: CommandRegistry; // the command executor
  notebookPanel: NotebookPanel;
  plotReady: boolean; // The notebook is ready for code injection an plots
  plotExists: boolean; // whether a plot already exists
  plotExistTrue: () => void; // sets the widget's plotExist state to true (called by plot function)
  getGraphicsList: () => any; // function that reads the current graphics list
  refreshGraphicsList: () => Promise<void>; // function that refreshes the graphics method list
  getTemplatesList: () => string[]; // function that reads the widget's current template list
  getFileVariables: (filePath: string) => Promise<Variable[]>; // Function that reads the current notebook file and retrieves variable data
  updateVariables: (variables: Variable[]) => void; // function that updates the variables list in the main widget
  updateNotebookPanel: () => Promise<void>; // Function passed to the var menu
  syncNotebook: () => boolean; // Function passed to the var menu
  codeInjector: CodeInjector;
}
interface IVCSMenuState {
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

export class VCSMenu extends React.Component<IVCSMenuProps, IVCSMenuState> {
  public varMenuRef: VarMenu;
  public graphicsMenuRef: GraphicsMenu;
  public templateMenuRef: TemplateMenu;
  constructor(props: IVCSMenuProps) {
    super(props);
    this.state = {
      exportSuccessAlert: false,
      isModalOpen: false,
      notebookPanel: this.props.notebookPanel,
      overlayMode: false,
      plotExists: this.props.plotExists,
      plotFormat: "",
      plotName: "",
      plotReady: this.props.plotReady,
      savePlotAlert: false,
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: "",
      selectedVariables: Array<string>(),
      variableSources: {},
      variables: Array<Variable>()
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
    this.showExportSuccessAlert = this.showExportSuccessAlert.bind(this);
    this.setPlotInfo = this.setPlotInfo.bind(this);
  }

  public saveNotebook(): void {
    this.state.notebookPanel.context.save();
  }

  public setPlotInfo(plotName: string, plotFormat: string) {
    this.setState({ plotName, plotFormat });
  }

  public dismissSavePlotSpinnerAlert(): void {
    this.setState({ savePlotAlert: false });
  }

  public dismissExportSuccessAlert(): void {
    this.setState({ exportSuccessAlert: false });
  }

  public showExportSuccessAlert(): void {
    this.setState({ exportSuccessAlert: true }, () => {
      window.setTimeout(() => {
        this.setState({ exportSuccessAlert: false });
      }, 5000);
    });
  }

  public exportPlotAlerts(): void {
    this.setState({ savePlotAlert: true });
  }

  public toggleModal(): void {
    this.setState({ isModalOpen: !this.state.isModalOpen });
  }

  public toggleOverlayMode(): void {
    this.setState({ overlayMode: !this.state.overlayMode });
  }

  public async resetState(): Promise<void> {
    this.varMenuRef.resetVarMenuState();
    this.graphicsMenuRef.resetGraphicsState();
    this.templateMenuRef.resetTemplateMenuState();
    this.setState({
      plotReady: false,
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: "",
      selectedVariables: Array<string>(),
      variables: Array<Variable>()
    });
  }

  public async getCanvasDimensions(): Promise<{
    width: string;
    height: string;
  }> {
    try {
      if (this.state.plotReady) {
        // Check the dimensions of the current canvas object
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.state.notebookPanel,
          CANVAS_DIMENSIONS_CMD
        );
        const dimensions: number[] = Utilities.strToArray(output);
        return {
          height: dimensions[1].toString(10),
          width: dimensions[0].toString(10)
        };
      }
      return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    } catch (error) {
      console.error(error);
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
    if (!selection) {
      this.varMenuRef.resetVarMenuState();
      this.setState({
        selectedVariables: Array<string>()
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

    if (!gmData) {
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
      selectedGM: gmData[1],
      selectedGMgroup: gmData[0]
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
    if (!template) {
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
    await this.props.codeInjector.createCopyOfGM(
      newName,
      groupName,
      methodName
    );

    // If successful, update the current state
    await this.setState({
      selectedGM: newName,
      selectedGMgroup: groupName
    });

    await this.props.refreshGraphicsList();

    // Save selected graphics method to meta data
    NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      GRAPHICS_METHOD_KEY,
      [this.state.selectedGMgroup, this.state.selectedGM]
    );
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
    // Attempt code injection
    await this.props.codeInjector.getGraphicMethod(group, name);

    // If successful, update the state
    this.setState({
      selectedGM: name,
      selectedGMgroup: group
    });
    // Save selected graphics method to meta data
    NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      GRAPHICS_METHOD_KEY,
      [this.state.selectedGMgroup, this.state.selectedGM]
    );
  }

  public async updateTemplateOptions(templateName: string): Promise<void> {
    // Attempt code injection
    await this.props.codeInjector.getTemplate(templateName);
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
  }

  /**
   * @description take a variable and load it into the notebook
   * @param variable The variable to load into the notebook
   */
  public async loadVariable(variable: Variable): Promise<any> {
    // inject the code to load the variable into the notebook
    await this.props.codeInjector.loadVariable(variable);

    // Save the source of the variable
    const newSource: { [varName: string]: string } = this.state.variableSources;
    newSource[variable.name] = variable.sourceName;
    this.setState({ variableSources: newSource });
    // Also save source to meta data
    await NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      VARIABLE_SOURCES_KEY,
      newSource,
      true
    );

    let currentVars: Variable[] = this.state.variables;

    // If no variables are in the list, update meta data and variables list
    if (!currentVars || currentVars.length < 1) {
      currentVars = Array<Variable>();
      currentVars.push(variable);
    } else {
      // If there are already variables stored check if variable exists and replace if so
      let found: boolean = false;
      currentVars.forEach((storedVar: Variable, varIndex: number) => {
        if (storedVar.name === variable.name) {
          currentVars[varIndex] = variable;
          found = true;
        }
      });
      if (!found) {
        currentVars.push(variable);
      }
    }

    this.updateVariables(currentVars);
    // Update meta data
    await NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      VARIABLES_LOADED_KEY,
      currentVars,
      true
    );
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
      if (this.state.selectedVariables.length === 0) {
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

        // Inject the plot
        this.props.codeInjector.plot(
          selection,
          this.state.selectedGM,
          this.state.selectedGMgroup,
          this.state.selectedTemplate,
          this.state.overlayMode
        );

        this.props.plotExistTrue();
      }
    } catch (error) {
      console.error(error);
    }
  }

  public clear(): void {
    this.props.codeInjector.clearPlot();
  }

  /**
   * @description Launch the file browser, and then load variables from a file after its been selected
   * @param variables An array of variables to display in the launcher (loaded from a file)
   */
  public async launchVarSelect(variables: Variable[]): Promise<void> {
    await this.varMenuRef.launchVarLoader(variables);
  }

  public async updateVariables(variables: Variable[]): Promise<void> {
    await this.setState({ variables });
    await this.varMenuRef.setState({ variables });
    await this.varMenuRef.varLoaderRef.setState({ variables });
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
    const graphicsMenuProps = {
      copyGraphicsMethod: this.copyGraphicsMethod,
      getGraphicsList: this.props.getGraphicsList,
      plotReady: this.state.plotReady,
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable()
    };
    const varMenuProps = {
      commands: this.props.commands,
      loadVariable: this.loadVariable,
      saveNotebook: this.saveNotebook,
      selectedVariables: this.state.selectedVariables,
      syncNotebook: this.props.syncNotebook,
      updateNotebook: this.props.updateNotebookPanel,
      updateSelectedVariables: this.updateSelectedVariables,
      updateVariables: this.updateVariables,
      variables: this.state.variables
    };
    const templateMenuProps = {
      getTemplatesList: this.props.getTemplatesList,
      plotReady: this.state.plotReady,
      updateTemplateOptions: this.updateTemplateOptions
    };
    const exportPlotModalProps = {
      codeInjector: this.props.codeInjector,
      dismissSavePlotSpinnerAlert: this.dismissSavePlotSpinnerAlert,
      exportAlerts: this.exportPlotAlerts,
      getCanvasDimensions: this.getCanvasDimensions,
      isOpen: this.state.isModalOpen,
      notebookPanel: this.state.notebookPanel,
      setPlotInfo: this.setPlotInfo,
      showExportSuccessAlert: this.showExportSuccessAlert,
      toggle: this.toggleModal
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
        <VarMenu {...varMenuProps} ref={loader => (this.varMenuRef = loader)} />
        <GraphicsMenu
          {...graphicsMenuProps}
          ref={loader => (this.graphicsMenuRef = loader)}
        />
        <TemplateMenu
          {...templateMenuProps}
          ref={loader => (this.templateMenuRef = loader)}
        />
        <ExportPlotModal {...exportPlotModalProps} />
        <div>
          <Alert
            color="info"
            isOpen={this.state.savePlotAlert}
            toggle={this.dismissSavePlotSpinnerAlert}
          >
            {`Saving ${this.state.plotName}.${this.state.plotFormat} ...`}
            <Spinner color="info" />
          </Alert>
          <Alert
            color="primary"
            isOpen={this.state.exportSuccessAlert}
            toggle={this.dismissExportSuccessAlert}
          >
            {`Exported ${this.state.plotName}.${this.state.plotFormat}`}
          </Alert>
        </div>
      </div>
    );
  }
}

export default VCSMenu;
