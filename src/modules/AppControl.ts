/* eslint-disable no-underscore-dangle */
import LabControl from "./LabControl";
import VariableTracker from "./NEW_VariableTracker";
import NotebookUtilities from "./Utilities/NotebookUtilities";
import CodeInjector from "./NEW_CodeInjector";
import {
  CANVAS_CELL_KEY,
  GETTING_STARTED,
  IMPORT_CELL_KEY,
  VCDAT_VERSION,
  VCDAT_VERSION_KEY,
} from "./constants";
import { NotebookPanel, NotebookTracker } from "@jupyterlab/notebook";
import { checkCDMS2FileOpens, CHECK_PLOT_EXIST_CMD } from "./PythonCommands";
import Variable from "./types/Variable";
import VCDATWidget, { VCDAT_MODALS } from "../VCDATWidget";
import CellUtilities from "./Utilities/CellUtilities";
import {
  ITutorial,
  ITutorialManager,
  TutorialDefault,
} from "jupyterlab-tutorial";
import { ACTIONS } from "react-joyride";
import { PlotActions } from "./contexts/PlotRedux";
import Utilities from "./Utilities/Utilities";
import { IAppProviderRef } from "./contexts/MainContext";

/**
 * Specifies the states of the Jupyterlab main area tab/notebook
 */
export enum NOTEBOOK_STATE {
  Unknown, // The current state of the notebook is unknown and should be updated.
  NoOpenNotebook, // JupyterLab has no notebook opened
  InactiveNotebook, // No notebook is currently active, but one or more are open
  ActiveNotebook, // There's an active notebook, but needs imports
  InitialCellsReady, // Has imports cell, but they need to be run
  VCSReady, // The notebook is ready for code injection
}

/**
 * Tracks the state of the Control for JupyterLab
 * @arg kernels: An array containing the ids of ready kernels
 * @arg injectionIndex: The cell index within a notebook where code will
 * be injected. 0 injects cell at top of notebook, -1 injects at bottom.
 */
interface IAppState {
  kernels: string[];
  runIndex: number;
  preparing: boolean;
  notebookState: NOTEBOOK_STATE;
  errorLogging: boolean;
}

interface IState {
  aboutOpen: boolean;
}

/**
 *
 */
export default class AppControl {
  private static _instance: AppControl;
  private static _initialized: boolean;
  private _appWidget: VCDATWidget;
  private _state: IAppState;
  private _lab: LabControl;
  private _tutorials: ITutorialManager;
  private _varTracker: VariableTracker;
  private _codeInjector: CodeInjector;

  /** Provide handle to the LabControl instance. */
  static getInstance(): AppControl {
    // Return the instance only if it's initialized
    if (AppControl._initialized) {
      return AppControl._instance;
    }
    throw Error(
      `${AppControl.name} is not initialized. Must initialize first.`
    );
  }

  public static async initialize(
    labControl: LabControl,
    tutorialManager: ITutorialManager,
    mainWidget: VCDATWidget
  ): Promise<AppControl> {
    // Create singleton instance
    const library = new AppControl();
    AppControl._instance = library;
    AppControl._initialized = false;

    // Update the instance objects
    library._lab = labControl;
    library._tutorials = tutorialManager;
    library._appWidget = mainWidget;
    library._varTracker = new VariableTracker();
    library._codeInjector = new CodeInjector(library);

    // Set initial state
    library._state = {
      kernels: [],
      runIndex: 0,
      preparing: false,
      notebookState: NOTEBOOK_STATE.Unknown,
      errorLogging: true,
    };

    // Wait for the app to get started before loading settings
    AppControl._initialized = true;

    // Main widget can now be initialized
    library._appWidget.initialize();

    // Attach main widget once app is restored
    await labControl.frontEnd.restored;
    // Add menu links and commands
    library.createTutorials();
    library.createCommands();
    labControl.attachWidget(mainWidget, "left");
    labControl.shell.activateById(mainWidget.id);

    // Connect to notebook changed event
    labControl.notebookTracker.currentChanged.connect(library.setNotebookPanel);

    return library;
  }

  get mainWidget(): VCDATWidget {
    return AppControl._instance._appWidget;
  }

