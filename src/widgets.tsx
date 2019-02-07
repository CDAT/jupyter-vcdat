import * as React from "react";
import * as ReactDOM from "react-dom";
import { Widget } from "@phosphor/widgets";
import { VCSMenu } from "./components/VCSMenu";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { NotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { IClientSession } from "@jupyterlab/apputils";
import { Kernel, Session } from "@jupyterlab/services";

import {
  READY_KEY,
  FILE_PATH_KEY,
  IMPORT_CELL_KEY,
  VARIABLES_LOADED_KEY,
  GET_VARS_CMD,
  REFRESH_VARS_CMD,
  CHECK_MODULES_CMD
} from "./constants";
import { notebook_utils as nb_utils, notebook_utils } from "./notebook_utils";
import { cell_utils } from "./cell_utils";
import { JupyterLab } from "@jupyterlab/application";
import { ICellModel } from "@jupyterlab/cells";

export enum NotebookState {
  Unknown, // The current state of the notebook is unknown and should be updated.
  NoOpenNotebook, // JupyterLab has no notebook opened
  InactiveNotebook, // No notebook is currently active
  ActiveNotebook, // An active notebook, but needs imports cell
  NoSession, // The active notebook doesn't have a client session running
  ImportsReady, // Has imports cell, but they need to be run
  VCS_Ready // The notebook is ready for code injection
}

export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebook_tracker: NotebookTracker; // This is to track current notebooks
  application: JupyterLab; //The JupyterLab application object
  component: any; // the LeftSidebar component
  loading_data: boolean;
  var_refresh: boolean; // If true, it means the vars list should be updated
  state: NotebookState; // Keeps track of the current state of the notebook in the sidebar widget

  private _ready_kernels: string[]; // A list containing kernel id's indicating the kernel is vcs_ready
  private variables_list: string[]; // The list of vcdat variables the current notebook has
  //private _notebook_active: boolean; // Keeps track whether a notebook is active or not
  //private _vcs_ready: boolean; // Wether the notebook has had necessary imports and is ready for code injection
  private _current_file: string; // The current filepath of the data file being used for variables and data
  private _notebook_panel: NotebookPanel; // The notebook this widget is interacting with

  // Multi plot, data and files

  constructor(app: JupyterLab, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.commands = app.commands;
    this.notebook_tracker = tracker;
    this.application = app;

    this.state = NotebookState.Unknown;
    this.loading_data = false;
    //this._notebook_active = false;
    this.var_refresh = false;
    this._current_file = "";
    this._notebook_panel = null;
    this.variables_list = [];
    this._ready_kernels = [];
    this.initialize = this.initialize.bind(this);
    this.setNotebookPanel = this.setNotebookPanel.bind(this);
    this.setCurrentFile = this.setCurrentFile.bind(this);
    this.handleGetVarsComplete = this.handleGetVarsComplete.bind(this);
    this.handleSessionChanged = this.handleSessionChanged.bind(this);
    //this.handleNotebookDisposed = this.handleNotebookDisposed.bind(this);
    this.handleNotebooksChanged = this.handleNotebooksChanged.bind(this);

    this.inject = this.inject.bind(this);
    //this.updateVars = this.updateVars.bind(this);
    //this.runImportCell = this.runImportCell.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.injectRequiredCode = this.injectRequiredCode.bind(this);
    this.prepareNotebookPanel = this.prepareNotebookPanel.bind(this);

    this.component = ReactDOM.render(
      <VCSMenu
        commands={this.commands}
        inject={this.inject}
        notebook_panel={this._notebook_panel}
        file_path={this.current_file}
      />,
      this.div
    );

    this.commands.addCommand("vcs:load-data", {
      execute: args => {
        this.loading_data = true;
        this.commands.execute("filebrowser:activate");
      }
    });
  }

  public get notebook_panel(): NotebookPanel {
    return this._notebook_panel;
  }

  /**
   * Set's the widget's current notebook and updates the notebook state
   */
  async setNotebookPanel(notebook_panel: NotebookPanel): Promise<void> {
    try {
      //Exit early if no change needed
      if (this._notebook_panel == notebook_panel) {
        console.log("The current notebook didn't change.");
        return;
      }
      // Disconnect handlers from previous notebook_panel (if exists)
      if (this._notebook_panel) {
        this._notebook_panel.session.statusChanged.disconnect(
          this.handleSessionChanged
        );
      }
      // Update current notebook
      this._notebook_panel = notebook_panel;

      // Update notebook state
      await this.updateNotebookState();

      // Check if notebook is ready for vcs, and prepare it if so
      if (
        this.state == NotebookState.VCS_Ready ||
        this.state == NotebookState.ImportsReady
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
        if (this.state == NotebookState.ImportsReady) {
          // Get cell containing the imports key
          let imports_cell = cell_utils.findCellWithMetaKey(
            this.notebook_panel.content,
            IMPORT_CELL_KEY
          );
          if (imports_cell[0] >= 0) {
            console.log("Import meta data found, running code.");
            // If found, run the imports code
            await nb_utils.sendSimpleKernelRequest(
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
            this.state = NotebookState.VCS_Ready;
          }
        }

        this.refreshVarList();
        // Set up notebook's handlers to keep track of notebook status
        this._notebook_panel.session.statusChanged.connect(
          this.handleSessionChanged
        );
        //this._notebook_panel.disposed.connect(this.handleNotebookDisposed);
      } else {
        // Leave notebook alone if its not vcs ready
        this.setCurrentFile("", false);
      }
    } catch (error) {
      console.log(error);
    }
  }

  public get vcs_ready() {
    return this.state == NotebookState.VCS_Ready;
  }

  public set vcs_ready(value: boolean) {
    this.component.setState({ vcs_ready: value });
    if (value) {
      this.state = NotebookState.VCS_Ready;
    }
  }

  public get current_file(): string {
    return this._current_file;
  }

  async setCurrentFile(file_path: string, save: boolean) {
    try {
      this._current_file = file_path;
      // If notebook panel exists, set the notebook meta data to store current file path
      if (this.notebook_panel && save) {
        // Ensure notebook session is ready before setting metadata
        await this.notebook_panel.session.ready;
        await nb_utils.setMetaDataNow(
          this.notebook_panel,
          FILE_PATH_KEY,
          file_path
        );
        // Update component, no variable retrieval
        this.component.setState({
          file_path: file_path
        });
        let result = nb_utils.getMetaDataNow(
          this.notebook_panel,
          VARIABLES_LOADED_KEY
        );
        console.log(`Meta data result: ${result}`);
        if (result) {
          this.component.updateLoadedVariables(result);
        } else {
          console.log(`Launching var loader with filepath: ${file_path}`);
          this.component.launchVarSelect(file_path);
          nb_utils.setMetaDataNow(
            this.notebook_panel,
            VARIABLES_LOADED_KEY,
            file_path
          );
        }
        // Save the notebook to preserve the cell metadata
        await this.notebook_panel.context.save();
        console.log("Filepath to saved.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Perform actions when current notebook is changed
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

  // Performs actions whenever the current notebook session changes status
  async handleSessionChanged(
    session: IClientSession,
    status: Kernel.Status
  ): Promise<void> {
    try {
      // Don't do anything unless kernel is idle, the notebook is vcs ready and variables need a refresh
      if (status == "idle" && this.vcs_ready && this.var_refresh) {
        // If the status is idle, vcs is ready and variables need to be refreshed
        this.var_refresh = false;
        //Refresh the variables
        await this.refreshVarList();
      } else if (status == "idle" && this.vcs_ready) {
        this.var_refresh = true;
      }
    } catch (error) {
      console.log(error);
      this.var_refresh = false;
    }
  }

  // Performs actions when the notebook is disposed/closed
  /*async handleNotebookDisposed(notebook_panel: NotebookPanel) {
    try {
      console.log("Notebook was disposed:");
      console.log(notebook_panel);
      //notebook_panel.disposed.disconnect(this.handleNotebookDisposed);
      // Check if the notebook's session was vcs ready
      if (notebook_panel.session) {
        let session_id = notebook_panel.session.kernel.id;
        let index = this._ready_kernels.indexOf(session_id);
        if (index >= 0) {
          // If so, remove it
          this._ready_kernels = this._ready_kernels.splice(index, 1);
          console.log("VCS ready Notebook disposed.");
        } else {
          console.log("Active notebook was disposed.");
        }
      } else {
        console.log("Inactive notebook was closed.");
      }
    } catch (error) {
      console.log(error);
    }
  }*/

  //async handleNotebookClosed()

  handleGetVarsComplete(output: string): void {
    var outputObj = this.outputStrToDict(output);

    this.component.update(
      outputObj["variables"],
      outputObj["graphicsMethods"],
      outputObj["templates"]
    );
  }

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

  // Refreshes the variable list in the current notebook
  async refreshVarList(): Promise<void> {
    try {
      if (this.vcs_ready) {
        //Refresh the variables
        let output: string = await nb_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          REFRESH_VARS_CMD
        );
        //Update the list of latest variables.
        this.variables_list = eval(output);
        console.log(`Updated vars list: ${output}`);
      } else {
        this.variables_list = [];
        console.log(`Updated vars list: []`);
      }
      this.var_refresh = false;
    } catch (error) {
      console.log(error);
    }
  }

  // Will update the state of the widget's current notebook panel
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
            this.state = NotebookState.VCS_Ready;
            //console.log("The notebook is VCS ready!");
          } else {
            // Search for a cell containing the imports key
            let find = cell_utils.findCellWithMetaKey(
              this.notebook_panel.content,
              IMPORT_CELL_KEY
            );
            if (find[0] >= 0) {
              // The imports cell was found, but wasn't run yet
              this.state = NotebookState.ImportsReady;
              //console.log("Notebook imports are ready!");
            } else {
              // No import cell was found, but the notebook is active
              this.state = NotebookState.ActiveNotebook;
              //console.log("Notebook is active.");
            }
          }
        } else {
          // No notebook is currently open
          this.state = NotebookState.InactiveNotebook;
          //console.log("No notebook is active.");
        }
      } else {
        // No notebook is open (tracker was empty)
        this.state = NotebookState.NoOpenNotebook;
        //console.log("No notebook opened.");
      }
    } catch (error) {
      this.state = NotebookState.Unknown;
      console.log(error);
    }
    console.log(`State updated: ${NotebookState[this.state]}`);
  }

  // Inject code into the bottom cell of the notebook, doesn't display results (output or error)
  // Results of code are returned.
  async inject(code: string): Promise<any> {
    try {
      let result = await cell_utils.insertAndRun(
        this.notebook_panel,
        this.notebook_panel.content.model.cells.length - 1,
        code,
        false
      );
      this.notebook_panel.content.activeCellIndex = result[0] + 1;
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // Inject code into the bottom cell of the notebook, and will display results (output or error)
  // Results of code are also returned.
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

  // This will inject the required modules into the current notebook (if module not already imported)
  async injectRequiredCode(): Promise<number> {
    console.log("Injecting required modules.");
    // Check if required modules are imported in notebook
    var prom: Promise<number> = new Promise(async (resolve, reject) => {
      try {
        // Check if necessary modules are loaded
        let output: string = await nb_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          CHECK_MODULES_CMD
        );

        // Create import string based on missing dependencies
        let missing_modules: string[] = eval(output);
        let cmd =
          "#These imports are required for vcdat. To avoid issues, do not delete or modify.\n";
        cmd += this.buildImportCommand(missing_modules, true);

        // Inject imports in a new cell
        let result: [number, string] = await cell_utils.insertAndRun(
          this.notebook_panel,
          -1,
          cmd,
          false
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
          false
        );

        // Select the last cell
        this.notebook_panel.content.activeCellIndex =
          this.notebook_panel.content.model.cells.length - 1;

        // Update kernel list to identify this kernel is ready
        this._ready_kernels.push(this.notebook_panel.session.kernel.id);

        // Save the notebook to preserve the cell metadata
        await this.notebook_panel.context.save();
        console.log("Meta data added and notebook saved.");

        resolve(result[0] + 2);
      } catch (error) {
        reject(error);
      }
    });

    return prom;
  }

  // returns promise of a vcs ready notebook, creating one if necessary
  async prepareNotebookPanel(current_file: string): Promise<void> {
    let prom: Promise<void> = new Promise(async (resolve, reject) => {
      try {
        // Reject initilization if no file has been selected
        if (current_file == "") {
          reject(new Error("No file has been set for obtaining variables."));
        } else if (this.state == NotebookState.VCS_Ready) {
          console.log("The current notebook is already vcs ready.");
          // Set the current file and save the file path as meta data
          await this.setCurrentFile(current_file, true);

          this.refreshVarList();
        } else {
          console.log("Getting a vcs ready notebook.");
          // Grab a notebook panel
          let new_notebook_panel = await this.getNotebookPanel();
          // Set as current notebook (if not already)
          await this.setNotebookPanel(new_notebook_panel);
          console.log("Notebook set.");
          // Set the current file and save the file path as meta data
          await this.setCurrentFile(current_file, true);
          console.log("File set.");
          // Make notebook vcs ready
          this.notebook_panel.content.activeCellIndex = await this.injectRequiredCode();
        }

        // Activate current notebook
        this.application.shell.activateById(this.notebook_panel.id);
        this.vcs_ready = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  // return a promise of current notebook panel (may not be vcs ready)
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

  //Helper function to convert output string to an object/dictionary
  outputStrToDict(output: string): any {
    var dict: any = { variables: {}, templates: {}, graphicsMethods: {} };
    var outputElements = output.replace(/\'/g, "").split("|");
    dict.variables = outputElements[0].slice(1, -1).split(",");

    let idx = dict.variables.indexOf(" selectedVariable");
    if (idx != -1) {
      dict.variables.splice(idx, 1);
    }
    dict.templates = outputElements[1].slice(1, -1).split(",");

    var first: boolean = true;
    var prevKey: string = "";
    outputElements[2]
      .slice(1, -1)
      .split(":")
      .forEach(str => {
        if (first) {
          //first element is only a key
          dict.graphicsMethods[str] = [];
          prevKey = str;
          first = false;
        } else if (str.endsWith("]})")) {
          //last element is only a value
          dict.graphicsMethods[prevKey] = str.slice(2, -3).split(",");
        } else {
          //A value/key pair
          var pair = str.split("], ");
          dict.graphicsMethods[prevKey] = pair[0].slice(2).split(",");
          prevKey = pair[1];
        }
      });

    return dict;
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

export default { NotebookState, LeftSideBarWidget, NCViewerWidget };
