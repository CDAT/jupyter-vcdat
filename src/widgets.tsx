import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Widget } from '@phosphor/widgets';
import { LeftSideBar } from './components/LeftSideBar';
import { CommandRegistry } from '@phosphor/commands';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ConsolePanel } from '@jupyterlab/console';


/*Test python script
import cdms2
import vcs
data = cdms2.open('clt.nc')
clt = data('clt')
*/

/*Refresh python script
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

const GET_VARS_CMD =
'import __main__\n\
import json\n\
import cdms2\n\
import vcs\n\
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

    div: HTMLDivElement;                // The div container for this widget
    commands: CommandRegistry;          // Jupyter app CommandRegistry
    context: DocumentRegistry.Context;  // Jupyter app DocumentRegistry.Context
    currentPanel: ConsolePanel;         // The console panel this widget is interacting with
    variables: string;
    props: any;                         // An object that stores the props to pass down to LeftSideBar
    component: any;                     // the LeftSidebar component
    currentGm: string                   // name of the active graphics method
    currentVariable: string             // name of the activate variable
    currentTemplate: string             // name of the activate template
    constructor(commands: CommandRegistry, context: DocumentRegistry.Context) {
        super();
        this.div = document.createElement('div');
        this.div.id = 'left-sidebar';
        this.node.appendChild(this.div);
        console.log('firing LeftSideBar constructor');
        this.commands = commands;
        this.context = context;
        this.currentPanel = null;
        this.currentGm = '';
        this.currentVariable = '';
        this.currentTemplate = '';
        this.props = {
            variables: [],
            graphicsMethods: {},
            templates: [],
            //The handlers below are run when a variable, template or graphicMethod link is clicked
            varClickHandler: (listName: string, varName: string) => {
                listName = listName.replace(/\s/g, '');
                varName = varName.replace(/\s/g, '');
                if (this.currentVariable != varName) {
                    this.currentVariable = varName;
                    let varString = `selectedVariable = ${varName}`;
                    this.currentPanel.console.inject(varString);
                }
            },
            templateClickHandler: (listName: string, tmplName: string) => {
                tmplName = tmplName.replace(/\s/g, '');
                if (this.currentTemplate != tmplName) {
                    this.currentTemplate = tmplName;
                    let tmplString = `${tmplName} = x.gettemplate('${tmplName}')`;
                    this.currentPanel.console.inject(tmplString);
                }
            },
            graphClickHandler: (graphicType: string, graphicName: string) => {
                graphicName = graphicName.replace(/\s/g, '');
                graphicType = graphicType.replace(/\s/g, '');
                if (this.currentGm != graphicName) {
                    this.currentGm = graphicName;
                    let gmLoadString = `${graphicName} = vcs.get${graphicType}('${graphicName}')`;
                    this.currentPanel.console.inject(gmLoadString);
                }
            },
            //These are the refresh and plot handlers.
            refreshAction: () => {
                this.updateVars();
            },
            // plot using the currently selected variable, gm, template
            plotAction: () => {
                this.currentPanel.console.inject('x.clear()');
                let gm = this.currentGm;
                let temp = this.currentTemplate;
                if(!gm){
                    gm = '"default"';
                }
                if(!temp){
                    temp = '"default"';
                }
                let plotString = `x.plot(${this.currentVariable}, ${gm}, ${temp})`;
                this.currentPanel.console.inject(plotString);
            },
            clearAction: () => {
                this.currentPanel.console.clear();
            },
            file_path: this.context.session.path
        };
        this.component = ReactDOM.render(
            <LeftSideBar {...this.props} />,
            this.div);

        this.updateVars = this.updateVars.bind(this);
        this.updateVars();
    }
    updatePath(file_path: string) {
        this.component.setState({
            file_path: file_path
        });
    }
    //This is where the code injection occurs in the current console.
    updateVars() {
        debugger;
        if (!this.currentPanel) {
            // Create Console and inject code
            this.commands.execute('console:create', {
                activate: true,
                path: this.context.path,
                preferredLanguage: this.context.model.defaultKernelLanguage
            }).then(consolePanel => {
                consolePanel.session.ready.then(() => {
                    this.currentPanel = consolePanel;
                    this.component.console = consolePanel.console;
                    //Temp cmd for testing
                    var injectCmd = `import cdms2\nimport vcs\nx = vcs.init()\ndata = cdms2.open('${this.context.session.path}')`
                    this.currentPanel.console.inject(injectCmd);
                    //Command to put variables
                    this.currentPanel.console.inject(GET_VARS_CMD).then(() => {
                        this.handleGetVarsComplete();
                    });
                })
            })
        }
        else {
            // Just inject code, console exists
            console.log('Executing command console: inject');
            this.currentPanel.session.ready.then(() => {
                //Command to put variables
                this.currentPanel.console.inject(GET_VARS_CMD).then(() => {
                    this.handleGetVarsComplete();
                });
            });
        }
    }
    //Helper function to convert console output string to an object/dictionary
    outputStrToDict(output: string) {
        var dict: any = { variables: {}, templates: {}, graphicsMethods: {} };
        var outputElements = output.replace(/\'/g, "").split('|');
        dict.variables = outputElements[0].slice(1, -1).split(',');

        let idx = dict.variables.indexOf(' selectedVariable')
        if( idx != -1){
            dict.variables.splice(idx, 1);
        }
        dict.templates = outputElements[1].slice(1, -1).split(',');

        //var pattern = /?=\]\}\)/;
        var first: boolean = true;
        var prevKey: string = "";
        outputElements[2].slice(1, -1).split(':').forEach((str) => {
            if (first) {//first element is only a key
                dict.graphicsMethods[str] = [];
                prevKey = str;
                first = false;
            }
            else if (str.endsWith("]})")) {//last element is only a value
                dict.graphicsMethods[prevKey] = str.slice(2, -3).split(',');
            }
            else {//A value/key pair
                var pair = str.split('], ');
                dict.graphicsMethods[prevKey] = pair[0].slice(2).split(',');
                prevKey = pair[1];
            }
        });

        return dict;
    }
    handleGetVarsComplete() {
        //Once injection is done read output as string
        var consoleOutputStr: string;
        var jpOutputAreas: HTMLCollectionOf<Element>;
        jpOutputAreas = document.getElementsByClassName("jp-OutputArea-output");
        consoleOutputStr = jpOutputAreas[jpOutputAreas.length - 1].getElementsByTagName("pre")[0].innerHTML;
        var outputObj = this.outputStrToDict(consoleOutputStr);

        this.component.updateListInfo(
            outputObj["variables"],
            outputObj["graphicsMethods"],
            outputObj["templates"])

        //Calc the number of cells in console and remove last cell once props are updated
        var cellCount = this.currentPanel.console.cells.length;
        this.currentPanel.console.cells.get(cellCount - 1).close();
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
