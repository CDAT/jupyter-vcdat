// Dependencies
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Widget } from "@phosphor/widgets";
import { JupyterLab } from "@jupyterlab/application";
import { IChangedArgs } from "@jupyterlab/coreutils";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { NotebookTracker, NotebookPanel, Notebook } from "@jupyterlab/notebook";

// Project Components
import {
  FILE_PATH_KEY,
  IMPORT_CELL_KEY,
  CHECK_MODULES_CMD,
  REQUIRED_MODULES,
  GET_FILE_VARIABLES,
  VARIABLES_LOADED_KEY,
  NOTEBOOK_STATE,
  REFRESH_GRAPHICS_CMD,
  BASE_GRAPHICS,
  REFRESH_TEMPLATES_CMD,
  BASE_TEMPLATES,
  REFRESH_VAR_INFO_A,
  REFRESH_VAR_INFO_B
} from "./constants";
import { VCSMenu } from "./components/VCSMenu";
import { NotebookUtilities } from "./NotebookUtilities";
import { CellUtilities } from "./CellUtilities";
import Variable from "./components/Variable";
import AxisInfo from "./components/AxisInfo";

/**
 * This is the main component for the vcdat extension.
 */
export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebookTracker: NotebookTracker; // This is to track current notebooks
  application: JupyterLab; //The JupyterLab application object
  VCSMenuRef: VCSMenu; // the LeftSidebar component
  variableData: Array<Variable>; // An array containing information about the variables
  graphicsMethods: any; // The current available graphics methods
  templatesList: Array<string>; // The list of current templates
  usingKernel: boolean; // The widgets is running a ker nel command

  private _readyKernels: string[]; // A list containing kernel id's indicating the kernel is vcs_ready
  private _currentFile: string; // The current filepath of the data file being used for variables and data
  private _notebookPanel: NotebookPanel; // The notebook this widget is interacting with
  private _state: NOTEBOOK_STATE; // Keeps track of the current state of the notebook in the sidebar widget

  constructor(app: JupyterLab, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.application = app;
    this.commands = app.commands;
    this.notebookTracker = tracker;
    this._state = NOTEBOOK_STATE.Unknown;
    this.usingKernel = false;
    this._currentFile = "";
    this._notebookPanel = null;
    this.variableData = new Array<Variable>();
    this.graphicsMethods = BASE_GRAPHICS;
    this.templatesList = BASE_TEMPLATES;
    this._readyKernels = [];
    this.initialize = this.initialize.bind(this);
    this.refreshVarList = this.refreshVarList.bind(this);
    this.setCurrentFile = this.setCurrentFile.bind(this);
    this.setNotebookPanel = this.setNotebookPanel.bind(this);
    this.updateNotebookState = this.updateNotebookState.bind(this);
    this.handleStateChanged = this.handleStateChanged.bind(this);
    this.refreshGraphicsList = this.refreshGraphicsList.bind(this);
    this.getFileVariables = this.getFileVariables.bind(this);
    this.handleNotebooksChanged = this.handleNotebooksChanged.bind(this);
    this.inject = this.inject.bind(this);
    this.injectAndDisplay = this.injectAndDisplay.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.injectRequiredCode = this.injectRequiredCode.bind(this);
    this.prepareNotebookPanel = this.prepareNotebookPanel.bind(this);
    this.VCSMenuRef = (React as any).createRef();
    ReactDOM.render(
      <ErrorBoundary>
        <VCSMenu
          ref={loader => (this.VCSMenuRef = loader)}
          commands={this.commands}
          inject={this.inject}
          plotReady={this.state == NOTEBOOK_STATE.VCS_Ready}
          getFileVariables={this.getFileVariables}
          getGraphicsList={() => {
            return this.graphicsMethods;
          }}
          getTemplatesList={() => {
            return this.templatesList;
          }}
          updateVariables={(variables: Array<Variable>) => {
            this.variableData = variables;
          }}
          refreshGraphicsList={this.refreshGraphicsList}
          notebookPanel={this._notebookPanel}
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

  //=======GETTERS AND SETTERS=======
  public get state(): NOTEBOOK_STATE {
    return this._state;
  }

  public set state(notebookState: NOTEBOOK_STATE) {
    this._state = notebookState;

    if (notebookState == NOTEBOOK_STATE.VCS_Ready) {
      this.VCSMenuRef.updatePlotReady(true);
    } else {
      this.VCSMenuRef.updatePlotReady(false);
    }
  }

  public get currentFile(): string {
    return this._currentFile;
  }

  public get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }

  //=======ASYNC SETTER FUNCTIONS=======

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  async setNotebookPanel(notebookPanel: NotebookPanel): Promise<void> {
    try {
      this.VCSMenuRef.setState({
        notebookPanel: notebookPanel
      });

      //Exit early if no change needed
      if (this._notebookPanel == notebookPanel) {
        return;
      }

      // Disconnect handlers from previous notebook_panel (if exists)
      if (this._notebookPanel) {
        this._notebookPanel.content.stateChanged.disconnect(
          this.handleStateChanged
        );
      }

      // Update current notebook
      this._notebookPanel = notebookPanel;

      // Reset the UI components
      await this.VCSMenuRef.resetState();

      // Update notebook state
      await this.updateNotebookState();

      // Check if notebook is ready for vcs, and prepare it if so
      if (
        this.state == NOTEBOOK_STATE.VCS_Ready ||
        this.state == NOTEBOOK_STATE.ImportsReady
      ) {
        // Update current file
        let lastFileOpened: string | null = await NotebookUtilities.getMetaData(
          notebookPanel,
          FILE_PATH_KEY
        );
        if (lastFileOpened) {
          await this.setCurrentFile(lastFileOpened, false);
        } else {
          await this.setCurrentFile("", false);
        }

        // Run imports if cell isn't vcs ready, to make it vcs ready
        if (this.state == NOTEBOOK_STATE.ImportsReady) {
          // Get cell containing the imports key
          let importsCell = CellUtilities.findCellWithMetaKey(
            this.notebookPanel.content,
            IMPORT_CELL_KEY
          );
          if (importsCell[0] >= 0) {
            // If found, run the imports code
            await NotebookUtilities.sendSimpleKernelRequest(
              this.notebookPanel,
              importsCell[1].value.text,
              false
            );
            // Select the last cell
            this.notebookPanel.content.activeCellIndex =
              this.notebookPanel.content.model.cells.length - 1;

            // Update kernel list to identify this kernel is ready
            this._readyKernels.push(this.notebookPanel.session.kernel.id);
            // Update state
            this.state = NOTEBOOK_STATE.VCS_Ready;
          }
        }

        // Update the selected graphics method, variable list, templates and loaded variables
        await this.refreshGraphicsList();
        await this.refreshTemplatesList();
        await this.refreshVarList();

        this.VCSMenuRef.getVariableSelections();
        this.VCSMenuRef.getGraphicsSelections();
        this.VCSMenuRef.getTemplateSelection();

        // Set up notebook's handlers to keep track of notebook status
        this.notebookPanel.content.stateChanged.connect(
          this.handleStateChanged
        );
      } else {
        // Leave notebook alone if its not vcs ready, refresh var list for UI
        await this.refreshVarList();
        this.setCurrentFile("", false);
      }
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when setting the notebook panel."
        );
      }
    }
  }

  /**
   * Updates the widget's current filepath which is used to load variables.
   * @param filePath The new file path to set
   * @param save Whether the file path should be saved to the notebook's meta data.
   */
  async setCurrentFile(filePath: string, save: boolean): Promise<void> {
    this._currentFile = filePath;
    // If notebook panel exists, set the notebook meta data to store current file path
    if (this.notebookPanel && save) {
      // Ensure notebook session is ready before setting metadata
      await this.notebookPanel.session.ready;
      await NotebookUtilities.setMetaDataNow(
        this.notebookPanel,
        FILE_PATH_KEY,
        filePath
      );
      // Update component, no variable retrieval
      let result = NotebookUtilities.getMetaDataNow(
        this.notebookPanel,
        VARIABLES_LOADED_KEY
      );
      if (result) {
        this.VCSMenuRef.updateVariables(result);
      } else {
        let fileVars = await this.getFileVariables(filePath);
        if (fileVars.length > 0) {
          await this.VCSMenuRef.launchVarSelect(fileVars);
        } else {
          this._currentFile = "";
        }
      }

      // Save the notebook to preserve the cell metadata
      await this.notebookPanel.context.save();
    }
    await this.refreshVarList();
  }

  //=======WIDGET SIGNAL HANDLERS=======

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  async handleNotebooksChanged(
    tracker: NotebookTracker,
    notebookPanel: NotebookPanel
  ): Promise<void> {
    // Set the current notebook and wait for the session to be ready
    await this.setNotebookPanel(notebookPanel);
  }

  /** This handles when the state of the notebook changes, like when a cell is modified, or run etc.
   *  Using this handler, the variable list is refreshed whenever a cell's code is run in a vcs ready
   * notebook.
   */
  async handleStateChanged(
    notebook: Notebook,
    stateChange: IChangedArgs<any>
  ): Promise<void> {
    // Perform actions when the notebook state has a command run and the notebook is vcs ready
    if (
      this.state == NOTEBOOK_STATE.VCS_Ready &&
      stateChange.newValue == "command"
    ) {
      this.refreshVarList();
      this.refreshGraphicsList();
      this.refreshTemplatesList();
    }
  }

  //=======WIDGET COMPONENT METHODS (FOR PROPS)=======

  /**
   * Injects code into the bottom cell of the notebook, doesn't display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns Promise<[number, string]> - A promise for when the cell code has executed containing
   * the cell's index and output result
   */
  async inject(code: string): Promise<[number, string]> {
    try {
      let result = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        this.notebookPanel.content.model.cells.length - 1,
        code,
        true
      );
      this.notebookPanel.content.activeCellIndex = result[0] + 1;
      this.notebookPanel.context.save();
      return result;
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when injecting the code."
        );
      }
    }
  }

  /**
   * Injects code into the bottom cell of the notebook, and WILL display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns any - Results from running the code.
   */
  async injectAndDisplay(code: string): Promise<any> {
    try {
      let result: any = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        this.notebookPanel.content.model.cells.length,
        code,
        false
      );
      this.notebookPanel.context.save();
      return result;
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when injecting the code."
        );
      }
    }
  }

  //=======WIDGET MAIN FUNCTIONS=======

  /**
   * This initializes the left side bar widget and checks for any open notebooks.
   * The status of the notebook is set and the notebook switching handler is connected.
   */
  async initialize(): Promise<void> {
    // Check the active widget is a notebook panel
    if (this.application.shell.currentWidget instanceof NotebookPanel) {
      await this.setNotebookPanel(this.application.shell.currentWidget);
    } else {
      // There is no active notebook widget
      await this.setNotebookPanel(null);
    }

    // Notebook tracker will signal when a notebook is changed
    this.notebookTracker.currentChanged.connect(this.handleNotebooksChanged);
  }

  /**
   * This updates the current graphics methods list by sending a command to the kernel directly.
   */
  async refreshGraphicsList(): Promise<void> {
    if (this.state == NOTEBOOK_STATE.VCS_Ready) {
      //Refresh the graphic methods
      this.usingKernel = true;
      let output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        REFRESH_GRAPHICS_CMD
      );
      //Update the list of latest variables and data
      this.graphicsMethods = JSON.parse(output.slice(1, output.length - 1));
      this.usingKernel = false;
    } else {
      this.graphicsMethods = BASE_GRAPHICS;
    }
  }

  /**
   * This updates the current templates methods list by sending a command to the kernel directly.
   */
  async refreshTemplatesList(): Promise<void> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready) {
        //Refresh the graphic methods
        this.usingKernel = true;
        let output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          REFRESH_TEMPLATES_CMD
        );
        //Update the list of latest variables and data
        this.templatesList = eval(output);
        this.usingKernel = false;
      } else {
        this.templatesList = BASE_TEMPLATES;
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * This updates the current variable list by sending a command to the kernel directly.
   */
  async refreshVarList(): Promise<void> {
    if (this.state == NOTEBOOK_STATE.VCS_Ready && this.currentFile != "") {
      this.usingKernel = true;
      // Open the file reader first
      let result: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        REFRESH_VAR_INFO_A +
          `reader = cdms2.open('${this.currentFile}')` +
          REFRESH_VAR_INFO_B
      );
      this.usingKernel = false;
      // Parse the resulting output into an object
      let variableAxes: any = JSON.parse(result.slice(1, result.length - 1));
      let newVars = new Array<Variable>();
      Object.keys(variableAxes.vars).map((item: string) => {
        let v = new Variable();
        v.name = item;
        v.cdmsID = variableAxes.vars[item].cdmsID;
        v.longName = variableAxes.vars[item].name;
        v.axisList = variableAxes.vars[item].axisList;
        v.axisInfo = new Array<AxisInfo>();
        variableAxes.vars[item].axisList.map((item: any) => {
          variableAxes.axes[item].min = variableAxes.axes[item].data[0];
          variableAxes.axes[item].max =
            variableAxes.axes[item].data[
              variableAxes.axes[item].data.length - 1
            ];
          v.axisInfo.push(variableAxes.axes[item]);
        });
        v.units = variableAxes.vars[item].units;

        newVars.push(v);
      });
      this.VCSMenuRef.updateVariables(newVars);
    } else {
      this.VCSMenuRef.updateVariables(new Array<Variable>());
    }
  }

  /**
   * Opens a '.nc' file to read in it's variables via a kernel request.
   * @param filePath The file to open for variable reading
   * @returns Promise<Array<Variable>> -- A promise contianing an array of variables
   * that were found in the file.
   */
  async getFileVariables(filePath: string): Promise<Array<Variable>> {
    if (filePath != "") {
      // Open the file reader first
      await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        `import cdms2\nreader = cdms2.open('${filePath}')`
      );
      // Get file variables
      let result: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        GET_FILE_VARIABLES
      );

      // Parse the resulting output into an object
      let variableAxes: any = JSON.parse(result.slice(1, result.length - 1));
      let newVars = new Array<Variable>();
      Object.keys(variableAxes.vars).map((item: string) => {
        let v = new Variable();
        v.name = item;
        v.cdmsID = variableAxes.vars[item].cdmsID; // Loaded variables have same cdmsName
        v.longName = variableAxes.vars[item].name;
        v.axisList = variableAxes.vars[item].axisList;
        v.axisInfo = new Array<AxisInfo>();
        variableAxes.vars[item].axisList.map((item: any) => {
          variableAxes.axes[item].min = variableAxes.axes[item].data[0];
          variableAxes.axes[item].max =
            variableAxes.axes[item].data[
              variableAxes.axes[item].data.length - 1
            ];
          v.axisInfo.push(variableAxes.axes[item]);
        });
        v.units = variableAxes.vars[item].units;
        newVars.push(v);
      });
      return newVars;
    } else {
      return new Array<Variable>();
    }
  }

  /**
   * Will update the state of the widget's current notebook panel.
   * This serves other functions that base their action on the notebook's current state
   */
  async updateNotebookState(): Promise<void> {
    try {
      // Check whether there is a notebook opened
      if (this.notebookTracker.size > 0) {
        // Check if notebook is active widget
        if (this.notebookPanel instanceof NotebookPanel) {
          // Ensure notebook session is ready before checking for metadata
          await this._notebookPanel.session.ready;
          // Check if there is a kernel listed as vcs_ready
          if (
            this._readyKernels.length > 0 &&
            this._readyKernels.indexOf(this.notebookPanel.session.kernel.id) >=
              0
          ) {
            // Ready kernel identified, so the notebook is ready for injection
            this.state = NOTEBOOK_STATE.VCS_Ready;
          } else {
            // Search for a cell containing the imports key
            let find = CellUtilities.findCellWithMetaKey(
              this.notebookPanel.content,
              IMPORT_CELL_KEY
            );
            if (find[0] >= 0) {
              // The imports cell was found, but wasn't run yet
              this.state = NOTEBOOK_STATE.ImportsReady;
            } else {
              // No import cell was found, but the notebook is active
              this.state = NOTEBOOK_STATE.ActiveNotebook;
            }
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
   * This will construct an import string for the notebook based on the modules passed to it.
   * @param modules An array of strings representing the modules to include in the import command.
   * @param lazy Whether to use lazy imports syntax when making the command. Will include lazy_imports
   * if it is needed.
   */
  buildImportCommand(modules: string[], lazy: boolean): string {
    let cmd: string = "";
    //Check for lazy_imports modules first
    let tmpModules = modules;
    let idx = modules.indexOf("lazy_import");

    if (lazy) {
      // Import lazy_imports if it's missing, before doing other imports
      if (idx >= 0) {
        tmpModules.splice(idx, 1);
        cmd = "import lazy_import";
      }
      // Import other modules using lazy import syntax
      tmpModules.forEach(module => {
        cmd += `\n${module} = lazy_import.lazy_module("${module}")`;
      });
    } else {
      // Remove lazy_imports from required modules if it is there
      if (idx >= 0) {
        tmpModules.splice(idx, 1);
      }
      // Import modules
      tmpModules.forEach(module => {
        cmd += `\nimport ${module}`;
      });
    }
    return cmd;
  }

  /**
   * This will inject the required modules into the current notebook (if a module was not already imported)
   * @param skip Default false. If set to true, a check of the kernel will be made to see if the modules are already
   * imported and any that are will be skipped (not added) in the import statements of the required code.
   */
  async injectRequiredCode(skip: boolean = false): Promise<number> {
    // Check if required modules are imported in notebook
    try {
      let cmd =
        "#These imports are required for vcdat. To avoid issues, do not delete or modify.\n";

      if (skip) {
        // Check if necessary modules are loaded
        let output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          CHECK_MODULES_CMD
        );

        // Create import string based on missing dependencies
        let missingModules: string[] = eval(output);
        cmd += this.buildImportCommand(missingModules, true);
      } else {
        cmd += this.buildImportCommand(eval(`[${REQUIRED_MODULES}]`), true);
      }

      // Inject imports in a new cell
      let result: [number, string] = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        -1,
        cmd,
        true
      );

      // Run code that creates a canvas and opens the current selected .nc file
      cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${this.currentFile}\")`;
      CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        result[0] + 1,
        cmd,
        true
      );

      // Select the last cell
      this.notebookPanel.content.activeCellIndex =
        this.notebookPanel.content.model.cells.length - 1;

      // Update kernel list to identify this kernel is ready
      this._readyKernels.push(this.notebookPanel.session.kernel.id);

      // Save the notebook to preserve the cell metadata, update state
      this.state = NOTEBOOK_STATE.VCS_Ready;

      // Set cell meta data to identify it as containing imports
      CellUtilities.setCellMetaData(
        this.notebookPanel,
        result[0],
        IMPORT_CELL_KEY,
        "saved",
        true
      );

      await this.notebookPanel.context.save();
      return result[0] + 2;
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when importing dependencies."
        );
      }
    }
  }

  /**
   * Prepares the current widget notebook to be a vcs_ready notebook. Will create a new one if none exists.
   * @param currentFile The file_path to set for the variable loading. If left blank, an error will occur.
   */
  async prepareNotebookPanel(currentFile: string): Promise<void> {
    if (currentFile == "") {
      this.state = NOTEBOOK_STATE.Unknown;
      // Reject initilization if no file has been selected
      throw new Error("No file has been set for obtaining variables.");
    } else if (this.state == NOTEBOOK_STATE.VCS_Ready) {
      // Set the current file and save the file path as meta data
      await this.setCurrentFile(currentFile, true);
      let fileVars: Array<Variable> = await this.getFileVariables(currentFile);
      if (fileVars.length > 0) {
        await this.VCSMenuRef.launchVarSelect(fileVars);
      } else {
        this._currentFile = "";
      }
    } else {
      // Grab a notebook panel
      let newNotebookPanel = await this.getNotebookPanel();
      // Set as current notebook (if not already)
      await this.setNotebookPanel(newNotebookPanel);

      // Set the current file and save the file path as meta data
      await this.setCurrentFile(currentFile, true);
      if (this.currentFile != "") {
        this.notebookPanel.content.activeCellIndex = await this.injectRequiredCode();
      }
    }

    // Activate current notebook
    this.application.shell.activateById(this.notebookPanel.id);

    // Connect the handler specific to current notebook
    this._notebookPanel.content.stateChanged.connect(this.handleStateChanged);
  }

  /**
   * @returns Promise<NotebookPanel> - The widget's current notebook_panel or a new one if none exists.
   */
  async getNotebookPanel(): Promise<NotebookPanel> {
    let prom: Promise<NotebookPanel> = new Promise(async (resolve, reject) => {
      try {
        if (this.notebookPanel) {
          resolve(this.notebookPanel);
        } else {
          // Create new notebook if one doesn't exist
          resolve(NotebookUtilities.createNewNotebook(this.commands));
        }
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }
}

// An error boundary to catch errors without killing the UI
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any): void {
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  render() {
    return this.props.children;
  }
}

export class NCViewerWidget extends Widget {
  constructor(context: DocumentRegistry.Context) {
    super();
    this.context = context;
  }
  readonly context: DocumentRegistry.Context;
  readonly ready = Promise.resolve(void 0);
}

export default {
  NotebookState: NOTEBOOK_STATE,
  LeftSideBarWidget,
  NCViewerWidget
};
