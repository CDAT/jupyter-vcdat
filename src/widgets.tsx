import * as React from "react";
import * as ReactDOM from "react-dom";
import { Widget } from "@phosphor/widgets";
import { VCSMenu, VCSMenuProps } from "./components/VCSMenu";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { GET_VARS_CMD, LOAD_DEPENDENCIES } from "./constants";

export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  context: DocumentRegistry.Context; // Jupyter app DocumentRegistry.Context
  notebook: any; // The notebook this widget is interacting with
  variables: string;
  component: any; // the LeftSidebar component
  context_path: string;
  constructor(commands: CommandRegistry, context: DocumentRegistry.Context) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.commands = commands;
    this.context = context;
    this.notebook = null;
    this.inject = this.inject.bind(this);

    if (this.context) {
      this.context_path = this.context.session.name;
    }

    this.updateVars = this.updateVars.bind(this);
    this.getNotebook = this.getNotebook.bind(this);
    this.handleGetVarsComplete = this.handleGetVarsComplete.bind(this);
    this.updateNotebook = this.updateNotebook.bind(this);
    this.component = ReactDOM.render(
      <VCSMenu inject={this.inject} file_path={this.context_path} />,
      this.div
    );
  }
  updateNotebook(notebook: any) {
    this.notebook = notebook;
    this.prepNotebook(notebook, undefined).then(() => {
      this.updateVars();
    });
  }
  updatePath(context: any) {
    this.context = context;
    this.component.setState({
      file_path: this.context.session.name
    });
  }
  inject(code: string) {
    this.notebook.content.activeCell.model.value.text = code;
    var prom = this.commands.execute("notebook:run-cell");
    this.commands.execute("notebook:insert-cell-below");
    return prom;
  }
  prepNotebook(notebook: any, resolve: any) {
    return new Promise((resolve, reject) => {
      notebook.session.ready.then(() => {
        this.notebook = notebook;
        this.inject(LOAD_DEPENDENCIES).then(() => {
          if (this.context) {
            let cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${
              this.context.session.name
            }\")`;
            this.inject(cmd).then(() => {
              if (resolve) {
                resolve();
              }
            });
          } else {
            if (resolve) {
              resolve();
            }
          }
        });
      });
    });
  }
  createNotebook(resolve: any, reject: any) {
    this.commands
      .execute("notebook:create-new", {
        activate: true,
        path: this.context.path,
        preferredLanguage: this.context.model.defaultKernelLanguage
      })
      .then(notebook => {
        this.prepNotebook(notebook, resolve);
      })
      .catch(error => {
        if (reject) {
          reject(error);
        }
      });
  }
  // return a promise of a notebook
  getNotebook() {
    let nb = new Promise((resolve, reject) => {
      if (this.notebook) {
        resolve(this.notebook);
      } else {
        this.createNotebook(resolve, reject);
      }
    });
    return nb;
  }
  //This is where the code injection occurs in the current console.
  updateVars() {
    this.getNotebook().then((notebook: any) => {
      notebook.content.activeCell.model.value.text = GET_VARS_CMD;
      this.commands.execute("notebook:run-cell").then(() => {
        this.handleGetVarsComplete();
      });
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
    let consoleOutputStr: string = this.notebook.content.activeCell.outputArea
      .model._lastStream;
    var outputObj = this.outputStrToDict(consoleOutputStr);

    this.component.update(
      outputObj["variables"],
      outputObj["graphicsMethods"],
      outputObj["templates"]
    );
    this.commands.execute("notebook:delete-cell");
    this.commands.execute("notebook:insert-cell-below");
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
