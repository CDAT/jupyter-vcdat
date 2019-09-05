// Dependencies
import { JupyterFrontEnd, LabShell, ILabShell } from "@jupyterlab/application";
import {
  NotebookActions,
  NotebookPanel,
  NotebookTracker
} from "@jupyterlab/notebook";

import { ISignal, Signal } from "@phosphor/signaling";
import { CommandRegistry } from "@phosphor/commands";
import { Widget, Title } from "@phosphor/widgets";
import * as React from "react";
import * as ReactDOM from "react-dom";

// Project Components
import CellUtilities from "./CellUtilities";
import CodeInjector from "./CodeInjector";
import ErrorBoundary from "./components/ErrorBoundary";
import PopUpModal from "./components/PopUpModal";
import Variable from "./components/Variable";
import VCSMenu from "./components/VCSMenu";
import {
  BASE_GRAPHICS,
  BASE_TEMPLATES,
  CANVAS_CELL_KEY,
  IMPORT_CELL_KEY,
  NO_VERSION,
  NOTEBOOK_STATE,
  OLD_VCDAT_VERSION,
  VCDAT_VERSION,
  VCDAT_VERSION_KEY,
  DISPLAY_MODE
} from "./constants";
import NotebookUtilities from "./NotebookUtilities";
import Utilities from "./Utilities";
import VariableTracker from "./VariableTracker";
import {
  CHECK_PLOT_EXIST_CMD,
  CHECK_VCS_CMD,
  REFRESH_GRAPHICS_CMD,
  REFRESH_TEMPLATES_CMD
} from "./PythonCommands";
import AboutVCDAT from "./components/AboutVCDAT";
import { ICellModel } from "@jupyterlab/cells";

/**
 * This is the main component for the vcdat extension.
 */
export default class LeftSideBarWidget extends Widget {
  // =======GETTERS AND SETTERS=======
  public get plotReady(): boolean {
    return (
      this.state === NOTEBOOK_STATE.VCS_Ready ||
      this.state === NOTEBOOK_STATE.InitialCellsReady
    );
  }

  public get plotReadyChanged(): ISignal<this, boolean> {
    return this._plotReadyChanged;
  }

  public get plotExists(): boolean {
    return this._plotExists;
  }

  public get plotExistsChanged(): ISignal<this, boolean> {
    return this._plotExistsChanged;
  }

  public get state(): NOTEBOOK_STATE {
    return this._state;
  }

  public set state(notebookState: NOTEBOOK_STATE) {
    this._state = notebookState;
    const plotReady: boolean =
      this._state === NOTEBOOK_STATE.VCS_Ready ||
      this._state === NOTEBOOK_STATE.InitialCellsReady;
    this._plotReadyChanged.emit(plotReady);
  }

