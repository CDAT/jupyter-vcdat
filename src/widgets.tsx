import * as React from "react";
import * as ReactDOM from "react-dom";
import { Widget } from "@phosphor/widgets";
import { VCSMenu, VCSMenuProps } from "./components/VCSMenu";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";

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

export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  context: DocumentRegistry.Context; // Jupyter app DocumentRegistry.Context
  notebook: any; // The notebook this widget is interacting with
  variables: string;

  // component_props: VCSMenuProps; // An object that stores the props to pass down to LeftSideBar
  component: any; // the LeftSidebar component
  currentGm: string; // name of the active graphics method
  currentVariable: string; // name of the activate variable
  currentTemplate: string; // name of the activate template
  context_path: string; // The path for the context from which a variable is added, set when the file is double clicked
  constructor(commands: CommandRegistry, context: DocumentRegistry.Context) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.commands = commands;
    this.context = context;
    this.notebook = null;
    this.currentGm = "";
    this.currentVariable = "";
    this.currentTemplate = "";
    this.inject = this.inject.bind(this);
    this.context_path = "clt.nc";

    if(this.context){
      this.context_path = this.context.session.name;
    }

    this.updateVars = this.updateVars.bind(this);
    this.getNotebook = this.getNotebook.bind(this);
    this.handleGetVarsComplete = this.handleGetVarsComplete.bind(this);
    this.updateNotebook = this.updateNotebook.bind(this);
    this.component = ReactDOM.render(
      <VCSMenu
        inject={this.inject}
        filePath={this.context.session.name}
      />,
      this.div
    );
    this.updateVars();
  }
  updateNotebook(){

  }
  updatePath(file_path: string) {
    this.component.setState({
      file_path: file_path
    });
  }
  inject(code: string) {
    this.notebook.content.activeCell.model.value.text = code;
    var prom = this.commands.execute("notebook:run-cell");
    this.commands.execute("notebook:insert-cell-below");
    return prom;
  }
  // return a promise of a notebook
  getNotebook() {
    let nb = new Promise((resolve, reject) => {
      if (this.notebook) {
        resolve(this.notebook);
      } else {
        this.commands
          .execute("notebook:create-new", {
            activate: true,
            path: this.context.path,
            preferredLanguage: this.context.model.defaultKernelLanguage
          })
          .then(notebook => {
            notebook.session.ready.then(() => {
              this.notebook = notebook;
              let cmd =
                'import lazy_import\ncdms2 = lazy_import.lazy_module("cdms2")\nvcs = lazy_import.lazy_module("vcs")';
              this.inject(cmd).then(() => {
                let cmd = `canvas = vcs.init()\ndata = cdms2.open(\"${
                  this.context.session.name
                }\")`;
                this.inject(cmd).then(() => {
                  resolve(notebook);
                });
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
  //This is where the code injection occurs in the current console.
  updateVars() {
    this.getNotebook().then((notebook:any) => {
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
