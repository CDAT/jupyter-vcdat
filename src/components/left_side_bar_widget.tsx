import { Widget } from '@phosphor/widgets';

import * as React from 'react';

import * as ReactDOM from 'react-dom';

import { LeftSideBar } from './LeftSideBar';
import { CommandRegistry } from '@phosphor/commands';

function injectCode(commands: CommandRegistry, code: string){

    commands.execute('console:create', {
        activate: true,
        }).then(consolePanel => {
                consolePanel.session.ready.then(() => {
                consolePanel.console.inject(code);
            });
        });
}

class LeftSideBarWidget extends Widget {

    constructor(commands: CommandRegistry){
        super();
        this.div = document.createElement('div');
        this.div.id = 'left-sidebar';
        this.node.appendChild(this.div);
        console.log('firing LeftSideBar constructor');

        let props = {
            variables: {"TestVar1":123,"TestVar2":"The value","TestVariable3":1234},
            graphicMethods: {"GraphicsMethod1":123,"Method2":"Thevalue","GMethod 3":1234},
            templates: {"Template 1":123,"Template 2":"The template?","Template 3":1234},
            varClickHandler: (varName: string, varVal: any)=>{
                injectCode(commands,"#Hello world! Code injection example.\n" + varName + " = " + varVal + " \nmsg = 'hello world! {0} is equal to: {1}'.format('" + 
                varName + "'," + varVal + ")\nprint(msg)");
            }
        };
        ReactDOM.render(<LeftSideBar {...props}></LeftSideBar>,this.div);
    }
    div: HTMLDivElement;
}

export default LeftSideBarWidget;