  public get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }
  public div: HTMLDivElement; // The div container for this widget
  public version: string; // The VCDAT version for tracking versions between notebooks
  private commands: CommandRegistry; // Jupyter app CommandRegistry
  private labShell: LabShell; // Jupyter lab shell
  private notebookTracker: NotebookTracker; // This is to track current notebooks
  private application: JupyterFrontEnd; // The JupyterLab application object
  private vcsMenuRef: VCSMenu; // the LeftSidebar component
  private loadingModalRef: PopUpModal;
  private aboutRef: AboutVCDAT;
  private graphicsMethods: any; // The current available graphics methods
  private templatesList: string[]; // The list of current templates
  private codeInjector: CodeInjector; // The code injector object which is responsible for injecting code into notebooks
  private varTracker: VariableTracker; // The variable tracker
  private _plotExists: boolean; // True if there exists a plot that can be exported, false if not.
  private _plotExistsChanged: Signal<this, boolean>; // Signal if a plot exists
  private _plotReadyChanged: Signal<this, boolean>;
  private kernels: string[]; // A list containing kernel id's indicating the kernel is vcs_ready
  private _notebookPanel: NotebookPanel; // The notebook this widget is interacting with
  private _state: NOTEBOOK_STATE; // Keeps track of the current state of the notebook in the sidebar widget
  private preparing: boolean; // Whether the notebook is currently being prepared

  constructor(
    app: JupyterFrontEnd,
    labShell: LabShell,
    tracker: NotebookTracker
  ) {
    super();
    this.version = OLD_VCDAT_VERSION;
    this.application = app;
    this.labShell = labShell;
    this.notebookTracker = tracker;
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.commands = app.commands;
    this._state = NOTEBOOK_STATE.Unknown;
    this._plotReadyChanged = new Signal<this, boolean>(this);
    this._plotExistsChanged = new Signal<this, boolean>(this);
    this.varTracker = new VariableTracker();
    this.codeInjector = new CodeInjector(this.varTracker);
    this._notebookPanel = null;
    this.graphicsMethods = BASE_GRAPHICS;
    this.templatesList = BASE_TEMPLATES;
    this.kernels = [];
    this._plotExists = false;
    this.initialize = this.initialize.bind(this);
    this.setNotebookPanel = this.setNotebookPanel.bind(this);
    this.updateNotebookState = this.updateNotebookState.bind(this);
    this.handleNotebookChanged = this.handleNotebookChanged.bind(this);
    this.handleNotebookDisposed = this.handleNotebookDisposed.bind(this);
    this.handleNotebookRenamed = this.handleNotebookRenamed.bind(this);
    this.handleNotebookCellRun = this.handleNotebookCellRun.bind(this);
    this.refreshGraphicsList = this.refreshGraphicsList.bind(this);
    this.checkVCS = this.checkVCS.bind(this);
    this.checkPlotExists = this.checkPlotExists.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.prepareNotebookPanel = this.prepareNotebookPanel.bind(this);
    this.recognizeNotebookPanel = this.recognizeNotebookPanel.bind(this);
    this.updateActiveSidecar = this.updateActiveSidecar.bind(this);
    this.getLeftSidecars = this.getLeftSidecars.bind(this);
    this.getRightSidecars = this.getRightSidecars.bind(this);
    this.toggleSidecarPanel = this.toggleSidecarPanel.bind(this);
    this.setPlotExists = this.setPlotExists.bind(this);
    this.vcsMenuRef = (React as any).createRef();
    this.loadingModalRef = (React as any).createRef();
    this.aboutRef = (React as any).createRef();
    ReactDOM.render(
      <ErrorBoundary>
        <VCSMenu
          application={this.application}
          ref={loader => (this.vcsMenuRef = loader)}
          commands={this.commands}
          codeInjector={this.codeInjector}
          varTracker={this.varTracker}
          plotReady={this.plotReady}
          plotReadyChanged={this.plotReadyChanged}
          plotExists={this.plotExists}
          plotExistsChanged={this.plotExistsChanged}
          setPlotExists={this.setPlotExists}
          syncNotebook={this.syncNotebook}
          getGraphicsList={this.getGraphics}
          getTemplatesList={this.getTemplates}
          refreshGraphicsList={this.refreshGraphicsList}
          notebookPanel={this._notebookPanel}
          updateNotebookPanel={this.recognizeNotebookPanel}
          handleDisplayModeChange={this.toggleSidecarPanel}
        />
        <PopUpModal
          title="Notice"
          message="Loading CDAT core modules. Please wait..."
          btnText="OK"
          ref={loader => (this.loadingModalRef = loader)}
        />
        <AboutVCDAT
          version={VCDAT_VERSION}
          ref={loader => (this.aboutRef = loader)}
        />
      </ErrorBoundary>,
      this.div
    );

    // Add command to refresh the filebrowser
    this.commands.addCommand("vcdat:refresh-browser", {
      execute: args => {
        this.commands.execute("filebrowser:go-to-path", { path: "." });
      }
    });

    // Add command that displays the 'About' dialog
    app.commands.addCommand("vcdat-show-about", {
      caption: "See the VCDAT about page.",
      execute: () => {
        this.aboutRef.show();
      },
      label: "About VCDAT"
    });
  }

  // =======PROPS FUNCTIONS=======
  public async delay(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public syncNotebook = () => {
    return (
      !this.preparing &&
      (this.state === NOTEBOOK_STATE.ActiveNotebook ||
        this.state === NOTEBOOK_STATE.InitialCellsReady)
    );
  };

  public getGraphics = () => {
    return this.graphicsMethods;
  };

  public getTemplates = () => {
    return this.templatesList;
  };

  public setPlotExists(plotExists: boolean): void {
    this._plotExists = plotExists;
    this._plotExistsChanged.emit(plotExists);

    if (plotExists) {
      this.updateActiveSidecar();
    }
  }

  // =======ASYNC SETTER FUNCTIONS=======

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  public async setNotebookPanel(notebookPanel: NotebookPanel): Promise<void> {
    try {
      // Exit early if no change needed
      if (this._notebookPanel === notebookPanel) {
        // Update current state
        await this.updateNotebookState();
        return;
      }

      // Disconnect handlers from previous notebook_panel (if exists)
      if (this._notebookPanel) {
        // NotebookActions.executed.disconnect(this.handleNotebookCellRun);
        this._notebookPanel.disposed.disconnect(this.handleNotebookDisposed);
      }

      // Update current notebook
      this._notebookPanel = notebookPanel;

      await this.vcsMenuRef.setState({
        notebookPanel
      });

      // Update notebook state
      await this.updateNotebookState();

      // Update notebook in code injection manager
      await this.codeInjector.setNotebook(notebookPanel);
      await this.varTracker.setNotebook(notebookPanel);

      // Reset the UI components
      await this.vcsMenuRef.resetState();

      // Check if notebook is ready for vcs, and prepare it if so
      if (
        this.state === NOTEBOOK_STATE.VCS_Ready ||
        this.state === NOTEBOOK_STATE.InitialCellsReady
      ) {
        // Run cells to make notebook vcs ready
        if (this.state === NOTEBOOK_STATE.InitialCellsReady) {
          // Run the imports cell
          const [idx, cell] = CellUtilities.findCellWithMetaKey(
            this._notebookPanel,
            IMPORT_CELL_KEY
          );
          if (idx >= 0) {
            await CellUtilities.runCellAtIndex(this._notebookPanel, idx);
            // select next cell
            this.notebookPanel.content.activeCellIndex = idx + 1;
            // Update kernel list to identify this kernel is ready
            this.kernels.push(this.notebookPanel.session.kernel.id);
            // Update state
            this.state = NOTEBOOK_STATE.VCS_Ready;
          } else {
            this.state = NOTEBOOK_STATE.ActiveNotebook;
            // Leave notebook alone if its not vcs ready, refresh var list for UI
            await this.varTracker.refreshVariables();
            this.varTracker.currentFile = "";
            this.setPlotExists(false);
            return;
          }
        }

        // Update the selected graphics method, variable list, templates and loaded variables
        await this.refreshGraphicsList();
        await this.refreshTemplatesList();
        await this.varTracker.refreshVariables();

        this.vcsMenuRef.getGraphicsSelections();
        this.vcsMenuRef.getTemplateSelection();

        // Update whether a plot exists
        const plotExists = await this.checkPlotExists();
        this.setPlotExists(plotExists);

        // Connect signals for the notebook
        this.notebookPanel.disposed.connect(this.handleNotebookDisposed, this);
        this.notebookPanel.title.changed.connect(
          this.handleNotebookRenamed,
          this
        );
      } else {
        // Leave notebook alone if its not vcs ready, refresh var list for UI
        await this.varTracker.refreshVariables();

        this.varTracker.currentFile = "";
        this.setPlotExists(false);
      }
    } catch (error) {
      if (error.status === "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when setting the notebook panel."
        );
      }
    }
  }

  // =======WIDGET MAIN FUNCTIONS=======
  /**
   * This initializes the left side bar widget and checks for any open notebooks.
   * The status of the notebook is set and the notebook switching handler is connected.
   */
  public async initialize(): Promise<void> {
    // Notebook tracker will signal when a notebook is changed
    this.notebookTracker.currentChanged.connect(
      this.handleNotebookChanged,
      this
    );

    NotebookActions.executed.connect(this.handleNotebookCellRun, this);

    // Set notebook widget if one is open
    if (this.notebookTracker.currentWidget) {
      await this.setNotebookPanel(this.notebookTracker.currentWidget);
    } else {
      await this.setNotebookPanel(null);
    }
  }

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  /**
   * Prepares the current widget notebook to be a vcsReady notebook. Will create a new one if none exists.
   * @param currentFile The file path to set for the variable loading. If left blank, an error will occur.
   */
  public async recognizeNotebookPanel(): Promise<void> {
    try {
      this.preparing = true;

      // Check the active widget is a notebook panel
      if (this.application.shell.currentWidget instanceof NotebookPanel) {
        await this.setNotebookPanel(this.application.shell.currentWidget);
      } else {
        // There is no active notebook widget
        await this.setNotebookPanel(null);
      }

      // Get notebook state
      await this.updateNotebookState();

      if (
        this.state === NOTEBOOK_STATE.Unknown ||
        this.state === NOTEBOOK_STATE.NoOpenNotebook ||
        this.state === NOTEBOOK_STATE.InactiveNotebook
      ) {
        return;
      }

      // Check the active widget is a notebook panel
      if (this.application.shell.currentWidget instanceof NotebookPanel) {
        await this.setNotebookPanel(this.application.shell.currentWidget);
      } else {
        return;
      }

      // Start load screen
      await this.loadingModalRef.show();

      // Inject the imports
      let currentIdx: number =
        this.notebookPanel.content.model.cells.length - 1;
      await this.codeInjector.injectImportsCode(currentIdx, true);

      // Inject canvas if needed
      const canvasExists: boolean = await this.checkCanvasExists();
      if (!canvasExists) {
        currentIdx = this.notebookPanel.content.model.cells.length - 1;
        await this.codeInjector.injectCanvasCode(currentIdx);
      }

      // Start load screen
      await this.loadingModalRef.hide();

      // Update the selected graphics method, variable list, templates and loaded variables
      await this.refreshGraphicsList();
      await this.refreshTemplatesList();
      await this.varTracker.refreshVariables();

      // Select last cell in notebook
      this.notebookPanel.content.activeCellIndex =
        this.notebookPanel.content.model.cells.length - 1;

      // Update kernel list to identify this kernel is ready
      this.kernels.push(this.notebookPanel.session.kernel.id);

      // Save the notebook
      NotebookUtilities.saveNotebook(this.notebookPanel);

      // Activate current notebook
      this.application.shell.activateById(this.notebookPanel.id);

      this._notebookPanel.disposed.connect(this.handleNotebookDisposed, this);

      this.state = NOTEBOOK_STATE.VCS_Ready;

      this.preparing = false;
    } catch (error) {
      this.preparing = false;
      throw error;
    }
  }

  public async checkVCS(): Promise<boolean> {
    if (!this.notebookPanel) {
      return false;
    }

    // Try to initialize a vcs instant, if error then it's not vcs ready
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      CHECK_VCS_CMD
    );
    if (result === "True") {
      return true;
    }
    return false;
  }

  public async checkCanvasExists(): Promise<boolean> {
    try {
      // Get the list of display elements in the canvas
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        CHECK_PLOT_EXIST_CMD
      );
      return output !== "";
    } catch (error) {
      return false;
    }
  }

  public async checkPlotExists(): Promise<boolean> {
    try {
      if (this.state === NOTEBOOK_STATE.VCS_Ready) {
        // Get the list of display elements in the canvas
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          CHECK_PLOT_EXIST_CMD
        );
        return Utilities.strToArray(output).length > 1;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * This updates the current graphics methods list by sending a command to the kernel directly.
   */
  public async refreshGraphicsList(): Promise<void> {
    if (this.state === NOTEBOOK_STATE.VCS_Ready) {
      // Refresh the graphic methods
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        REFRESH_GRAPHICS_CMD
      );

      // Exit if result is blank
      if (!output) {
        return;
      }

      // Update the list of latest variables and data
      this.graphicsMethods = output
        ? JSON.parse(output.slice(1, output.length - 1))
        : BASE_GRAPHICS;
    } else {
      this.graphicsMethods = BASE_GRAPHICS;
    }
  }

  /**
   * This updates the current templates methods list by sending a command to the kernel directly.
   */
  public async refreshTemplatesList(): Promise<void> {
    try {
      if (this.state === NOTEBOOK_STATE.VCS_Ready) {
        // Refresh the graphic methods
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          REFRESH_TEMPLATES_CMD
        );
        // Update the list of latest variables and data
        this.templatesList = Utilities.strToArray(output);
      } else {
        this.templatesList = BASE_TEMPLATES;
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Will update the state of the widget's current notebook panel.
   * This serves other functions that base their action on the notebook's current state
   */
  public async updateNotebookState(): Promise<void> {
    try {
      // Check whether there is a notebook opened
      if (this.notebookTracker.size > 0) {
        // Check if notebook is active widget
        if (this.notebookPanel instanceof NotebookPanel) {
          // Ensure notebook session is ready before checking for metadata
          await this._notebookPanel.session.ready;
          // Check if there is a kernel listed as vcsReady
          if (
            this.kernels.length > 0 &&
            this.kernels.indexOf(this.notebookPanel.session.kernel.id) >= 0
          ) {
            // Ready kernel identified, so the notebook is ready for injection
            this.state = NOTEBOOK_STATE.VCS_Ready;
          } else {
            // Search for a cell containing the imports key
            const importKeyFound: boolean =
              CellUtilities.findCellWithMetaKey(
                this.notebookPanel,
                IMPORT_CELL_KEY
              )[0] >= 0;

            // Search for a cell containing the canvas variables key
            const canvasKeyFound =
              CellUtilities.findCellWithMetaKey(
                this.notebookPanel,
                CANVAS_CELL_KEY
              )[0] >= 0;

            this.state =
              importKeyFound && canvasKeyFound
                ? NOTEBOOK_STATE.InitialCellsReady
                : NOTEBOOK_STATE.ActiveNotebook;
          }
        } else {
          // No notebook is currently open
          this.state = NOTEBOOK_STATE.InactiveNotebook;
        }
      } else {
        // No notebook is open (tracker was empty)
        this.state = NOTEBOOK_STATE.NoOpenNotebook;
      }
    } catch (error) {
      this.state = NOTEBOOK_STATE.Unknown;
    }
  }

  /**
   * Prepares the current widget notebook to be a vcsReady notebook. Will create a new one if none exists.
   * @param currentFile The file path to set for the variable loading. If left blank, an error will occur.
   */
  public async prepareNotebookPanel(currentFile: string): Promise<void> {
    if (!currentFile) {
      this.state = NOTEBOOK_STATE.Unknown;
      // Reject initilization if no file has been selected
      throw new Error("No file has been set for obtaining variables.");
    }

    this.preparing = true;

    try {
      // Set the current file
      this.varTracker.currentFile = currentFile;

      // Grab a notebook panel
      const newNotebookPanel = await this.getNotebookPanel();

      // Set as current notebook (if not already)
      await this.setNotebookPanel(newNotebookPanel);

      // Start load screen
      await this.loadingModalRef.show();

      // Inject the imports
      let currentIdx: number = 0;
      currentIdx = await this.codeInjector.injectImportsCode();

      // Open the variable launcher modal
      const fileVars: Variable[] = await this.varTracker.getFileVariables(
        currentFile
      );

      // Stop load screen
      await this.loadingModalRef.hide();

      if (fileVars.length > 0) {
        await this.vcsMenuRef.varMenuRef.launchVarLoader(fileVars);
      } else {
        this.varTracker.currentFile = "";
      }

      // Inject canvas(es)
      currentIdx = await this.codeInjector.injectCanvasCode(currentIdx + 1);

      // Select last cell in notebook
      this.notebookPanel.content.activeCellIndex =
        this.notebookPanel.content.model.cells.length - 1;

      // Update kernel list to identify this kernel is ready
      this.kernels.push(this.notebookPanel.session.kernel.id);

      // Save the notebook to preserve the cell metadata, update state
      this.state = NOTEBOOK_STATE.VCS_Ready;

      // Save the notebook
      await NotebookUtilities.saveNotebook(this.notebookPanel);

      // Activate current notebook
      this.application.shell.activateById(this.notebookPanel.id);

      this._notebookPanel.disposed.connect(this.handleNotebookDisposed, this);
    } catch (error) {
      throw error;
    } finally {
      this.preparing = false;
    }
  }

  /**
   * @returns Promise<NotebookPanel> - The widget's current notebookPanel or a new one if none exists.
   */
  public async getNotebookPanel(): Promise<NotebookPanel> {
    if (this.notebookPanel) {
      return this.notebookPanel;
    }

    const newNotebookPanel: NotebookPanel = await NotebookUtilities.createNewNotebook(
      this.commands
    );

    // Save the new notebook's version to its meta data
    await NotebookUtilities.setMetaData(
      newNotebookPanel,
      VCDAT_VERSION_KEY,
      VCDAT_VERSION
    );

    return newNotebookPanel;
  }

  public toggleSidecarPanel(currentMode: DISPLAY_MODE) {
    if (currentMode === DISPLAY_MODE.Notebook) {
      if (this.getRightSidecars().length > 0) {
        this.labShell.expandRight();
      }
    } else {
      this.labShell.collapseRight();
    }
    this.updateActiveSidecar();
  }

  public updateActiveSidecar(): void {
    const widgets = this.getLeftSidecars();
    widgets.concat(this.getRightSidecars());
    if (widgets.length <= 0) {
      return;
    }

    widgets.forEach((widget: Widget) => {
      // Close the widget if it's notebook isn't open
      if (this.closeUneededSidecar(widget)) {
        return;
      }
      // Prevent users from closing sidecar manually
      widget.title.closable = false;

      if (
        this.notebookPanel &&
        this.vcsMenuRef.state.currentDisplayMode === DISPLAY_MODE.Sidecar &&
        widget.title.label === this.notebookPanel.title.label
      ) {
        this.labShell.activateById(widget.id);
      } else {
        this.closeUneededSidecar(widget);
      }
    });
  }

  // Returns true if widget was closed
  public closeUneededSidecar(widget: Widget): boolean {
    // Check if widget has corresponding notebook
    if (widget) {
      // Look for notebook with matching title as sidecar
      const notebookMatch = this.notebookTracker.find(
        (openNotebook: NotebookPanel) => {
          return openNotebook.title.label === widget.title.label;
        }
      );
      // Close sidecar if notebook not found
      if (!notebookMatch) {
        widget.close();
        return true;
      }
      return false;
    }
  }

  public getRightSidecars(): Array<Widget> {
    const rightWidgets = this.labShell.widgets("right");
    const sidecarWidgets = Array<Widget>();

    // Get sidecar widgets from right side
    for (
      let w = rightWidgets.next();
      w !== undefined;
      w = rightWidgets.next()
    ) {
      if (w.hasClass("jupyterlab-sidecar")) {
        sidecarWidgets.push(w);
      }
    }

    return sidecarWidgets;
  }

  public getLeftSidecars(): Array<Widget> {
    const leftWidgets = this.labShell.widgets("left");

    const sidecarWidgets = Array<Widget>();

    // Get sidecar widget from left side
    for (let w = leftWidgets.next(); w !== undefined; w = leftWidgets.next()) {
      if (w.hasClass("jupyterlab-sidecar")) {
        sidecarWidgets.push(w);
        console.log(w.parent.node);
      }
    }

    return sidecarWidgets;
  }

  public removeSidecarCloseX(widgetTab: Element) {
    const sidebarTabs = Array<Element>();
    const widgetTabs = this.application.shell.node.getElementsByClassName(
      "p-TabBar-tab"
    );

    /*console.log(
      this.application.shell.node.getElementsByClassName("p-TabBar-tab")
    );*/

    console.log(widgetTabs);
  }

  // =======WIDGET SIGNAL HANDLERS=======

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  private async handleNotebookChanged(
    tracker: NotebookTracker,
    notebook: NotebookPanel
  ): Promise<void> {
    // Set the current notebook and wait for the session to be ready
    await this.setNotebookPanel(notebook);

    if (notebook) {
      // Update notebook version
      const vcdatVersion: string = await NotebookUtilities.getMetaData(
        notebook,
        VCDAT_VERSION_KEY
      );
      const vcdatReady: ICellModel = CellUtilities.findCellWithMetaKey(
        notebook,
        IMPORT_CELL_KEY
      )[1];
      this.version = vcdatVersion
        ? vcdatVersion
        : vcdatReady
        ? OLD_VCDAT_VERSION
        : NO_VERSION;
    }
  }

  private async handleNotebookDisposed(notebookPanel: NotebookPanel) {
    notebookPanel.disposed.disconnect(this.handleNotebookDisposed);
    this.updateActiveSidecar();
  }

  private handleNotebookRenamed(title: Title<Widget>): void {}

  private async handleNotebookCellRun(): Promise<void> {
    if (this.state !== NOTEBOOK_STATE.VCS_Ready) {
      return;
    }
    try {
      this.refreshGraphicsList();
      this.refreshTemplatesList();
      await this.varTracker.refreshVariables();
      const plotExists = await this.checkPlotExists();
      this.setPlotExists(plotExists);

      // Prevent sidebar from opening unless plot to sidecar is active
      this.toggleSidecarPanel(this.vcsMenuRef.state.currentDisplayMode);
    } catch (error) {
      console.error(error);
    }
  }
}