  get labControl(): LabControl {
    return AppControl._instance._lab;
  }

  get varTracker(): VariableTracker {
    return AppControl._instance._varTracker;
  }

  get codeInjector(): CodeInjector {
    return AppControl._instance._codeInjector;
  }

  get state(): IAppState {
    return AppControl._instance._state;
  }

  /**
   * Get index of the notebook cell where code will be injected/run.
   */
  get runIndex(): number {
    return this.state.runIndex;
  }

  /**
   * Set index of the notebook cell where code will be injected/run.
   */
  set runIndex(index: number) {
    this.state.runIndex = index;
  }

  get notebookPanel(): NotebookPanel {
    return this.labControl.notebookPanel;
  }

  get mainContext(): IAppProviderRef {
    return this.mainWidget.appRef.current;
  }

  public createTutorials(): void {
    // Create a jupyterlab intro tutorial
    const jupyterlabIntro: ITutorial = this._tutorials.createTutorial(
      "jp_intro",
      "Jupyterlab Tutorial: Intro",
      true
    );
    jupyterlabIntro.steps = TutorialDefault.steps;

    const vcdatIntro: ITutorial = this._tutorials.createTutorial(
      "vcdat_intro",
      `VCDAT Tutorial: Introduction`,
      true
    );
    LabControl.getInstance().menu.helpMenu.menu.addItem({ type: "separator" });
    vcdatIntro.steps = GETTING_STARTED;
    vcdatIntro.options.styles.backgroundColor = "#fcffff";
    vcdatIntro.options.styles.primaryColor = "#084f44";
  }

  public createCommands(): void {
    const labControl: LabControl = LabControl.getInstance();
    labControl.addHelpReference(
      "VCS Basic Tutorial",
      "https://cdat.llnl.gov/Jupyter-notebooks/vcs/VCS_Basics/VCS_Basics.html"
    );
    labControl.addHelpReference(
      "CDMS Reference",
      "https://cdms.readthedocs.io/en/latest/"
    );
    labControl.menu.helpMenu.menu.addItem({ type: "separator" });

    labControl.addCommand("vcdat:refresh-browser", (): void => {
      labControl.commands.execute("filebrowser:go-to-path", {
        path: ".",
      });
    });

    // Add 'About' page access in help menu
    labControl.addCommand(
      "vcdat-show-about",
      () => {
        this.mainContext.showModal(VCDAT_MODALS.About);
      },
      "About VCDAT",
      "See the VCDAT about page."
    );
    labControl.addHelpMenuItem("vcdat-show-about");

    // Test commands
    labControl.addCommand(
      "show-file-input",
      () => {
        this.mainContext.showModal(VCDAT_MODALS.FilePathInput);
      },
      "File Input"
    );
    labControl.addHelpMenuItem("show-file-input");

    labControl.addCommand(
      "show-message-popup",
      () => {
        this.mainContext.showModal(VCDAT_MODALS.LoadingModulesNotice);
      },
      "Loading Message"
    );
    labControl.addHelpMenuItem("show-message-popup");

    labControl.addCommand(
      "show-export-plot-popup",
      () => {
        this.mainContext.showModal(VCDAT_MODALS.ExportPlot);
      },
      "Export Plot"
    );
    labControl.addHelpMenuItem("show-export-plot-popup");

    labControl.addCommand(
      "dispose-notebook",
      () => {
        this.labControl.notebookPanel.dispose();
      },
      "Dispose"
    );
    labControl.addHelpMenuItem("dispose-notebook");
  }

