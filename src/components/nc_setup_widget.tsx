import { Widget } from '@phosphor/widgets';

import * as React from 'react';

import * as ReactDOM from 'react-dom';

import { VCSComponentLeft } from './vcs_component_left';

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

class NCSetupWidget extends Widget {
    constructor(commands: CommandRegistry){
        super();
        this.div = document.createElement('div');
        this.div.id = 'vcs-component';
        this.node.appendChild(this.div);
        console.log('firing NCViewerWidget constructor');

        let props = {
            var_name: '',
            file_path: '',
            title: 'VCS Python Commands',
            clickHandler: (cmdStr: string) => {
                return injectCode(commands, cmdStr);
            }
        };
        ReactDOM.render(
            <VCSComponentLeft {...props} className="p-Widget p-StackedPanel" ></VCSComponentLeft>,
            this.div)
    }
    div: HTMLDivElement;
}

export default NCSetupWidget;