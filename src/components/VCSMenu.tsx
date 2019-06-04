// Dependencies
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { ISignal } from "@phosphor/signaling";
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
import CodeInjector from "../CodeInjector";
import { GRAPHICS_METHOD_KEY, TEMPLATE_KEY } from "../constants";
import { CANVAS_DIMENSIONS_CMD } from "../PythonCommands";
import NotebookUtilities from "../NotebookUtilities";
import ExportPlotModal from "./ExportPlotModal";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";
import VarMenu from "./VarMenu";
import VariableTracker from "../VariableTracker";
import Utilities from "../Utilities";
import widgets from "../widgets";

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
  plotReadyChanged: ISignal<LeftSideBarWidget, boolean>;
  plotExists: boolean; // whether a plot already exists
  plotExistsChanged: ISignal<LeftSideBarWidget, boolean>;
  setPlotExists: (value: boolean) => void; // sets the widget's plotExist state to true (called by plot function)
  getGraphicsList: () => any; // function that reads the current graphics list
  refreshGraphicsList: () => Promise<void>; // function that refreshes the graphics method list
  getTemplatesList: () => string[]; // function that reads the widget's current template list
  updateNotebookPanel: () => Promise<void>; // Function passed to the var menu
  syncNotebook: () => boolean; // Function passed to the var menu
  codeInjector: CodeInjector;
  varTracker: VariableTracker;
}
interface IVCSMenuState {
  variables: Variable[]; // All the variables, loaded from files and derived by users
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
  plotReady: boolean;
  plotExists: boolean;
}

export default class VCSMenu extends React.Component<
  IVCSMenuProps,
  IVCSMenuState
> {
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
      variables: this.props.varTracker.variables
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
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.toggleOverlayMode = this.toggleOverlayMode.bind(this);
    this.exportPlotAlerts = this.exportPlotAlerts.bind(this);
    this.dismissSavePlotSpinnerAlert = this.dismissSavePlotSpinnerAlert.bind(
      this
    );
    this.dismissExportSuccessAlert = this.dismissExportSuccessAlert.bind(this);
    this.showExportSuccessAlert = this.showExportSuccessAlert.bind(this);
    this.setPlotInfo = this.setPlotInfo.bind(this);
    this.saveNotebook = this.saveNotebook.bind(this);
    this.handleVariablesChanged = this.handleVariablesChanged.bind(this);
    this.handlePlotReadyChanged = this.handlePlotReadyChanged.bind(this);
    this.handlePlotExistsChanged = this.handlePlotExistsChanged.bind(this);
  }

  public componentDidMount(): void {
    this.props.plotReadyChanged.connect(this.handlePlotReadyChanged);
    this.props.plotExistsChanged.connect(this.handlePlotExistsChanged);
    this.props.varTracker.variablesChanged.connect(this.handleVariablesChanged);
  }

  public componentWillUnmount(): void {
    this.props.plotReadyChanged.disconnect(this.handlePlotReadyChanged);
    this.props.plotExistsChanged.disconnect(this.handlePlotExistsChanged);
    this.props.varTracker.variablesChanged.disconnect(
      this.handleVariablesChanged
    );
  }

  public setPlotInfo(plotName: string, plotFormat: string) {
    this.setState({ plotName, plotFormat });
  }

  public dismissSavePlotSpinnerAlert(): void {
    this.setState({ savePlotAlert: false });
    this.props.commands.execute("vcs:refresh-browser");
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

  public saveNotebook() {
    NotebookUtilities.saveNotebook(this.props.notebookPanel);
  }

  public async resetState(): Promise<void> {
    this.graphicsMenuRef.resetGraphicsState();
    this.templateMenuRef.resetTemplateMenuState();
    this.setState({
      overlayMode: false,
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: ""
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
    await NotebookUtilities.setMetaData(
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
    await NotebookUtilities.setMetaData(
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
   * @description given the variable, graphics method, and template selected by the user, run the plot method
   */
  public plot(): void {
    try {
      if (this.props.varTracker.selectedVariables.length === 0) {
        NotebookUtilities.showMessage(
          "Notice",
          "Please select a variable from the left panel."
        );
      } else {
        // Inject the plot
        this.props.codeInjector.plot(
          this.state.selectedGM,
          this.state.selectedGMgroup,
          this.state.selectedTemplate,
          this.state.overlayMode
        );
        this.props.setPlotExists(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  public clear(): void {
    this.props.codeInjector.clearPlot();
  }

  public render(): JSX.Element {
    const graphicsMenuProps = {
      copyGraphicsMethod: this.copyGraphicsMethod,
      getGraphicsList: this.props.getGraphicsList,
      plotReady: this.state.plotReady,
      plotReadyChanged: this.props.plotReadyChanged,
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable()
    };
    const varMenuProps = {
      codeInjector: this.props.codeInjector,
      commands: this.props.commands,
      dismissSavePlotSpinnerAlert: this.dismissSavePlotSpinnerAlert,
      exportAlerts: this.exportPlotAlerts,
      notebookPanel: this.state.notebookPanel,
      saveNotebook: this.saveNotebook,
      setPlotInfo: this.setPlotInfo,
      showExportSuccessAlert: this.showExportSuccessAlert,
      syncNotebook: this.props.syncNotebook,
      updateNotebook: this.props.updateNotebookPanel,
      varTracker: this.props.varTracker
    };
    const templateMenuProps = {
      getTemplatesList: this.props.getTemplatesList,
      plotReady: this.state.plotReady,
      plotReadyChanged: this.props.plotReadyChanged,
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
          <CardBody className={/*@tag<vcsmenu-main>*/ "vcsmenu-main-vcdat"}>
            <div style={centered}>
              <Row>
                <Col sm={3}>
                  <Button
                    className={
                      /*@tag<vcsmenu-plot-btn>*/ "vcsmenu-plot-btn-vcdat"
                    }
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
                    className={
                      /*@tag<vcsmenu-export-btn>*/ "vcsmenu-export-btn-vcdat"
                    }
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
                    className={
                      /*@tag<vcsmenu-clear-btn>*/ "vcsmenu-clear-btn-vcdat"
                    }
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
                id={
                  /*@tag<vcsmenu-overlay-mode-switch>*/ "vcsmenu-overlay-mode-switch-vcdat"
                }
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

  private handlePlotReadyChanged(sidebar: LeftSideBarWidget, value: boolean) {
    this.setState({ plotReady: value });
  }

  private handlePlotExistsChanged(sidebar: LeftSideBarWidget, value: boolean) {
    this.setState({ plotExists: value });
  }

  private handleVariablesChanged(
    varTracker: VariableTracker,
    variables: Variable[]
  ) {
    this.setState({ variables });
  }
}
