// Dependencies
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { ISignal } from "@phosphor/signaling";
import * as React from "react";
import { Alert, Button, Card, CardBody, Col, Row, Spinner } from "reactstrap";

// Project Components
import CodeInjector from "../CodeInjector";
import {
  DISPLAY_MODE,
  EXTENSIONS,
  GRAPHICS_METHOD_KEY,
  PLOT_OPTIONS_KEY,
  TEMPLATE_KEY
} from "../constants";
import { CANVAS_DIMENSIONS_CMD } from "../PythonCommands";
import NotebookUtilities from "../NotebookUtilities";
import ExportPlotModal from "./ExportPlotModal";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";
import VarMenu from "./VarMenu";
import InputModal from "./InputModal";
import VariableTracker from "../VariableTracker";
import Utilities from "../Utilities";
import LeftSideBarWidget from "../LeftSideBarWidget";
import { JupyterFrontEnd } from "@jupyterlab/application";
import { AppSettings } from "../AppSettings";
import { boundMethod } from "autobind-decorator";

const btnStyle: React.CSSProperties = {
  width: "100%"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

const sidebarOverflow: React.CSSProperties = {
  height: "calc(100vh - 52px)",
  maxHeight: "100vh",
  minWidth: "370px",
  overflow: "auto"
};

// The defaults export size to use if the canvas dimensions weren't obtained
const DEFAULT_WIDTH: string = "800";
const DEFAULT_HEIGHT: string = "600";

interface IVCSMenuProps {
  application: JupyterFrontEnd;
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
  openSidecarPanel?: (openSidecarPanel: boolean) => void;
  prepareNotebookFromPath: (filepath: string) => Promise<void>;
  codeInjector: CodeInjector;
  varTracker: VariableTracker;
  appSettings: AppSettings;
}
interface IVCSMenuState {
  variables: Variable[]; // All the variables, loaded from files and derived by users
  selectedGM: string;
  selectedGMgroup: string;
  selectedTemplate: string;
  selectedColormap: string;
  colormapHasBeenChanged: boolean;
  notebookPanel: NotebookPanel;
  isModalOpen: boolean;
  savePlotAlert: boolean;
  exportSuccessAlert: boolean;
  plotName: string;
  plotFormat: string;
  overlayMode: boolean;
  plotReady: boolean;
  plotExists: boolean;
  previousDisplayMode: DISPLAY_MODE;
  currentDisplayMode: DISPLAY_MODE;
  shouldAnimate: boolean;
  animationAxisIndex: number,
  animationRate: number,
  animateAxisInvert: boolean
}

export default class VCSMenu extends React.Component<
  IVCSMenuProps,
  IVCSMenuState
> {
  public varMenuRef: VarMenu;
  public graphicsMenuRef: GraphicsMenu;
  public templateMenuRef: TemplateMenu;
  public filePathInputRef: InputModal;
  constructor(props: IVCSMenuProps) {
    super(props);
    this.state = {
      colormapHasBeenChanged: false,
      currentDisplayMode: DISPLAY_MODE.Notebook,
      exportSuccessAlert: false,
      isModalOpen: false,
      notebookPanel: this.props.notebookPanel,
      overlayMode: false,
      plotExists: this.props.plotExists,
      plotFormat: "",
      plotName: "",
      plotReady: this.props.plotReady,
      previousDisplayMode: DISPLAY_MODE.None,
      savePlotAlert: false,
      selectedColormap: "",
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: "",
      variables: this.props.varTracker.variables,
      shouldAnimate: false,
      animationAxisIndex: 0,
      animationRate: 5,
      animateAxisInvert: false
    };
    this.varMenuRef = (React as any).createRef();
    this.graphicsMenuRef = (React as any).createRef();

    this.templateMenuRef = (React as any).createRef();
    this.filePathInputRef = (React as any).createRef();

    // Close sidecar panel at startup
    if (this.props.openSidecarPanel) {
      this.props.openSidecarPanel(false);
    }
  }

  public componentDidMount(): void {
    this.props.plotReadyChanged.connect(this.handlePlotReadyChanged);
    this.props.plotExistsChanged.connect(this.handlePlotExistsChanged);
    this.props.varTracker.variablesChanged.connect(this.handleVariablesChanged);
    this.filePathInputRef.savedOptionsChanged.connect(
      this.handleOptionsChanged
    );
  }

  public componentWillUnmount(): void {
    this.props.plotReadyChanged.disconnect(this.handlePlotReadyChanged);
    this.props.plotExistsChanged.disconnect(this.handlePlotExistsChanged);
    this.props.varTracker.variablesChanged.disconnect(
      this.handleVariablesChanged
    );
  }

  @boundMethod
  public toggleAnimate(): void {
    this.setState({
      shouldAnimate: !this.state.shouldAnimate
    });
  }

  @boundMethod
  public updateAnimateAxisId(axis: number): void {
    this.setState({
      animationAxisIndex: axis
    });
  }

  @boundMethod
  public toggleAnimateAxisInvert(): void {
    this.setState({
      animateAxisInvert: !this.state.animateAxisInvert
    });
  }

  @boundMethod
  public updateAnimateRate(rate: number): void {
    this.setState({
      animationRate: rate
    });
  }


  @boundMethod
  public setPlotInfo(plotName: string, plotFormat: string) {
    this.setState({ plotName, plotFormat });
  }

  @boundMethod
  public dismissSavePlotSpinnerAlert(): void {
    this.setState({ savePlotAlert: false });
    this.props.commands.execute("vcdat:refresh-browser");
  }

  @boundMethod
  public dismissExportSuccessAlert(): void {
    this.setState({ exportSuccessAlert: false });
  }

  @boundMethod
  public showExportSuccessAlert(): void {
    this.setState({ exportSuccessAlert: true }, () => {
      window.setTimeout(() => {
        this.setState({ exportSuccessAlert: false });
      }, 5000);
    });
  }

  @boundMethod
  public showInputModal(): void {
    this.filePathInputRef.show();
  }

  @boundMethod
  public exportPlotAlerts(): void {
    this.setState({ savePlotAlert: true });
  }

  @boundMethod
  public toggleModal(): void {
    this.setState({ isModalOpen: !this.state.isModalOpen });
  }

  @boundMethod
  public async toggleOverlayMode(): Promise<void> {
    await this.setState({ overlayMode: !this.state.overlayMode });

    // Save selection to meta data
    NotebookUtilities.setMetaDataNow(
      this.state.notebookPanel,
      PLOT_OPTIONS_KEY,
      [!this.state.overlayMode, this.state.currentDisplayMode]
    );
  }

  @boundMethod
  public async toggleSidecar(): Promise<void> {
    this.state.currentDisplayMode === DISPLAY_MODE.Notebook
      ? await this.setState({ currentDisplayMode: DISPLAY_MODE.Sidecar })
      : await this.setState({ currentDisplayMode: DISPLAY_MODE.Notebook });
    if (this.props.openSidecarPanel) {
      this.props.openSidecarPanel(
        this.state.currentDisplayMode === DISPLAY_MODE.Sidecar
      );
    }

    // Save selection to meta data
    NotebookUtilities.setMetaDataNow(
      this.state.notebookPanel,
      PLOT_OPTIONS_KEY,
      [this.state.overlayMode, this.state.currentDisplayMode]
    );
  }

  @boundMethod
  public saveNotebook() {
    NotebookUtilities.saveNotebook(this.state.notebookPanel);
  }

  @boundMethod
  public async resetState(): Promise<void> {
    this.graphicsMenuRef.resetGraphicsState();
    this.templateMenuRef.resetTemplateMenuState();
    this.setState({
      currentDisplayMode: DISPLAY_MODE.Notebook,
      overlayMode: false,
      previousDisplayMode: DISPLAY_MODE.None,
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: ""
    });
  }

  @boundMethod
  public async getCanvasDimensions(): Promise<{
    width: string;
    height: string;
  }> {
    try {
      if (this.state.plotReady) {
        // Check the dimensions of the current canvas object
        const output: string = await Utilities.sendSimpleKernelRequest(
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

  @boundMethod
  public getPlotOptions(): void {
    // Load the selected plot options from meta data (if exists)
    const plotOptions: [
      boolean,
      DISPLAY_MODE
    ] = NotebookUtilities.getMetaDataNow(
      this.state.notebookPanel,
      PLOT_OPTIONS_KEY
    );

    if (!plotOptions) {
      // No meta data means fresh notebook, reset options
      this.setState({
        currentDisplayMode: DISPLAY_MODE.Notebook,
        overlayMode: false,
        previousDisplayMode: DISPLAY_MODE.None
      });
      return;
    }

    // Set state based on meta data from notebook
    this.setState({
      currentDisplayMode: plotOptions[1],
      overlayMode: plotOptions[0],
      previousDisplayMode: this.state.currentDisplayMode
    });
  }

  @boundMethod
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

  @boundMethod
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

  @boundMethod
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
  @boundMethod
  public async updateGraphicsOptions(
    group: string,
    name: string
  ): Promise<void> {
    // Attempt code injection
    await this.props.codeInjector.getGraphicMethod(group, name);

    // If successful, update the state
    // If the colormap has previously been set by the user
    //  for their last GM, then set it for this one too
    this.setState(
      {
        selectedGM: name,
        selectedGMgroup: group
      },
      () => {
        if (this.state.colormapHasBeenChanged) {
          this.updateColormap(this.state.selectedColormap);
        }
      }
    );
    // Save selected graphics method to meta data
    await NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      GRAPHICS_METHOD_KEY,
      [this.state.selectedGMgroup, this.state.selectedGM]
    );
  }

  @boundMethod
  public async updateColormap(colormapName: string) {
    this.setState({
      colormapHasBeenChanged: true,
      selectedColormap: colormapName
    });
    await this.props.codeInjector.updateColormapName(
      this.state.selectedGM,
      this.state.selectedGMgroup,
      colormapName
    );
  }

  @boundMethod
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
  @boundMethod
  public async plot(): Promise<void> {
    try {
      if (this.props.varTracker.selectedVariables.length === 0) {
        NotebookUtilities.showMessage(
          "Notice",
          "Please select a variable from the left panel.");
      } else {
        if(this.state.shouldAnimate){
          // Inject the animation code
          await this.props.codeInjector.animate(
            this.state.selectedGM,
            this.state.selectedGMgroup,
            this.state.selectedTemplate,
            this.state.animationAxisIndex,
            this.state.animationRate,
            this.state.animateAxisInvert,
            this.state.selectedColormap)
        } else {
          // Inject the plot
          await this.props.codeInjector.plot(
            this.state.selectedGM,
            this.state.selectedGMgroup,
            this.state.selectedTemplate,
            this.state.overlayMode,
            this.state.previousDisplayMode,
            this.state.currentDisplayMode);
        }
        this.setState({ previousDisplayMode: this.state.currentDisplayMode });
        this.props.setPlotExists(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  @boundMethod
  public clear(): void {
    this.props.codeInjector.clearPlot();
  }

  public render(): JSX.Element {
    const graphicsMenuProps = {
      copyGraphicsMethod: this.copyGraphicsMethod,
      currentDisplayMode: this.state.currentDisplayMode,
      getGraphicsList: this.props.getGraphicsList,
      overlayMode: this.state.overlayMode,
      plotReady: this.state.plotReady,
      plotReadyChanged: this.props.plotReadyChanged,
      toggleOverlayMode: this.toggleOverlayMode,
      toggleSidecar: this.toggleSidecar,
      updateColormap: this.updateColormap,
      updateGraphicsOptions: this.updateGraphicsOptions,
      varInfo: new Variable(),
      toggleAnimate: this.toggleAnimate,
      toggleAnimateInverse: this.toggleAnimateAxisInvert,
      updateAnimateAxis: this.updateAnimateAxisId,
      updateAnimateRate: this.updateAnimateRate,
      varTracker: this.props.varTracker
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
      showInputModal: this.showInputModal,
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

    const inputModalProps = {
      acceptText: "Open File",
      cancelText: "Cancel",
      inputListHeader: "Saved File Paths",
      inputOptions: this.props.appSettings.getSavedPaths(),
      invalidInputMessage:
        "The path entered is not valid. Make sure it contains an appropriate filename.",
      isValid: (input: string): boolean => {
        const ext: string = Utilities.getExtension(input);
        return input.length > 0 && EXTENSIONS.indexOf(`.${ext}`) >= 0;
      },
      message: "Enter the path and name of the file you wish to open.",
      onModalClose: this.props.prepareNotebookFromPath,
      placeHolder: "file_path/file.ext",
      title: "Load Variables from Path"
    };

    return (
      <Card style={{ ...centered, ...sidebarOverflow }}>
        <Card>
          <CardBody className={/*@tag<vcsmenu-main>*/ "vcsmenu-main-vcdat"}>
            <div style={centered}>
              <Row>
                <Col sm={this.state.shouldAnimate ? 5 : 3}>
                  <Button
                    className={
                      /*@tag<vcsmenu-plot-btn>*/ "vcsmenu-plot-btn-vcdat"
                    }
                    type="button"
                    color={this.state.shouldAnimate ? "warning" : "primary"}
                    style={btnStyle}
                    onClick={this.plot}
                    disabled={!this.state.plotReady}
                    title="Animate the selected variable over its selected axis"
                  >
                    {this.state.shouldAnimate ? "Animate" : "Plot"}
                  </Button>
                </Col>
                <Col 
                  sm={this.state.shouldAnimate ? 3 : 5} 
                  style={{ padding: "0 5px" }}>
                  <Button
                    className={
                      /*@tag<vcsmenu-export-btn>*/ "vcsmenu-export-btn-vcdat"
                    }
                    type="button"
                    color="primary"
                    style={btnStyle}
                    onClick={this.toggleModal}
                    disabled={!this.state.plotReady || !this.state.plotExists || this.state.shouldAnimate}
                    title="Exports the current canvas plot."
                  >
                    Export
                  </Button>
                </Col>
                <Col sm={3}>
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
        <InputModal
          {...inputModalProps}
          ref={loader => (this.filePathInputRef = loader)}
        />
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
      </Card>
    );
  }

  @boundMethod
  private handlePlotReadyChanged(sidebar: LeftSideBarWidget, value: boolean) {
    this.setState({ plotReady: value });
  }

  @boundMethod
  private handlePlotExistsChanged(sidebar: LeftSideBarWidget, value: boolean) {
    this.setState({ plotExists: value });
  }

  @boundMethod
  private handleVariablesChanged(
    varTracker: VariableTracker,
    variables: Variable[]
  ) {
    this.setState({ variables });
  }

  @boundMethod
  private async handleOptionsChanged(
    modal: InputModal,
    options: string[]
  ): Promise<void> {
    await this.props.appSettings.setSavedPaths(options);
  }
}
