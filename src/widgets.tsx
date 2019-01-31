import * as React from "react";
import * as ReactDOM from "react-dom";
import { Widget } from "@phosphor/widgets";
import { VCSMenu } from "./components/VCSMenu";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { NotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { IClientSession } from "@jupyterlab/apputils";
import { Kernel } from "@jupyterlab/services";

import {
  READY_KEY,
  GET_VARS_CMD,
  CHECK_MODULES_CMD,
  FILE_PATH_KEY,
  REFRESH_VARS_CMD,
  IMPORT_CELL_KEY
} from "./constants";
import { notebook_utils as nb_utils } from "./notebook_utils";
import { cell_utils } from "./cell_utils";

export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebook_tracker: NotebookTracker; // This is to track current notebooks
  variables: string;
  component: any; // the LeftSidebar component
  loading_data: boolean;

  notebook_active: boolean; // Keeps track whether a notebook is active or not
  var_refresh: boolean; // If true, it means the vars list should be updated
  private _vcs_ready: boolean; // Wether the notebook has had necessary imports and is ready for code injection
  private _current_file: string; // The current filepath of the data file being used for variables and data
  private _notebook_panel: NotebookPanel; // The notebook this widget is interacting with

  // Multi plot, data and files

  constructor(commands: CommandRegistry, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.commands = commands;
    this.notebook_tracker = tracker;
    this._notebook_panel = tracker.currentWidget;
    this.loading_data = false;
    this._current_file = "";
    this._vcs_ready = false;
    this.initialize = this.initialize.bind(this);
    this.inject = this.inject.bind(this);
    this.updateVars = this.updateVars.bind(this);
    this.runImportCell = this.runImportCell.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.injectRequiredCode = this.injectRequiredCode.bind(this);
    this.getReadyNotebookPanel = this.getReadyNotebookPanel.bind(this);
    this.handleGetVarsComplete = this.handleGetVarsComplete.bind(this);
    this.handleSessionChanged = this.handleSessionChanged.bind(this);
    this.handleNotebooksChanged = this.handleNotebooksChanged.bind(this);

    this.component = ReactDOM.render(
      <VCSMenu
        commands={this.commands}
        inject={this.inject}
        file_path={this.current_file}
        plotReady={this.vcs_ready}
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

  initialize(): void {
    // Set active true because if there isn't an active notebook, one will be created.
    this.notebook_active = true;

    // Activate variable list refresh
    this.var_refresh = true;

    try {
      // Check the active widget is a notebook panel
      if (this.notebook_tracker.currentWidget instanceof NotebookPanel) {
        console.log("Currently open notebook selected.");

        this.notebook_tracker.currentWidget.session.ready.then(() => {
          this.notebook_panel = this.notebook_tracker.currentWidget;

          // Track when kernel runs code and becomes idle
          this.notebook_panel.session.statusChanged.connect(
            this.handleSessionChanged
          );

          // Notebook tracker will signal when a notebook is changed
          this.notebook_tracker.currentChanged.connect(
            this.handleNotebooksChanged
          );
        });
      } else {
        // There is no active notebook widget, so create a new one
        console.log("Created new notebook at start.");
        nb_utils
          .createNewNotebook(this.commands)
          .then(notebook => {
            notebook.session.ready.then(() => {
              this.notebook_panel = notebook;

              // Track when kernel runs code and becomes idle
              this.notebook_panel.session.statusChanged.connect(
                this.handleSessionChanged
              );

              // Notebook tracker will signal when a notebook is changed
              this.notebook_tracker.currentChanged.connect(
                this.handleNotebooksChanged
              );
            });
          })
          .catch(error => {
            this.notebook_active = false;
            console.log(error);
          });
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Perform actions when current notebook is changed
  async handleNotebooksChanged(
    tracker: NotebookTracker,
    notebook_panel: NotebookPanel
  ) {
    try {
      if (notebook_panel) {
        console.log(`Notebook changed to ${notebook_panel.title.label}.`);

        // Disconnect handlers from previous notebook_panel
        this.notebook_panel.session.statusChanged.disconnect(
          this.handleSessionChanged
        );

        // Update current notebook and status
        this.notebook_panel = notebook_panel;
        this.notebook_active = true;

        // If notebook is vcs_ready, run import code
        if (this.vcs_ready) {
          console.log("Running import cell after notebook switched.");
          await this.runImportCell();
        }

        // Connect handlers to new notebook
        this.notebook_panel.session.statusChanged.connect(
          this.handleSessionChanged
        );
      } else {
        console.log("No active notebook detected.");
        this.notebook_active = false;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Performs actions whenever the current notebook session changes status
  async handleSessionChanged(session: IClientSession, status: Kernel.Status) {
    try {
      // Upon kernel first connect, if notebook is vcs_ready, run import code
      if (status == "connected" && this.vcs_ready) {
        console.log("Running import cell after session connected.");
        await this.runImportCell();
      }
      // Don't do anything unless kernel is idle, the notebook is vcs ready and variables need a refresh
      else if (status == "idle" && this.vcs_ready && this.var_refresh) {
        // If the status is idle, vcs is ready and variables need to be refreshed
        this.var_refresh = false;
        //Refresh the variables
        let output: string = await nb_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          REFRESH_VARS_CMD
        );
        //Output gives the list of latest variables.
        console.log(output);
      } else if (status == "idle" && this.vcs_ready) {
        this.var_refresh = true;
      }
    } catch (error) {
      console.log(error);
      this.var_refresh = false;
    }
  }

  public get vcs_ready(): boolean {
    return this._vcs_ready;
  }
  public set vcs_ready(value: boolean) {
    try {
      nb_utils.setMetaDataNow(this.notebook_panel, READY_KEY, value, false);
      this._vcs_ready = value;
      this.component.setState({
        plotReady: value
      });
    } catch (error) {
      console.log(error);
    }
  }

  public get notebook_panel(): NotebookPanel {
    return this._notebook_panel;
  }
  /**
   * Set's the widget'c current notebook and updates the necessary variables
   */
  public set notebook_panel(notebook_panel: NotebookPanel) {
    try {
      this._notebook_panel = notebook_panel;

      if (notebook_panel) {
        // Update whether the current notebook is vcs ready (has required imports and vcs initialized)
        let ready = nb_utils.getMetaDataNow(notebook_panel, READY_KEY);
        if (ready) {
          this.vcs_ready = true;
        } else {
          this.vcs_ready = false;
        }

        // Check if the notebook has a file to load variables from already
        let file_path = nb_utils.getMetaDataNow(notebook_panel, FILE_PATH_KEY);
        // If file path isn't null, update it.
        if (file_path) {
          console.log(`File path obtained: ${file_path}`);
          this.current_file = file_path;
        } else {
          console.log("File path meta data not available.");
          this.current_file = "";
        }
      }
    } catch (error) {
      console.log(error);
      this.vcs_ready = false;
    }
  }

  public get current_file(): string {
    return this._current_file;
  }
  public set current_file(file_path: string) {
    try {
      this._current_file = file_path;
      nb_utils.setMetaDataNow(
        this.notebook_panel,
        FILE_PATH_KEY,
        file_path,
        false
      );
      this.component.setState({
        file_path: file_path
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Inject code into the bottom cell of the notebook, doesn't display results (output or error)
  // Results of code are returned.
  async inject(code: string): Promise<any> {
    try {
      let result: any = await cell_utils.insertAndRun(
        this.notebook_panel,
        this.notebook_panel.content.model.cells.length,
        code,
        false
      );
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

  async runImportCell() {
    try {
      // Search for a cell containing the imports key
      let find = cell_utils.findCellWithMetaKey(
        this.notebook_panel.content,
        IMPORT_CELL_KEY
      );

      if (find[0] >= 0) {
        // If found, run the imports code
        await nb_utils.sendSimpleKernelRequest(
          this.notebook_panel,
          find[1].value.text,
          false
        );
      } else {
        // If not found, inject the required code
        await this.injectRequiredCode();
      }
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
    console.log("Injecting required modules");
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
          "vcdat_imports",
          "saved",
          true
        );

        // Run code that creates a canvas and opens the current selected .nc file
        cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${
          this.current_file
        }\")`;
        cell_utils.insertAndRun(this.notebook_panel, result[0] + 1, cmd, true);
        resolve(result[0] + 2);
      } catch (error) {
        reject(error);
      }
    });

    return prom;
  }

  // returns promise of a vcs ready notebook, creating one if necessary
  async getReadyNotebookPanel(): Promise<NotebookPanel> {
    let prom: Promise<NotebookPanel> = new Promise(async (resolve, reject) => {
      try {
        // Reject initilization if no file has been selected
        if (this.current_file == "") {
          reject(new Error("No file has been set for obtaining variables."));
        } else if (this.vcs_ready) {
          // The notebook should have vcs imports initialized, verify
          await this.runImportCell();
          console.log("Notebook has vcs initialized!");
          resolve(this.notebook_panel);
        } else {
          // Grab a notebook panel
          let notebook_panel: NotebookPanel = await this.getNotebookPanel();
          // Prepare notebook by injecting needed import statements
          let newIndex = (await this.injectRequiredCode()) + 1;
          // Set the active cell to be under the injected code
          this.notebook_panel.content.activeCellIndex = newIndex + 1;
          // Once ready, set notebook meta data and save
          this.vcs_ready = true; // The notebook has required modules and is ready
          // Save the notebook to preserve the cells and metadata
          await this.notebook_panel.context.save();
          resolve(notebook_panel);
        }
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  // return a promise of current notebook panel (may not be vcs ready)
  async getNotebookPanel() {
    let prom: Promise<NotebookPanel> = new Promise(async (resolve, reject) => {
      try {
        if (this.notebook_panel) {
          resolve(this.notebook_panel);
        } else {
          // Create new notebook if one doesn't exist
          let notebook_panel: NotebookPanel = await nb_utils.createNewNotebook(
            this.commands
          );
          resolve(notebook_panel);
        }
      } catch (error) {}
    });
    return prom;
  }

  //This runs a script to get the current variables
  async updateVars() {
    try {
      let notebook_panel: NotebookPanel = await this.getReadyNotebookPanel();
      let output: string = await nb_utils.sendSimpleKernelRequest(
        notebook_panel,
        GET_VARS_CMD
      );

      this.handleGetVarsComplete(output);
    } catch (error) {
      console.log(error);
    }
  }
  //Helper function to convert output string to an object/dictionary
  outputStrToDict(output: string) {
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

  handleGetVarsComplete(output: string) {
    var outputObj = this.outputStrToDict(output);

    this.component.update(
      outputObj["variables"],
      outputObj["graphicsMethods"],
      outputObj["templates"]
    );
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

export default { LeftSideBarWidget, NCViewerWidget };