  public async checkPlotExists(): Promise<boolean> {
    try {
      if (this.state.notebookState === NOTEBOOK_STATE.VCSReady) {
        // Get the list of display elements in the canvas
        const output: string = await this.labControl.runBackendCode(
          CHECK_PLOT_EXIST_CMD
        );
        return Utilities.strToArray(output).length > 1;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async getNotebookPanel(): Promise<NotebookPanel> {
    if (this.notebookPanel) {
      return this.notebookPanel;
    }

    const newNotebookPanel: NotebookPanel = await this.labControl.createNotebook();

    await this.updateNotebookState();

    // Save the new notebook's version to its meta data
    this.labControl.setMetaData(VCDAT_VERSION_KEY, VCDAT_VERSION);

    // Update notebook state
    this.state.notebookState = NOTEBOOK_STATE.ActiveNotebook;

    return newNotebookPanel;
  }

  public async setNotebookPanel(
    notebookTracker: NotebookTracker,
    notebookPanel: NotebookPanel
  ): Promise<void> {
    try {
      const app = AppControl.getInstance();
      if (!app.notebookPanel) {
        app.mainContext.reset();
        return;
      }
      // Exit early if no change needed
      if (app.notebookPanel === notebookPanel) {
        // Update current state
        await app.updateNotebookState();
        return;
      }

      // Update notebook state
      await app.updateNotebookState();

      // Check if notebook is ready for vcs, and prepare it if so
      if (
        app.state.notebookState === NOTEBOOK_STATE.VCSReady ||
        app.state.notebookState === NOTEBOOK_STATE.InitialCellsReady
      ) {
        // Run cells to make notebook vcs ready
        if (app.state.notebookState === NOTEBOOK_STATE.InitialCellsReady) {
          // Run the imports cell
          const idx = CellUtilities.findCellWithMetaKey(
            app.notebookPanel,
            IMPORT_CELL_KEY
          )[0];
          if (idx >= 0) {
            await CellUtilities.runCellAtIndex(app.notebookPanel, idx);
            // select next cell
            app.notebookPanel.content.activeCellIndex = idx + 1;
            // Update kernel list to identify this kernel is ready
            app.state.kernels.push(
              app.notebookPanel.sessionContext.session.kernel.id
            );
            // Update state
            app.state.notebookState = NOTEBOOK_STATE.VCSReady;
          } else {
            app.state.notebookState = NOTEBOOK_STATE.ActiveNotebook;
            // Leave notebook alone if its not vcs ready, refresh var list for UI
            await app.varTracker.refreshVariables();
            app.varTracker.currentFile = "";
            app.mainContext.dispatch({
              type: "plot",
              action: PlotActions.setPlotExist(false),
            });
            return;
          }
        }

        // Update the selected graphics method, variable list, templates and loaded variables
        // await this.refreshGraphicsList();
        // await this.refreshTemplatesList();
        await app.varTracker.refreshVariables();

        // this.vcsMenuRef.getPlotOptions();
        // this.vcsMenuRef.getGraphicsSelections();
        // this.vcsMenuRef.getTemplateSelection();

        // Update whether a plot exists
        const plotExists = await app.checkPlotExists();
        app.mainContext.dispatch({
          type: "plot",
          action: PlotActions.setPlotExist(plotExists),
        });
      } else {
        // Leave notebook alone if its not vcs ready, refresh var list for UI
        await app.varTracker.refreshVariables();

        app.varTracker.currentFile = "";
        app.mainContext.dispatch({
          type: "plot",
          action: PlotActions.setPlotExist(false),
        });
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

  public async updateNotebookState(): Promise<void> {
    try {
      // Check whether there is a notebook opened
      if (this.labControl.notebookTracker.size > 0) {
        // Check if notebook is active widget
        if (
          this.labControl.notebookTracker.currentWidget instanceof NotebookPanel
        ) {
          // Ensure notebook session is ready before checking for metadata
          await this.labControl.notebookPanel.sessionContext.ready;
          // Check if there is a kernel listed as vcsReady
          if (
            this.state.kernels.length > 0 &&
            this.state.kernels.indexOf(
              this.notebookPanel.sessionContext.session.kernel.id
            ) >= 0
          ) {
            // Ready kernel identified, so the notebook is ready for injection
            this.state.notebookState = NOTEBOOK_STATE.VCSReady;
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

            this.state.notebookState =
              importKeyFound && canvasKeyFound
                ? NOTEBOOK_STATE.InitialCellsReady
                : NOTEBOOK_STATE.ActiveNotebook;
          }
        } else {
          // No notebook is currently open
          this.state.notebookState = NOTEBOOK_STATE.InactiveNotebook;
        }
      } else {
        // No notebook is open (tracker was empty)
        this.state.notebookState = NOTEBOOK_STATE.NoOpenNotebook;
      }
    } catch (error) {
      this.state.notebookState = NOTEBOOK_STATE.Unknown;
    }
  }

  public async prepareNotebookPanel(currentFile: string): Promise<void> {
    if (!currentFile) {
      return;
    }

    this.state.preparing = true;

    try {
      // Check the file can be opened with cdms2
      if (!(await this.tryFilePath(currentFile))) {
        NotebookUtilities.showMessage(
          "Notice",
          "The file could not be opened. Check the path is valid."
        );
        console.error(`File could not be opened: ${currentFile}`);
        return;
      }

      // Set the current file
      this.varTracker.currentFile = currentFile;

      // Grab a notebook panel
      await this.getNotebookPanel();

      // Show load screen
      this.mainContext.showModal(VCDAT_MODALS.LoadingModulesNotice);

      // Inject the imports
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let currentIdx = 0;
      currentIdx = await this.codeInjector.injectImportsCode(-1, true);

      // Open the variable launcher modal
      const fileVars: Variable[] = await this.varTracker.getFileVariables(
        currentFile
      );

      // Stop load screen
      this.mainWidget.appRef.current.hideModal();

      // Inject canvas(es)
      currentIdx = await this.codeInjector.injectCanvasCode(currentIdx + 1);

      // Select last cell in notebook
      this.notebookPanel.content.activeCellIndex =
        this.notebookPanel.content.model.cells.length - 1;

      // Update kernel list to identify this kernel is ready
      this.state.kernels.push(
        this.notebookPanel.sessionContext.session.kernel.id
      );

      // Save the notebook to preserve the cell metadata, update state
      this.state.notebookState = NOTEBOOK_STATE.VCSReady;

      // Save the notebook
      await NotebookUtilities.saveNotebook(this.notebookPanel);

      // Activate current notebook
      this.labControl.activateCurrentNotebook();

      // this._notebookPanel.disposed.connect(this.handleNotebookDisposed, this);
    } catch (error) {
      throw error;
    } finally {
      this.state.preparing = false;
    }
  }

  public async tryFilePath(filePath: string): Promise<boolean> {
    try {
      const result = await this.labControl.runBackendCode(
        checkCDMS2FileOpens(filePath),
        false
      );

      return result === "True";
    } catch (error) {
      console.error(error);
    }

    return false;
  }

  /**
   * This is a decorator that causes a function to inject code into the
   * notebook cell at the current runIndex, assuming a notebook is open.
   * The function must return a string (the code to inject).
   * If no notebook is open, injection action will not occur.
   * This will throw an error and log the info to console if injection fails.
   */
  public static codeInjection(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    const originalMethod = descriptor.value;
    descriptor.value = async function (
      ...args: any[]
    ): Promise<[number, string]> {
      const result: string = await originalMethod.apply(this, args);
      console.log(
        `Index run: ${AppControl.getInstance().runIndex}\nResult: ${result}`
      );
      try {
        return await LabControl.getInstance().inject(
          result,
          AppControl.getInstance().runIndex
        );
      } catch (error) {
        if (AppControl.getInstance().state.errorLogging) {
          const argStr = args && args.length > 0 ? `(${args})` : "()";
          const message = `Code Run Error. Function Call: ${propertyKey}${argStr}\n\
          Code Injected: ${result}\nOriginal ${error.stack}`;
          console.error(message);
        }
        NotebookUtilities.showMessage("Command Error", error.message);
        throw new Error(error);
      }
    };
  }

  /**
   * This is a generic code injection function which will run specified code
   * in the cell at specified index. Note that this uses the codeInjection
   * decorator to actually run the injection.
   * @param code A string of code to inject in the cell.
   * @param index The index of the cell to inject code into.
   * Index of -1 will inject code in last notebook cell (default)
   */
  @AppControl.codeInjection
  public injectCode(code: string, index?: number): string {
    if (index && index >= 0) {
      this.runIndex = index; // Set the run index to specified index
      return code; // Return the code to inject for code inject action
    }
    this.runIndex = -1;
    return code;
  }
}
