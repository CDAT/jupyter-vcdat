import * as React from "react";
import * as ReactDOM from "react-dom";
import { vCDAT_UTILS } from "./vcdat_utils";
import { Widget } from "@phosphor/widgets";
import { VCSMenu, VCSMenuProps } from "./components/VCSMenu";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";

import {
  NotebookTracker,
  NotebookPanel,
  NotebookActions
} from "@jupyterlab/notebook";

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
all_modules = ["vcs","cdms2"]\n\
missed_modules = []\n\
for module in all_modules:\n\
	if module not in sys.modules:\n\
		missed_modules.append(module)\n\
missed_modules';

const NEW_NOTEBOOK_PATH = "";

const REQUIRED_MODULES = ["cdms2", "vcs"];

export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebook: NotebookPanel; // The notebook this widget is interacting with
  notebook_tracker: NotebookTracker; // This is to track current notebooks
  notebook_vcs_ready: boolean; // Whether the notebook has vcs initialized and is ready for code injection
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
    this.notebook_vcs_ready = false;
    if (tracker.currentWidget instanceof NotebookPanel) {
      this.notebook = tracker.currentWidget;
    } else {
      this.notebook = null;
    }
    this.currentGm = "";
    this.currentVariable = "";
    this.currentTemplate = "";
    this.inject = this.inject.bind(this);
    this.current_file = "";
    this.updateVars = this.updateVars.bind(this);
    this.getNotebook = this.getNotebook.bind(this);
    this.injectRequiredModules = this.injectRequiredModules.bind(this);
    this.getReadyNotebook = this.getReadyNotebook.bind(this);
    this.createNewNotebook = this.createNewNotebook.bind(this);
    this.handleGetVarsComplete = this.handleGetVarsComplete.bind(this);
    this.updateNotebook = this.updateNotebook.bind(this);
    this.component = ReactDOM.render(
      <VCSMenu inject={this.inject} filePath={this.current_file} />,
      this.div
    );
  }
  updateNotebook() {}

  updatePath(file_path: string) {
    this.component.setState({
      file_path: file_path
    });
  }

  // Injects code in the current notebook, runs it in active cell, then deletes the cell.
  // Returns the output string after command is run, or empty string if error.
  runThenDelete(code: string) {
    let consoleOutputStr: string;
    let output: Promise<String> = new Promise((resolve, reject) => {
      if (!this.notebook) {
        reject("Notebook was null.");
      } else {
        this.notebook.content.activeCell.model.value.text = code;
        this.commands
          .execute("notebook:run-cell")
          .then(() => {
            consoleOutputStr = "";
            resolve(consoleOutputStr);
          })
          .then(response => {
            console.log("Done!");
            console.log(response);
            //this.commands.execute("notebook:delete-cell");
          })
          .catch(error => {
            reject(error);
          });
      }
    });
    return output;
  }

  // Injects code into the current notebook (if it exists)
  inject(code: string) {
    this.notebook.content.activeCell.model.value.text = code;

    //var prom: Promise<String> = this.commands.execute("notebook:run-cell");
    //this.commands.execute("notebook:insert-cell-below");
    return NotebookActions.run(this.notebook.content);
  }

  // This will inject the required modules into the current notebook (if module not already imported)
  injectRequiredModules() {
    // Check if required modules are imported in notebook
    var prom: Promise<Boolean>;
    prom = this.runThenDelete(CHECK_MODULES_CMD).then(output => {
      console.log(output);
      let cmd = "import lazy_import";
      REQUIRED_MODULES.forEach(module => {
        cmd += `\n${module} = lazy_import.lazy_module("${module}")`;
      });
      return this.inject(cmd);
    });

    return prom;
  }

  // return a promise of a new notebook
  createNewNotebook(path: string) {
    let nb = new Promise((resolve, reject) => {
      this.commands
        .execute("notebook:create-new", {
          activate: true,
          path: path,
          preferredLanguage: ""
        })
        .then(notebook => {
          notebook.session.ready.then(() => {
            this.notebook = notebook;
            this.notebook_vcs_ready = false;
            resolve(notebook);
          });
        })
        .catch(error => {
          reject(error);
        });
    });
    return nb;
  }

  // returns promise of a vcs ready notebook, creating one if necessary
  getReadyNotebook() {
    let nb = new Promise((resolve, reject) => {
      // Reject initilization if no file has been selected
      if (this.current_file == "") {
        console.log("Rejection");
        reject("No file has been set for obtaining variables.");
      } else if (this.notebook_vcs_ready) {
        // The notebook already has vcs initialized
        resolve(this.notebook);
      } else {
        this.getNotebook()
          .then(notebook => {
            // This command prepares notebook by injecting needed import statements
            this.injectRequiredModules().then(() => {
              // This command initializes vcs and canvas
              let cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${
                this.current_file
              }\")`;
              this.inject(cmd).then(() => {
                this.notebook_vcs_ready = true;
                resolve(notebook);
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

  // return a promise of current notebook (may not be vcs ready)
  getNotebook() {
    let nb = new Promise((resolve, reject) => {
      if (this.notebook) {
        resolve(this.notebook);
      } else {
        // Create new notebook one if one doesn't exist
        console.log("New notebook created!");
        resolve(this.createNewNotebook(NEW_NOTEBOOK_PATH));
      }
    });
    return nb;
  }

  //This is where the code injection occurs in the current console.
  updateVars() {
    this.getReadyNotebook()
      .then((notebook: any) => {
        notebook.content.activeCell.model.value.text = GET_VARS_CMD;
        this.commands.execute("notebook:run-cell").then(() => {
          this.handleGetVarsComplete();
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
  handleGetVarsComplete() {
    /*let consoleOutputStr: string = this.notebook.content.activeCell.outputArea
      .model._lastStream;
    var outputObj = this.outputStrToDict(consoleOutputStr);

    this.component.update(
      outputObj["variables"],
      outputObj["graphicsMethods"],
      outputObj["templates"]
    );
    this.commands.execute("notebook:delete-cell");
    this.commands.execute("notebook:insert-cell-below");*/
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
