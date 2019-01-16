import * as React from "react";
import * as ReactDOM from "react-dom";
import { notebook_utils as nb_utils } from "./notebook_utils";
import { cell_utils } from "./cell_utils";
import { Widget } from "@phosphor/widgets";
import { VCSMenu } from "./components/VCSMenu";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import {
  GET_VARS_CMD,
  CHECK_MODULES_CMD,
  READY_KEY,
  FILE_PATH_KEY
} from "./constants";
import { NotebookTracker, NotebookPanel } from "@jupyterlab/notebook";

export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebook_tracker: NotebookTracker; // This is to track current notebooks
  variables: string;
  component: any; // the LeftSidebar component
  loading_data: boolean;

  private _vcs_ready: boolean; // Wether the notebook has had necessary imports and is ready for code injection
  private _current_file: string; // The current filepath of the data file being used for variables and data
  private _notebook_panel: NotebookPanel; // The notebook this widget is interacting with

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
    this.inject = this.inject.bind(this);
    this.updateVars = this.updateVars.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.injectRequiredModules = this.injectRequiredModules.bind(this);
    this.getReadyNotebookPanel = this.getReadyNotebookPanel.bind(this);
    this.handleGetVarsComplete = this.handleGetVarsComplete.bind(this);
    this.component = ReactDOM.render(
      <VCSMenu
        commands={this.commands}
        inject={this.inject}
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

    // Checks the current notebook
  }

  public get vcs_ready(): boolean {
    return this._vcs_ready;
  }
  public set vcs_ready(value: boolean) {
    try {
      if (value) {
        nb_utils.setMetaData(this.notebook_panel, READY_KEY, "true");
      } else {
        nb_utils.setMetaData(this.notebook_panel, READY_KEY, "false");
      }

      this._vcs_ready = value;
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
  public set notebook_panel(newNotebook: NotebookPanel) {
    try {
      this._notebook_panel = newNotebook;

      if (newNotebook) {
        // Update whether the current notebook is vcs ready (has required imports and vcs initialized)
        if (nb_utils.getMetaData(newNotebook, READY_KEY)) {
          this.vcs_ready = true;
        } else {
          this.vcs_ready = false;
        }
        // Check if the notebook has a file to load variables from already
        let file_path: string = nb_utils.getMetaData(
          newNotebook,
          FILE_PATH_KEY
        );
        // If file path isn't null, update it.
        if (file_path) {
          console.log(`File path restored! File: ${file_path}`);
          this.current_file = file_path;
        } else {
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
      nb_utils.setMetaData(this.notebook_panel, FILE_PATH_KEY, file_path);
      this.component.setState({
        file_path: file_path
      });
    } catch (error) {
      console.log(error);
    }
  }

  inject(code: string): any {
    cell_utils
      .insertAndRun(
        this.commands,
        this.notebook_panel,
        this.notebook_panel.content.activeCellIndex,
        code,
        false
      )
      .then(result => {
        return result;
      })
      .catch(error => {
        console.log(error);
      });
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
  injectRequiredModules(): Promise<number> {
    console.log("Injecting required modules");
    // Check if required modules are imported in notebook
    var prom: Promise<number> = new Promise((resolve, reject) => {
      cell_utils
        .runAndDelete(this.commands, this.notebook_panel, CHECK_MODULES_CMD)
        .then(output => {
          let missing_modules: string[] = eval(output);
          let cmd = this.buildImportCommand(missing_modules, true);
          cell_utils
            .insertAndRun(this.commands, this.notebook_panel, -1, cmd, false)
            .then(result => {
              resolve(result[0]);
            })
            .catch(error => {
              reject(error);
            });
        })
        .catch(error => {
          console.log(error);
        });
    });

    return prom;
  }

  // returns promise of a vcs ready notebook, creating one if necessary
  getReadyNotebookPanel() {
    let nb: Promise<NotebookPanel> = new Promise((resolve, reject) => {
      // Reject initilization if no file has been selected
      if (this.current_file == "") {
        reject(new Error("No file has been set for obtaining variables."));
      } else if (this.vcs_ready) {
        // The notebook already has vcs initialized
        console.log("Notebook has vcs initialized!");
        resolve(this.notebook_panel);
      } else {
        this.getNotebookPanel()
          .then(notebook_panel => {
            // This command prepares notebook by injecting needed import statements
            this.injectRequiredModules()
              .then(index => {
                // This command initializes vcs and canvas
                let cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${
                  this.current_file
                }\")`;
                cell_utils
                  .insertAndRun(
                    this.commands,
                    this.notebook_panel,
                    this.notebook_panel.content.activeCellIndex,
                    cmd,
                    true
                  )
                  .then(result => {
                    this.vcs_ready = true; // The notebook has required modules and is ready
                    this.notebook_panel.content.activeCellIndex = result[0] + 1; // Set the active cell to be under the injected code
                    notebook_panel.context.save(); // Save the notebook to preserve the cells and metadata
                    resolve(notebook_panel);
                  })
                  .catch(error => {
                    reject(error);
                  });
              })
              .catch(error => {
                reject(error);
              });
          })
          .catch(error => {
            console.log(error);
          });
      }
    });
    return nb;
  }

  // return a promise of current notebook panel (may not be vcs ready)
  getNotebookPanel() {
    let nb: Promise<NotebookPanel> = new Promise((resolve, reject) => {
      if (this.notebook_panel) {
        resolve(this.notebook_panel);
      } else {
        // Create new notebook if one doesn't exist
        nb_utils
          .createNewNotebook(this.commands)
          .then(notebook_panel => {
            resolve(notebook_panel);
          })
          .catch(error => {
            reject(error);
          });
      }
    });
    return nb;
  }

  //This is where the code injection occurs in the current notebook.
  updateVars() {
    this.getReadyNotebookPanel()
      .then((notebook_panel: NotebookPanel) => {
        cell_utils
          .runAndDelete(this.commands, notebook_panel, GET_VARS_CMD)
          .then(output => {
            this.handleGetVarsComplete(output);
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.log(error);
      });
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
