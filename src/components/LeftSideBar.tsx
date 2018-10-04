import * as React from 'react';
import * as $ from 'jquery';

import { ToastContainer } from 'react-toastify';
import VarList from './VarList';
import GMList from './GMList';
import TemplateList from './TemplateList';


declare var vcs: any;

type LeftSideBarProps = {};
type LeftSideBarState = {
    file_path: string,          // path to the file in question
    variables: any,             // object of varnames: varinfo
    graphicMethods: any,        // list of available graphicsmethods
    templates: any,             // list of availabe templates
    showEditVariable: boolean,  // should the edit variable modal show up
    active_variable: string     // name of the selected variable
};

export class LeftSideBar extends React.Component<LeftSideBarProps, LeftSideBarState> {

    canvas: any;
    console: any;
    varListEl: any;
    constructor(props: LeftSideBarProps) {
        super(props);
        this.state = {
            file_path: '',
            variables: [],
            graphicMethods: [],
            templates: [],
            showEditVariable: false,
            active_variable: '',
        }
        this.varListEl = (React as any).createRef();

        this.handleVCSLoad = this.handleVCSLoad.bind(this);
        this.handleVarClick = this.handleVarClick.bind(this);
        this.handleLoadVariable = this.handleLoadVariable.bind(this);
        this.handleLoadFile = this.handleLoadFile.bind(this);
    }
    // initialize the vcs.js object and pass it the children that need it
    handleVCSLoad() {
        console.log('vcs.js load complete');
        let vcs_target = $('#vcs-target')[0];
        this.canvas = vcs.init(vcs_target);
        this.varListEl.current.setupVcs(vcs);
    }
    // setup the global vcs.js object
    componentDidMount() {
        console.log('starting vcs.js load');
        let script = document.createElement('script');
        script.src = `http://localhost:5000/vcs.js`;
        script.async = true;
        script.addEventListener('load', this.handleVCSLoad);
        document.body.appendChild(script);
    }
    // handle click on a variable by opening dimension select modal
    handleVarClick(e: any) {
        debugger;
    }
    handleSetupConsole(console: any) {
        this.console = console;
        let script = [
            'import cdms2',
            'import vcs',
            'x = vcs.init()'];
        script.forEach((item, idx) => {
            this.console.inject(item);
        });
    }
    handleLoadFile() {
        this.console.inject(`data = cdms2.open('${this.state.file_path}')`)
    }
    handleLoadVariable(variable: string) {
        this.console.inject(`${variable} = data('${variable}')`)
    }
    render() {
        return (
            <div id="vcdat-left-side-bar">
                <div id="app-container">
                    <div id='main-container'>
                        <div id='left-side-bar'>
                            <VarList ref={this.varListEl}
                                file_path={this.state.file_path}
                                variables={this.state.variables}
                                handleClick={this.handleVarClick}
                                loadVariable={this.handleLoadVariable} />
                            <GMList
                                graphicMethods={this.state.graphicMethods} />
                            <TemplateList
                                templates={this.state.templates} />
                            <ToastContainer />
                        </div>
                        <div id="vcs-target"></div>
                    </div>
                </div>
            </div>
        );
    }
}
