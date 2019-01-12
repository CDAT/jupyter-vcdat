import * as React from "react";
import * as ReactDOM from "react-dom";
import { cell_utils, notebook_utils } from "./vcdat_utils";
import { Widget } from "@phosphor/widgets";
import { VCSMenu, VCSMenuProps } from "./components/VCSMenu";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";

import { NotebookTracker, NotebookPanel } from "@jupyterlab/notebook";

const GET_VARS_CMD =
  'import __main__\n\
import json\n\
def variables():\n\
		out = []\n\
		for nm, obj in __main__.__dict__.items():\n\
				if isinstance(obj, cdms2.MV2.TransientVariable):\n\
						out+=[nm]\n\
		return out\n\
def graphic_methods():\n\
		out = {}\n\
		for typ in vcs.graphicsmethodlist():\n\
				out[typ] = vcs.listelements(typ)\n\
		return out\n\
def templates():\n\
		return vcs.listelements("template")\n\
def list_all():\n\
		out = {}\n\
		out["variables"] = variables()\n\
		out["gm"] = graphic_methods()\n\
		out["template"] = templates()\n\
		return out\n\
print("{}|{}|{})".format(variables(),templates(),graphic_methods()))';

const CHECK_MODULES_CMD =
  'import sys\n\
all_modules = ["lazy_import","vcs","cdms2"]\n\
missed_modules = []\n\
for module in all_modules:\n\
	if module not in sys.modules:\n\
		missed_modules.append(module)\n\
missed_modules';

const REQUIRED_MODULES = ["cdms2", "vcs"];

const READY_KEY = "vcdat_ready";

export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebook_panel: NotebookPanel; // The notebook this widget is interacting with
  notebook_tracker: NotebookTracker; // This is to track current notebooks
  variables: string;

  // component_props: VCSMenuProps; // An object that stores the props to pass down to LeftSideBar
  component: any; // the LeftSidebar component
  currentGm: string; // name of the active graphics method
  currentVariable: string; // name of the activate variable
  currentTemplate: string; // name of the activate template
  current_file: string; // The path for the file from which a variable is added, set when the file is double clicked
  constructor(commands: CommandRegistry, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.commands = commands;
    this.notebook_tracker = tracker;
    this.notebook_panel = tracker.currentWidget;
    this.currentGm = "";
    this.currentVariable = "";
    this.currentTemplate = "";
    this.inject = this.inject.bind(this);
    this.current_file = "";
    this.getFilePath = this.getFilePath.bind(this);
    this.updateVars = this.updateVars.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.injectRequiredModules = this.injectRequiredModules.bind(this);
    this.getReadyNotebookPanel = this.getReadyNotebookPanel.bind(this);
    this.handleGetVarsComplete = this.handleGetVarsComplete.bind(this);
    this.component = ReactDOM.render(
      <VCSMenu inject={this.inject} filePath={this.getFilePath} />,
      this.div
    );
  }

  updatePath(file_path: string) {
    this.component.setState({
      file_path: file_path
    });
  }

  getFilePath(): string {
    return this.current_file;
  }

  inject(code: string): Promise<[number, string]> {
    return cell_utils.insertAndRun(
      this.commands,
      this.notebook_panel,
      this.notebook_panel.content.activeCellIndex,
      code
    );
  }

  buildImportCommand(modules: string[], lazy: boolean): string {
    let cmd: string = "";
    //Check for lazy_imports modules first
    let ind = modules.indexOf("lazy_import");

    if (lazy) {
      // Import lazy_imports if it's missing, before doing other imports
      if (ind >= 0) {
        modules.splice(ind, 1);
        cmd = "import lazy_import";
      }
      // Import other modules using lazy import syntax
      modules.forEach(module => {
        cmd += `\n${module} = lazy_import.lazy_module("${module}")`;
      });
    } else {
      // Remove lazy_imports from required modules if it is there
      if (ind >= 0) {
        modules.splice(ind, 1);
      }
      // Import modules
      modules.forEach(module => {
        cmd += `\nimport ${module}`;
      });
    }
    return cmd;
  }

  // This will inject the required modules into the current notebook (if module not already imported)
  injectRequiredModules(): Promise<number> {
    // Check if required modules are imported in notebook
    var prom: Promise<number> = new Promise((resolve, reject) => {
      cell_utils
        .runAndDelete(this.commands, this.notebook_panel, CHECK_MODULES_CMD)
        .then(output => {
          let missing_modules: string[] = eval(output);

          let cmd = this.buildImportCommand(missing_modules, false);
          cell_utils
            .insertAndRun(this.commands, this.notebook_panel, -1, cmd)
            .then(result => {
              resolve(result[0]);
            })
            .catch(error => {
              reject(error);
            });
        })
        .catch(error => {
          reject(error);
        });
    });

    return prom;
  }

  // Returns whether the current notebook is vcs ready (has required imports and vcs initialized)
  isVCS_Ready(): boolean {
    console.log(this.notebook_panel);
    if (
      this.notebook_panel &&
      this.notebook_panel.content &&
      this.notebook_panel.content.model &&
      this.notebook_panel.content.model.metadata.has(READY_KEY) &&
      this.notebook_panel.content.model.metadata.get(READY_KEY) == "true"
    ) {
      return true;
    }
    return false;
  }

  // Sets the current notebook as vcs ready
  setVCS_Ready(): void {
    this.notebook_panel.content.model.metadata.set(READY_KEY, "true");
  }

  // returns promise of a vcs ready notebook, creating one if necessary
  getReadyNotebookPanel() {
    let nb: Promise<NotebookPanel> = new Promise((resolve, reject) => {
      // Reject initilization if no file has been selected
      if (this.current_file == "") {
        console.log("Rejection");
        reject("No file has been set for obtaining variables.");
      } else if (this.isVCS_Ready()) {
        // The notebook already has vcs initialized
        console.log("Notebook has vcs initialized!");
        resolve(this.notebook_panel);
      } else {
        this.getNotebookPanel()
          .then(notebook_panel => {
            // This command prepares notebook by injecting needed import statements
            this.injectRequiredModules().then(index => {
              // This command initializes vcs and canvas
              let cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${
                this.current_file
              }\")`;
              this.inject(cmd).then((result) => {
                this.setVCS_Ready();
                this.notebook_panel.content.activeCellIndex = result[0]+1;// Set the active cell to be under the injected code
                notebook_panel.context.save(); // Save the notebook to preserve the cells and metadata
                resolve(notebook_panel);
              });
            });
          })
          .catch(error => {
            reject(error);
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
        notebook_utils
          .createNewNotebook(this.commands)
          .then(notebook_panel => {
            resolve(notebook_panel);
          })
          .catch(error => {
            reject(MSMediaKeyError);
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
