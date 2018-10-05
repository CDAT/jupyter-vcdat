import { Widget } from '@phosphor/widgets';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { LeftSideBar } from './components/LeftSideBar';
import { CommandRegistry } from '@phosphor/commands';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ConsolePanel } from '@jupyterlab/console';
import { Cell } from '@jupyterlab/cells';

/*
//Experimental
function varCapture(){

	commands.execute('console:inject', {
		activate: true,
	}).then(consolePanel => {
		consolePanel.session.ready.then(() => {
			consolePanel.console.inject(getVarCmd);
		});
	});
	console.log("Injected var command.");
	commands.execute('console:clear');
	console.log("Cleared console");
	
};*/

/*
import __main__
import json
import cdms2
def variables_generator():
  for nm, obj in __main__.__dict__.items():
      if isinstance(obj, cdms2.MV2.TransientVariable):
          yield obj.id
  return
def variables():
  out = []
  for nm, obj in __main__.__dict__.items():
      if isinstance(obj, cdms2.MV2.TransientVariable):
          out.append(obj.id)
  return out
def graphic_methods():
  out = {}
  for typ in vcs.graphicsmethodlist():
      out[typ] = vcs.listelements(typ)
  return out
def templates():
  return vcs.listelements("template")

def list_all():
  out = {}
  out["variables"] = variables()
  out["gm"] = graphic_methods()
  out["template"] = templates()
  return out

print(variables())
print(graphic_methods()["boxfill"])
print(list_all())
*/

const getVarCmd = 
"import cdms2\n\
import __main__\n\
import json\n\
def variables_generator():\n\
\tfor nm, obj in __main__.__dict__.items():\n\
\t\tif isinstance(obj, cmds2.MV2.TransientVariable):\n\
\t\t\tyield obj.id\n\
\treturn\n\
def variables():\n\
\tout = []\n\
\tfor nm, obj in __main__.__dict__.items():\n\
\t\tif isinstance(obj, cdms2.MV2.TransientVariable):\n\
\t\t\tout.append(obj.id)\n\
\treturn out\n\
with open('tmp.txt','w') as filehandle:\n\
\tjson.dump(variables(),filehandle)\nprint(variables())";

export class LeftSideBarWidget extends Widget {

    div: HTMLDivElement;
    commands: CommandRegistry;
    context: DocumentRegistry.Context;
    currentPanel: ConsolePanel;
    variables: string;
    props: any;
    cell: Cell;

    constructor(commands: CommandRegistry, context: DocumentRegistry.Context){
        super();
        this.div = document.createElement('div');
        this.div.id = 'left-sidebar';
        this.node.appendChild(this.div);
        console.log('firing LeftSideBar constructor');
        this.commands = commands;
        this.context = context;
        this.currentPanel = null;

        this.props = {
            variables: ["TestVar1","TestVar2","TestVariable3"],
            graphicsMethods: {"GraphicType1":['method a','method b','method c'],"GraphicType2":["method a","method z"],"GraphicType3":["method 1","method 2","method 3"]},
            templates: ["Template1","Template2","Template3"],
            varClickHandler: (listName: string, varName: string)=>{
                console.log("Variable: " + varName + " was clicked.");
            },
            tmplClickHandler: (listName: string, tmplName: string)=>{
                console.log("Template: " + tmplName + " was clicked.");
            },
            graphClickHandler: (graphicType: string, graphicName: string)=>{
                console.log("GraphicType: " + graphicType + " method: '" + graphicName + "' was clicked.");
            },
            refreshAction: () => {
                this.updateVars();
            },
            plotAction: () => {
                this.updateVars();
            }
        };
        ReactDOM.render(<LeftSideBar {...this.props}></LeftSideBar>,this.div);

        this.updateVars = this.updateVars.bind(this);

        this.updateVars();
    }

    //This is where the code injection occurs in the current console.
    updateVars(){

        if(!this.currentPanel){
            // Create Console and inject code
            console.log('Executing command console:create');
            this.commands.execute('console:create', {
            activate: true,
                path: this.context.path,
                preferredLanguage: this.context.model.defaultKernelLanguage
            }).then(consolePanel => {
                consolePanel.session.ready.then(() => {
                    this.currentPanel = consolePanel;
                    //Temp cmd for testing
                    var injectCmd = "import cdms2\nimport vcs\ndata = cdms2.open(\'" +
                    this.context.session.path + "\')\nclt = data('clt')";
                    this.currentPanel.console.inject(injectCmd);

                    //Command to put variables
                    this.currentPanel.console.inject(getVarCmd).then((consolePanel)=>{

                        //Once injection is done read output
                        console.log("Output elements:");
                        var outputElements: string = document.getElementsByClassName("jp-OutputArea-output")[0].getElementsByTagName("pre")[0].innerHTML;
                        console.log(outputElements);
                    });
                })
            })
        }
        else {
            //Temp cmd for testing
            var injectCmd = "import cdms2\nimport vcs\ndata = cdms2.open(\'" +
            this.context.session.path + "\')\nclt = data('clt')";
            this.currentPanel.console.inject(injectCmd);

            //Command to pull variables
            this.currentPanel.console.inject(getVarCmd);
            //this.currentPanel.console.clear();
        }
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


export default { LeftSideBarWidget, NCViewerWidget};