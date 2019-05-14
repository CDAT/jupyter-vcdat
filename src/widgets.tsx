// Dependencies
import { JupyterLab } from "@jupyterlab/application";
import { IChangedArgs } from "@jupyterlab/coreutils";
import { Notebook, NotebookPanel, NotebookTracker } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { Widget } from "@phosphor/widgets";
import * as React from "react";
import * as ReactDOM from "react-dom";

// Project Components
import { CellUtilities } from "./CellUtilities";
import { CodeInjector } from "./CodeInjector";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Variable } from "./components/Variable";
import { VCSMenu } from "./components/VCSMenu";
import {
  BASE_GRAPHICS,
  BASE_TEMPLATES,
  CANVAS_CELL_KEY,
  CHECK_VCS_CMD,
  IMPORT_CELL_KEY,
  NOTEBOOK_STATE,
  OUTPUT_RESULT_NAME,
  REFRESH_GRAPHICS_CMD,
  REFRESH_TEMPLATES_CMD
} from "./constants";
import { NotebookUtilities } from "./NotebookUtilities";
import { Utilities } from "./Utilities";
import { VariableTracker } from "./VariableTracker";
import { ISignal, Signal } from "@phosphor/signaling";

/**
 * This is the main component for the vcdat extension.
 */
export class LeftSideBarWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public commands: CommandRegistry; // Jupyter app CommandRegistry
  public notebookTracker: NotebookTracker; // This is to track current notebooks
  public application: JupyterLab; // The JupyterLab application object
  public vcsMenuRef: VCSMenu; // the LeftSidebar component
  public graphicsMethods: any; // The current available graphics methods
  public templatesList: string[]; // The list of current templates
  public usingKernel: boolean; // The widgets is running a ker nel command
  public canvasCount: number; // The number of canvases currently in use (just 1 for now)
  public refreshExt: boolean; // Will be false if the app was refreshed
  public codeInjector: CodeInjector; // The code injector object which is responsible for injecting code into notebooks
  public varTracker: VariableTracker; // The variable tracker

  private _plotExists: boolean; // True if there exists a plot that can be exported, false if not.
  private _plotExistsChanged: Signal<this, boolean>; // Signal if a plot exists
  private _plotReadyChanged: Signal<this, boolean>;
  private kernels: string[]; // A list containing kernel id's indicating the kernel is vcs_ready
  private _notebookPanel: NotebookPanel; // The notebook this widget is interacting with
  private _state: NOTEBOOK_STATE; // Keeps track of the current state of the notebook in the sidebar widget
  private preparing: boolean; // Whether the notebook is currently being prepared
  private isBusy: boolean;

  constructor(app: JupyterLab, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.application = app;
    this.commands = app.commands;
    this._state = NOTEBOOK_STATE.Unknown;
    this._plotReadyChanged = new Signal<this, boolean>(this);
    this._plotExistsChanged = new Signal<this, boolean>(this);

    this.varTracker = new VariableTracker();
    this.codeInjector = new CodeInjector(app.commands, this.varTracker);
    this.notebookTracker = tracker;
    this.usingKernel = false;
    this.refreshExt = true;
    this.canvasCount = 0;
    this._notebookPanel = null;
    this.graphicsMethods = BASE_GRAPHICS;
    this.templatesList = BASE_TEMPLATES;
    this.kernels = [];
    this._plotExists = false;
    this.initialize = this.initialize.bind(this);
    this.setNotebookPanel = this.setNotebookPanel.bind(this);
    this.updateNotebookState = this.updateNotebookState.bind(this);
    this.handleNotebookStateChanged = this.handleNotebookStateChanged.bind(
      this
    );
    this.refreshGraphicsList = this.refreshGraphicsList.bind(this);
    this.handleNotebookChanged = this.handleNotebookChanged.bind(this);
    this.checkVCS = this.checkVCS.bind(this);
    this.checkPlotExists = this.checkPlotExists.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.prepareNotebookPanel = this.prepareNotebookPanel.bind(this);
    this.recognizeNotebookPanel = this.recognizeNotebookPanel.bind(this);
    this.setPlotExists = this.setPlotExists.bind(this);

    this.setBusy = this.setBusy.bind(this);
    this.vcsMenuRef = (React as any).createRef();
    ReactDOM.render(
      <ErrorBoundary>
        <VCSMenu
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
        />
      </ErrorBoundary>,
      this.div
    );

    this.commands.addCommand("vcs:load-data", {
      execute: args => {
        this.commands.execute("filebrowser:activate");
      }
    });
  }

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

  // =======PROPS FUNCTIONS=======
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

  public setPlotExists(value: boolean): void {
    this._plotExists = value;
    this._plotExistsChanged.emit(value);
  }

  public setBusy(value: boolean): void {
    this.isBusy = value;
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
        this._notebookPanel.content.stateChanged.disconnect(
          this.handleNotebookStateChanged
        );
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
          // Select the last cell
          this.notebookPanel.content.activeCellIndex =
            this.notebookPanel.content.model.cells.length - 1;
          // Update kernel list to identify this kernel is ready
          this.kernels.push(this.notebookPanel.session.kernel.id);
          // Update state
          this.state = NOTEBOOK_STATE.VCS_Ready;
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

        // Set up notebook's handlers to keep track of notebook status
        this.notebookPanel.content.stateChanged.connect(
          this.handleNotebookStateChanged
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
    // Check the active widget is a notebook panel
    if (this.application.shell.currentWidget instanceof NotebookPanel) {
      await this.setNotebookPanel(this.application.shell.currentWidget);
    } else {
      // There is no active notebook widget
      await this.setNotebookPanel(null);
    }

    // Notebook tracker will signal when a notebook is changed
    this.notebookTracker.currentChanged.connect(this.handleNotebookChanged);
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

      // Connect the handler specific to current notebook
      this._notebookPanel.content.stateChanged.connect(
        this.handleNotebookStateChanged
      );

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
    this.usingKernel = true;
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      CHECK_VCS_CMD
    );
    this.usingKernel = false;
    if (result === "True") {
      return true;
    }
    return false;
  }

  public async checkCanvasExists(): Promise<boolean> {
    try {
      // Get the list of display elements in the canvas
      this.usingKernel = true;
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        `${OUTPUT_RESULT_NAME} = canvas.listelements('display')`
      );
      this.usingKernel = false;
      return true;
    } catch (error) {
      return false;
    }
  }

  public async checkPlotExists(): Promise<boolean> {
    try {
      if (this.state === NOTEBOOK_STATE.VCS_Ready) {
        // Get the list of display elements in the canvas
        this.usingKernel = true;
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          `import json\n${OUTPUT_RESULT_NAME} = json.dumps(canvas.listelements('display'))`
        );
        this.usingKernel = false;
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
      this.usingKernel = true;
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        REFRESH_GRAPHICS_CMD
      );
      this.usingKernel = false;

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
        this.usingKernel = true;
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          REFRESH_TEMPLATES_CMD
        );
        // Update the list of latest variables and data
        this.templatesList = Utilities.strToArray(output);
        this.usingKernel = false;
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

      // Inject the imports
      let currentIdx: number = 0;
      currentIdx = await this.codeInjector.injectImportsCode();

      // Open the variable launcher modal
      const fileVars: Variable[] = await this.varTracker.getFileVariables(
        currentFile
      );

      if (fileVars.length > 0) {
        await this.vcsMenuRef.launchVarSelect(fileVars);
      } else {
        this.varTracker.currentFile = "";
      }

      // Inject the data file(s)
      currentIdx = await this.codeInjector.injectDataReaders(
        currentIdx + 1,
        currentFile
      );

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

      // Connect the handler specific to current notebook
      this._notebookPanel.content.stateChanged.connect(
        this.handleNotebookStateChanged
      );
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
    return NotebookUtilities.createNewNotebook(this.commands);
  }

  // =======WIDGET SIGNAL HANDLERS=======

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  private async handleNotebookChanged(
    tracker: NotebookTracker,
    notebookPanel: NotebookPanel
  ): Promise<void> {
    // Set the current notebook and wait for the session to be ready
    await this.setNotebookPanel(notebookPanel);
  }

  /**
   * This handles when the state of the notebook changes, like when a cell is modified, or run etc.
   * Using this handler, the variable list is refreshed whenever a cell's code is run in a vcs ready
   * notebook.
   */
  private async handleNotebookStateChanged(
    notebook: Notebook,
    stateChange: IChangedArgs<any>
  ): Promise<void> {
    // Perform actions when the notebook state has a command run and the notebook is vcs ready
    if (
      !this.isBusy &&
      !this.codeInjector.isBusy &&
      !this.varTracker.isBusy &&
      this.state === NOTEBOOK_STATE.VCS_Ready &&
      stateChange.newValue !== "edit"
    ) {
      try {
        this.varTracker.refreshVariables();
        // this.varTracker.refreshVariables();
        this.refreshGraphicsList();
        await this.refreshTemplatesList();
        const plotExists = await this.checkPlotExists();
        this.setPlotExists(plotExists);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
