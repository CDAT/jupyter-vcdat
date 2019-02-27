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
  REFRESH_VARS_CMD,
  CHECK_MODULES_CMD,
  REQUIRED_MODULES,
  GET_FILE_VARIABLES,
  REFRESH_VAR_INFO,
  VARIABLES_LOADED_KEY,
  NOTEBOOK_STATE,
  REFRESH_GRAPHICS_CMD,
  BASE_GRAPHICS
} from "./constants";
import { VCSMenu } from "./components/VCSMenu";
import { notebook_utils } from "./notebook_utils";
import { cell_utils } from "./cell_utils";
import Variable from "./components/Variable";
import AxisInfo from "./components/AxisInfo";

/**
 * This is the main component for the vcdat extension.
 */
export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebook_tracker: NotebookTracker; // This is to track current notebooks
  application: JupyterLab; //The JupyterLab application object
  VCSMenuRef: VCSMenu; // the LeftSidebar component
  loading_data: boolean;
  using_kernel: boolean; // The widgets is running a kernel command

  private _ready_kernels: string[]; // A list containing kernel id's indicating the kernel is vcs_ready
  private variable_names: string[]; // The list of vcdat variables the current notebook has as string names
  private _graphics_methods: any; // The current available graphics methods
  private _variable_data: Array<Variable>; // An array containing information about the variables
  private _current_file: string; // The current filepath of the data file being used for variables and data
  private _notebook_panel: NotebookPanel; // The notebook this widget is interacting with
  private _state: NOTEBOOK_STATE; // Keeps track of the current state of the notebook in the sidebar widget

  constructor(app: JupyterLab, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.application = app;
    this.commands = app.commands;
    this.notebook_tracker = tracker;
    this._state = NOTEBOOK_STATE.Unknown;
    this.loading_data = false;
    this.using_kernel = false;
    this._current_file = "";
    this._notebook_panel = null;
    this.variable_names = [];
    this._variable_data = new Array<Variable>();
    this._graphics_methods = BASE_GRAPHICS;
    this._ready_kernels = [];
    this.initialize = this.initialize.bind(this);
    this.refreshVarList = this.refreshVarList.bind(this);
    this.setCurrentFile = this.setCurrentFile.bind(this);
    this.setNotebookPanel = this.setNotebookPanel.bind(this);
    this.updateNotebookState = this.updateNotebookState.bind(this);
    this.handleStateChanged = this.handleStateChanged.bind(this);
    this.refreshVarInfo = this.refreshVarInfo.bind(this);
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
            return this.graphic_methods;
          }}
          refreshGraphicsList={this.refreshGraphicsList}
          loadedVariables={this.variable_data}
          notebook_panel={this._notebook_panel}
          file_path={this.current_file}
        />
      </ErrorBoundary>,
      this.div
    );

    this.commands.addCommand("vcs:load-data", {
      execute: args => {
        this.loading_data = true;
        this.commands.execute("filebrowser:activate");
      }
    });
  }

  //=======GETTERS AND SETTERS=======

  public get graphic_methods(): any {
    return this._graphics_methods;
  }

  public set graphic_methods(methods: any) {
    this._graphics_methods = methods;
  }

  public get variable_data(): Array<Variable> {
    return this._variable_data;
  }

  public set variable_data(var_info: Array<Variable>) {
    this._variable_data = var_info;
    this.VCSMenuRef.updateLoadedVariables(this._variable_data);
  }

  public get state() {
    return this._state;
  }

  public set state(notebook_state: NOTEBOOK_STATE) {
    this._state = notebook_state;

    if (notebook_state == NOTEBOOK_STATE.VCS_Ready) {
      this.VCSMenuRef.updatePlotReady(true);
    } else {
      this.VCSMenuRef.updatePlotReady(false);
    }
  }

  public get current_file(): string {
    return this._current_file;
  }

  public get notebook_panel(): NotebookPanel {
    return this._notebook_panel;
  }

  //=======ASYNC SETTER FUNCTIONS=======

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  async setNotebookPanel(notebook_panel: NotebookPanel): Promise<void> {
    try {
      this.VCSMenuRef.setState({
        notebook_panel: notebook_panel
      });

      //console.log(`Previous variable list: ${this.variable_names}`);
      //Exit early if no change needed
      if (this._notebook_panel == notebook_panel) {
        console.log("The current notebook didn't change.");
        return;
      }
      // Disconnect handlers from previous notebook_panel (if exists)
      if (this._notebook_panel) {
        this._notebook_panel.content.stateChanged.disconnect(
          this.handleStateChanged
        );
      }
      // Update current notebook
      this._notebook_panel = notebook_panel;

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
        let last_file_opened: string | null = await notebook_utils.getMetaData(
          notebook_panel,
          FILE_PATH_KEY
        );
        if (last_file_opened) {
          await this.setCurrentFile(last_file_opened, false);
        } else {
          await this.setCurrentFile("", false);
        }
        console.log(`Current file is now: ${last_file_opened}`);

        // Run imports if cell isn't vcs ready, to make it vcs ready
        if (this.state == NOTEBOOK_STATE.ImportsReady) {
          // Get cell containing the imports key
          let imports_cell = cell_utils.findCellWithMetaKey(
            this.notebook_panel.content,
            IMPORT_CELL_KEY
          );
          if (imports_cell[0] >= 0) {
            console.log("Import meta data found, running code.");
            // If found, run the imports code
            await notebook_utils.sendSimpleKernelRequest(
              this.notebook_panel,
              imports_cell[1].value.text,
              false
            );
            // Select the last cell
            this.notebook_panel.content.activeCellIndex =
              this.notebook_panel.content.model.cells.length - 1;

            // Update kernel list to identify this kernel is ready
            this._ready_kernels.push(this.notebook_panel.session.kernel.id);
            // Update state
            this.state = NOTEBOOK_STATE.VCS_Ready;
          }
        }
        // Update the selected graphics method, variable list and loaded variables
        this.refreshVarList();
        this.refreshGraphicsList();
        this.VCSMenuRef.getGraphicsSelections();

        // Set up notebook's handlers to keep track of notebook status
        this.notebook_panel.content.stateChanged.connect(
          this.handleStateChanged
        );
        //this._notebook_panel.disposed.connect(this.handleNotebookDisposed);
      } else {
        // Refresh the UI lists (will become empty)
        this.refreshVarList();
        this.refreshGraphicsList();
        this.setCurrentFile("", false);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Updates the widget's current filepath which is used to load variables.
   * @param file_path The new file path to set
   * @param save Whether the file path should be saved to the notebook's meta data.
   */
  async setCurrentFile(file_path: string, save: boolean) {
    try {
      this._current_file = file_path;
      // If notebook panel exists, set the notebook meta data to store current file path
      if (this.notebook_panel && save) {
        // Ensure notebook session is ready before setting metadata
        await this.notebook_panel.session.ready;
        await notebook_utils.setMetaDataNow(
          this.notebook_panel,
          FILE_PATH_KEY,
          file_path
        );
        // Update component, no variable retrieval
        this.VCSMenuRef.setState({
          file_path: file_path
        });
        let result = notebook_utils.getMetaDataNow(
          this.notebook_panel,
          VARIABLES_LOADED_KEY
        );
        //console.log(`Variable data found in notebook: ${result}`);
        if (result) {
          this.VCSMenuRef.updateLoadedVariables(result);
        } else {
          //console.log(`Launching var loader with filepath: ${file_path}`);
          let file_vars = await this.getFileVariables(file_path);
          if (file_vars.length > 0) {
            await this.VCSMenuRef.launchVarSelect(file_vars);
          } else {
            alert(
              "There was an issue reading the file. Please choose another file."
            );
            this._current_file = "";
            throw new Error(
              "There was an issue getting variables from the file."
            );
          }
        }
        // Save the notebook to preserve the cell metadata
        await this.notebook_panel.context.save();
        console.log(`Filepath to ${file_path} saved.`);
        await this.refreshVarList();
      }
    } catch (error) {
      console.log(error);
    }
  }

  //=======WIDGET SIGNAL HANDLERS=======

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  async handleNotebooksChanged(
    tracker: NotebookTracker,
    notebook_panel: NotebookPanel
  ): Promise<void> {
    try {
      if (notebook_panel) {
        console.log(
          `======== Notebook is now: ${notebook_panel.title.label} ========`
        );
      } else {
        console.log("======== No notebook detected ========");
      }
      // Set the current notebook and wait for the session to be ready
      await this.setNotebookPanel(notebook_panel);
    } catch (error) {
      console.log(error);
    }
  }

  /** This handles when the state of the notebook changes, like when a cell is modified, or run etc.
   *  Using this handler, the variable list is refreshed whenever a cell's code is run in a vcs ready
   * notebook.
   */
  async handleStateChanged(
    notebook: Notebook,
    state_change: IChangedArgs<any>
  ) {
    // Perform actions when the notebook state has a command run and the notebook is vcs ready
    if (
      this.state == NOTEBOOK_STATE.VCS_Ready &&
      state_change.newValue == "command"
    ) {
      console.log("Refreshing notebook data.");
      this.refreshVarList();
      this.refreshGraphicsList();
    }
  }

  //=======WIDGET COMPONENT METHODS (FOR PROPS)=======

  /**
   * Injects code into the bottom cell of the notebook, doesn't display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns any - Results from running the code.
   */
  async inject(code: string): Promise<any> {
    try {
      let result = await cell_utils.insertRunShow(
        this.notebook_panel,
        this.commands,
        this.notebook_panel.content.model.cells.length - 1,
        code,
        true
      );
      this.notebook_panel.content.activeCellIndex = result[0] + 1;
      return result;
    } catch (error) {
      console.log(error);
      alert(error);
    }
  }

  /**
   * Injects code into the bottom cell of the notebook, and WILL display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns any - Results from running the code.
   */
  async injectAndDisplay(code: string): Promise<any> {
    try {
      let result: any = await cell_utils.insertRunShow(
        this.notebook_panel,
        this.commands,
        this.notebook_panel.content.model.cells.length,
        code,
        false
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  //=======WIDGET MAIN FUNCTIONS=======

  /**
   * This initializes the left side bar widget and checks for any open notebooks.
   * The status of the notebook is set and the notebook switching handler is connected.
   */
  async initialize(): Promise<void> {
    try {
      // Check the active widget is a notebook panel
      if (this.application.shell.currentWidget instanceof NotebookPanel) {
        console.log("======== Currently open notebook selected ========");

        // Set the current notebook and wait for the session to be ready
        await this.setNotebookPanel(this.application.shell.currentWidget);
      } else {
        // There is no active notebook widget
        console.log("======== No active notebook ========");
        await this.setNotebookPanel(null);
      }

      // Notebook tracker will signal when a notebook is changed
      this.notebook_tracker.currentChanged.connect(this.handleNotebooksChanged);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * This updates the current graphics methods list by sending a command to the kernel directly.
   */
  async refreshGraphicsList(): Promise<void> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready) {
        //Refresh the graphic methods
        this.using_kernel = true;
        let output: string = await notebook_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          REFRESH_GRAPHICS_CMD
        );
        //Update the list of latest variables and data
        this.graphic_methods = JSON.parse(output.slice(1, output.length - 1));
        //console.log(`Updated graphics method list:`);
        //console.log(this.graphic_methods);
        this.using_kernel = false;
      } else {
        this.graphic_methods = BASE_GRAPHICS;
        console.log(`No graphics list for this notebook.`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * This updates the current variable list by sending a command to the kernel directly.
   */
  async refreshVarList(): Promise<void> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready) {
        //Refresh the variables
        this.using_kernel = true;
        let output: string = await notebook_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          REFRESH_VARS_CMD
        );
        //Update the list of latest variables and data
        this.variable_names = eval(output);
        //console.log(`Updated variable name list: ${output}`);
        await this.refreshVarInfo();
        this.using_kernel = false;
      } else {
        this.variable_names = [];
        this.variable_data = new Array<Variable>();
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Refreshes the variables array
  async refreshVarInfo(): Promise<void> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready && this.current_file != "") {
        console.log("Updating variable data...");
        // Open the file reader first
        let result: string = await notebook_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          REFRESH_VAR_INFO
        );

        // Parse the resulting output into an object
        let variableAxes: any = JSON.parse(result.slice(1, result.length - 1));
        let newVars = new Array<Variable>();
        Object.keys(variableAxes.vars).map((item: string) => {
          let v = new Variable();
          v.name = item;
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
        this.variable_data = newVars;
        console.log("Variable list updated.");
        //console.log(newVars);
      } else {
        console.log("Var list is empty.");
        this.variable_data = new Array<Variable>();
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Opens a '.nc' file to read in it's variables via a kernel request.
   * @param file_path The file to open for variable reading
   * @returns Promise<Array<Variable>> -- A promise contianing an array of variables
   * that were found in the file.
   */
  async getFileVariables(file_path: string): Promise<Array<Variable>> {
    try {
      if (file_path != "") {
        console.log("Reading file for variable data.");
        // Open the file reader first
        await notebook_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          `import cdms2\nreader = cdms2.open('${file_path}')`
        );
        // Get file variables
        let result: string = await notebook_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          GET_FILE_VARIABLES
        );

        // Parse the resulting output into an object
        let variableAxes: any = JSON.parse(result.slice(1, result.length - 1));
        let newVars = new Array<Variable>();
        Object.keys(variableAxes.vars).map((item: string) => {
          let v = new Variable();
          v.name = item;
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
        console.log("File variables obtained!");
        return newVars;
      } else {
        console.log("Filename was blank!");
        return new Array<Variable>();
      }
    } catch (error) {
      console.log(error);
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
      if (this.notebook_tracker.size > 0) {
        // Check if notebook is active widget
        if (this.notebook_panel instanceof NotebookPanel) {
          // Ensure notebook session is ready before checking for metadata
          await this._notebook_panel.session.ready;
          // Check if there is a kernel listed as vcs_ready
          if (
            this._ready_kernels.length > 0 &&
            this._ready_kernels.indexOf(
              this.notebook_panel.session.kernel.id
            ) >= 0
          ) {
            // Ready kernel identified, so the notebook is ready for injection
            this.state = NOTEBOOK_STATE.VCS_Ready;
            //console.log("The notebook is VCS ready!");
          } else {
            // Search for a cell containing the imports key
            let find = cell_utils.findCellWithMetaKey(
              this.notebook_panel.content,
              IMPORT_CELL_KEY
            );
            if (find[0] >= 0) {
              // The imports cell was found, but wasn't run yet
              this.state = NOTEBOOK_STATE.ImportsReady;
              //console.log("Notebook imports are ready!");
            } else {
              // No import cell was found, but the notebook is active
              this.state = NOTEBOOK_STATE.ActiveNotebook;
              //console.log("Notebook is active.");
            }
          }
        } else {
          // No notebook is currently open
          this.state = NOTEBOOK_STATE.InactiveNotebook;
          //console.log("No notebook is active.");
        }
      } else {
        // No notebook is open (tracker was empty)
        this.state = NOTEBOOK_STATE.NoOpenNotebook;
        //console.log("No notebook opened.");
      }
    } catch (error) {
      this.state = NOTEBOOK_STATE.Unknown;
      console.log(error);
    }
    console.log(`State changed to: ${NOTEBOOK_STATE[this.state]}`);
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
    let tmp_modules = modules;
    let ind = modules.indexOf("lazy_import");

    if (lazy) {
      // Import lazy_imports if it's missing, before doing other imports
      if (ind >= 0) {
        tmp_modules.splice(ind, 1);
        cmd = "import lazy_import";
      }
      // Import other modules using lazy import syntax
      tmp_modules.forEach(module => {
        cmd += `\n${module} = lazy_import.lazy_module("${module}")`;
      });
    } else {
      // Remove lazy_imports from required modules if it is there
      if (ind >= 0) {
        tmp_modules.splice(ind, 1);
      }
      // Import modules
      tmp_modules.forEach(module => {
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
    console.log("Injecting required modules.");
    // Check if required modules are imported in notebook
    var prom: Promise<number> = new Promise(async (resolve, reject) => {
      try {
        let cmd =
          "#These imports are required for vcdat. To avoid issues, do not delete or modify.\n";

        if (skip) {
          // Check if necessary modules are loaded
          let output: string = await notebook_utils.sendSimpleKernelRequest(
            this.notebook_panel,
            CHECK_MODULES_CMD
          );

          // Create import string based on missing dependencies
          let missing_modules: string[] = eval(output);
          cmd += this.buildImportCommand(missing_modules, true);
        } else {
          cmd += this.buildImportCommand(eval(`[${REQUIRED_MODULES}]`), true);
        }

        // Inject imports in a new cell
        let result: [number, string] = await cell_utils.insertRunShow(
          this.notebook_panel,
          this.commands,
          -1,
          cmd,
          true
        );

        // Set cell meta data to identify it as containing imports
        cell_utils.setCellMetaData(
          this.notebook_panel,
          result[0],
          IMPORT_CELL_KEY,
          "saved",
          true
        );

        // Run code that creates a canvas and opens the current selected .nc file
        cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${
          this.current_file
        }\")`;
        cell_utils.insertRunShow(
          this.notebook_panel,
          this.commands,
          result[0] + 1,
          cmd,
          true
        );

        // Select the last cell
        this.notebook_panel.content.activeCellIndex =
          this.notebook_panel.content.model.cells.length - 1;

        // Update kernel list to identify this kernel is ready
        this._ready_kernels.push(this.notebook_panel.session.kernel.id);

        // Save the notebook to preserve the cell metadata, update state
        this.state = NOTEBOOK_STATE.VCS_Ready;
        await this.notebook_panel.context.save();
        console.log("Meta data added and notebook saved.");
        resolve(result[0] + 2);
      } catch (error) {
        reject(error);
      }
    });

    return prom;
  }

  /**
   * Prepares the current widget notebook to be a vcs_ready notebook. Will create a new one if none exists.
   * @param current_file The file_path to set for the variable loading. If left blank, an error will occur.
   */
  async prepareNotebookPanel(current_file: string): Promise<void> {
    let prom: Promise<void> = new Promise(async (resolve, reject) => {
      try {
        if (current_file == "") {
          this.state = NOTEBOOK_STATE.Unknown;
          // Reject initilization if no file has been selected
          reject(new Error("No file has been set for obtaining variables."));
        } else if (this.state == NOTEBOOK_STATE.VCS_Ready) {
          // Set the current file and save the file path as meta data
          await this.setCurrentFile(current_file, true);
          console.log("No code injection needed. Already vcs_ready!");
        } else {
          console.log("Getting a vcs ready notebook.");
          // Grab a notebook panel
          let new_notebook_panel = await this.getNotebookPanel();
          // Set as current notebook (if not already)
          await this.setNotebookPanel(new_notebook_panel);
          console.log("Notebook set.");

          // Set the current file and save the file path as meta data
          await this.setCurrentFile(current_file, true);
          if (this.current_file != "") {
            this.notebook_panel.content.activeCellIndex = await this.injectRequiredCode();
          } else {
            reject(new Error("The file varaibles could not be read."));
          }
        }

        // Activate current notebook
        this.application.shell.activateById(this.notebook_panel.id);

        // Connect the handler specific to current notebook
        this._notebook_panel.content.stateChanged.connect(
          this.handleStateChanged
        );

        resolve();
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  /**
   * @returns Promise<NotebookPanel> - The widget's current notebook_panel or a new one if none exists.
   */
  async getNotebookPanel(): Promise<NotebookPanel> {
    let prom: Promise<NotebookPanel> = new Promise(async (resolve, reject) => {
      try {
        if (this.notebook_panel) {
          resolve(this.notebook_panel);
        } else {
          // Create new notebook if one doesn't exist
          console.log("New notebook created");
          resolve(notebook_utils.createNewNotebook(this.commands));
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
