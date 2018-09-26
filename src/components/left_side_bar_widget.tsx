import { Widget } from '@phosphor/widgets';

import * as React from 'react';

import * as ReactDOM from 'react-dom';

import { LeftSideBar } from './LeftSideBar';

class LeftSideBarWidget extends Widget {
    constructor(){
        super();
        this.div = document.createElement('div');
        this.div.id = 'left-sidebar';
        this.node.appendChild(this.div);
        console.log('firing LeftSideBar constructor');

        let props = {
            
        };
        ReactDOM.render(<LeftSideBar {...props}></LeftSideBar>,this.div);
    }
    div: HTMLDivElement;
}

export default LeftSideBarWidget;