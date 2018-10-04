import { Widget } from '@phosphor/widgets';

import * as React from 'react';

import * as ReactDOM from 'react-dom';

import { LeftSideBar } from './components/LeftSideBar';


export class LeftSideBarWidget extends Widget {
    div: HTMLDivElement;
    component: any;
    console: any;
    file_path: string;
    constructor(){
        super();
        this.div = document.createElement('div');
        this.div.id = 'vcs-left-sidebar';
        this.node.appendChild(this.div);

        this.component = ReactDOM.render(
            <LeftSideBar />,
            this.div);
    }
    updatePath(file_path: string){
        this.file_path = file_path;
        this.component.setState({
            file_path: file_path
        });
    }
    updateConsole(console: any){
        this.console = console;
        this.component.setState({
            console: this.console
        });
    }
    
}
