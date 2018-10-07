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
\tout = []\n\
\tfor nm, obj in __main__.__dict__.items():\n\
\t\tif isinstance(obj, cdms2.MV2.TransientVariable):\n\
\t\t\tout+=[nm]\n\
\treturn out\n\
def graphic_methods():\n\
\tout = {}\n\
\tfor typ in vcs.graphicsmethodlist():\n\
\t\tout[typ] = vcs.listelements(typ)\n\
\treturn out\n\
def templates():\n\
\treturn vcs.listelements("template")\n\
def list_all():\n\
\tout = {}\n\
\tout["variables"] = variables()\n\
\tout["gm"] = graphic_methods()\n\
\tout["template"] = templates()\n\
\treturn out\n\
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
        this.currentTemplate= '';
        this.props = {
            variables: ["TestVar1", "TestVar2", "TestVariable3"],
            graphicsMethods: {
                "default":
                    ['boxfill',
                        'isofill',
                        'isoline',
                        'meshfill',
                        'scatter',
                        'vector',
                        'streamline',
                        'xvsy',
                        'xyvsy',
                        'yxvsx',
                        'taylordiagram',
                        '1d',
                        '3d_scalar',
                        '3d_dual_scalar',
                        '3d_vector']
            },
            templates: ['ASD', 'ASD_dud', 'BL_of6_1legend',
                'BLof6', 'BR_of6_1legend', 'BRof6', 'LLof4', 
                'LLof4_dud', 'LRof4', 'LRof4_dud', 'ML_of6', 
                'ML_of6_1legend', 'MR_of6', 'MR_of6_1legend', 
                'UL_of6_1legend', 'ULof4', 'ULof4_dud', 'ULof6', 
                'UR_of6', 'UR_of6_1legend', 'URof4', 'URof4_dud', 
                'bold_mid_of3', 'bold_top_of3', 'boldbot_of3_l', 
                'boldmid_of3_l', 'boldtop_of3_l', 'bot_of2', 'default', 
                'deftaylor', 'hovmuller', 'mollweide2', 'no_legend', 
                'polar', 'por_botof3', 'por_botof3_dud', 'por_midof3', 
                'por_midof3_dud', 'por_topof3', 'por_topof3_dud', 
                'quick', 'top_of2'],

            //The handlers below are run when a variable, template or graphicMethod link is clicked
            varClickHandler: (listName: string, varName: string) => {
                listName = listName.replace(/\s/g, '');
                varName = varName.replace(/\s/g, '');
                if(this.currentVariable != varName){
                    this.currentVariable = varName;
                    let varString = `selectedVariable = ${varName}`;
                    this.currentPanel.console.inject(varString);
                }
            },
            templateClickHandler: (listName: string, tmplName: string) => {
                tmplName = tmplName.replace(/\s/g, '');
                if(this.currentTemplate != tmplName){
                    this.currentTemplate = tmplName;
                    let tmplString = `template = x.gettemplate('${tmplName}')`;
                    this.currentPanel.console.inject(tmplString);
                }
            },
            graphClickHandler: (graphicType: string, graphicName: string) => {
                graphicName = graphicName.replace(/\s/g, '');
                graphicType = graphicType.replace(/\s/g, '');
                if(this.currentGm != graphicName){
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
                let plotString = `x.plot(${this.currentVariable}, ${this.currentGm}, ${this.currentTemplate})`;
                this.currentPanel.console.inject(plotString);
            }
        };
        this.component = ReactDOM.render(
            <LeftSideBar {...this.props} />,
            this.div);

        this.updateVars = this.updateVars.bind(this);
        this.reRender = this.reRender.bind(this);
        this.updateVars();
    }
    updatePath(file_path: string) {
        this.component.setState({
            file_path: file_path
        });
    }
    //Called whenever the LeftSideBar needs it's props updated.
    reRender() {
        ReactDOM.unmountComponentAtNode(this.div);//Remove old LeftSideBar (avoid memory leak)
        this.component = ReactDOM.render(
            <LeftSideBar {...this.props} />,
            this.div);
    }

    //Helper function to convert console output string to an object/dictionary
    outputStrToDict(output: string) {
        var dict: any = { variables: {}, templates: {}, graphicsMethods: {} };
        var outputElements = output.replace(/\'/g, "").split('|');
        dict.variables = outputElements[0].slice(1, -1).split(',');
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
                console.log(pair);
                dict.graphicsMethods[prevKey] = pair[0].slice(2).split(',');
                prevKey = pair[1];
            }
        });

        return dict;
    }

    //This is where the code injection occurs in the current console.
    updateVars() {

        if (!this.currentPanel) {
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
                    var injectCmd = `import cdms2\nimport vcs\nx = vcs.init()\ndata = cdms2.open('${this.context.session.path}')`
                    this.currentPanel.console.inject(injectCmd);

                    //Command to put variables
                    this.currentPanel.console.inject(GET_VARS_CMD).then(() => {

                        //Once injection is done read output as string
                        var consoleOutputStr: string = document.getElementsByClassName("jp-OutputArea-output")[0].getElementsByTagName("pre")[0].innerHTML;
                        var outputObj = this.outputStrToDict(consoleOutputStr);

                        //Update props
                        this.props.variables = outputObj["variables"];
                        this.props.templates = outputObj["templates"];
                        this.props.graphicsMethods = outputObj["graphicsMethods"];

                        //Rerender the LeftSideBar
                        this.reRender();

                        //Calc the number of cells in console and remove last cell once props are updated
                        var cellCount = this.currentPanel.console.cells.length;
                        console.log("Cell count: " + cellCount);
                        this.currentPanel.console.cells.get(cellCount - 1).close();
                    });
                })
            })
        }
        else {
            // Just inject code, console exists
            console.log('Executing command console: inject');
            this.currentPanel.session.ready.then(() => {

                //Command to put variables
                this.currentPanel.console.inject(GET_VARS_CMD).then((consolePanel) => {

                    //Once injection is done read output as string
                    var consoleOutputStr: string = document.getElementsByClassName("jp-OutputArea-output")[0].getElementsByTagName("pre")[0].innerHTML;
                    console.log(consoleOutputStr);
                    var outputObj = this.outputStrToDict(consoleOutputStr);

                    //Update props
                    this.props.variables = outputObj["variables"];
                    this.props.templates = outputObj["templates"];
                    this.props.graphicsMethods = outputObj["graphicsMethods"];

                    //Rerender the LeftSideBar
                    this.reRender();

                    //Calc the number of cells in console and remove last cell once props are updated
                    var cellCount = this.currentPanel.console.cells.length;
                    console.log("Cell count: " + cellCount);
                    this.currentPanel.console.cells.get(cellCount - 1).close();
                });
            });
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


export default { LeftSideBarWidget, NCViewerWidget };
