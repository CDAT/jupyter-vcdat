import * as React from 'react';
import * as $ from 'jquery';

import { ToastContainer } from 'react-toastify';
import { Button } from 'reactstrap';
import VarList from './VarList';
import GMList from './GMList';
import TemplateList from './TemplateList';

declare var vcs: any;

const leftBtnStyle: React.CSSProperties = {
    margin: '5px',
    // float: 'left'
};
const rightBtnStyle: React.CSSProperties = {
    float: 'right',
    margin: '5px'
};

type LeftSideBarProps = {
    refreshAction: any          // method to call onClick of refresh button
    plotAction: any             // method to call onClico of plot button
    clearAction: any            // clear the console
    varClickHandler: any        // a function that handles when an item in the variables list is clicked.
    graphicsMethods: any        // a dictionary containing graphic method names and values
    graphClickHandler: any      // a handler for clicks on GMList items
    templates: string[]         // list of templates available to the user
    templateClickHandler: any   // a handler for when the user clicks a template
    file_path: string,
    variables: string[]         // list of loaded variables
};
type LeftSideBarState = {
    variables: any,             // object of varnames: varinfo
    graphicsMethods: any,        // list of available graphicsmethods
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
            variables: props.variables,
            graphicsMethods: props.graphicsMethods,
            templates: props.templates,
            showEditVariable: false,
            active_variable: '',
        }
        this.varListEl = (React as any).createRef();

        this.handleVarClick = this.handleVarClick.bind(this);
        this.handleLoadVariable = this.handleLoadVariable.bind(this);
        this.handleVcsLoad = this.handleVcsLoad.bind(this);
        this.updateListInfo = this.updateListInfo.bind(this);
    }
    // pass the vcs object to the VarList
    handleVcsLoad() {
        let vcs_target = $('#vcs-target')[0];
        this.canvas = vcs.init(vcs_target);
        if(!this.varListEl.current){
            setTimeout(() => {
                this.varListEl.current.setupVcs(vcs);
            }, 500)
        } else {
            this.varListEl.current.setupVcs(vcs);
        }
    }
    // setup the global vcs.js object
    componentDidMount() {
        console.log('starting vcs.js load');
        let script = document.createElement('script');
        script.src = `http://localhost:5000/vcs.js`;
        script.async = true;
        script.addEventListener('load', this.handleVcsLoad);
        document.body.appendChild(script);
    }
    // handle click on a variable by opening dimension select modal
    handleVarClick(e: any) {
        debugger;
    }
    // updateFilePath(file_path: string){
    //     this.setState({
    //         file_path: file_path
    //     })
    //     this.varListEl.setState({
    //         file_path: file_path
    //     })
    // }
    // handleSetupConsole(console: any) {
    //     this.console = console;
    //     let script = [
    //         'import cdms2',
    //         'import vcs',
    //         'x = vcs.init()'];
    //     script.forEach((item, idx) => {
    //         this.console.inject(item);
    //     });
    // }
    // handleLoadFile() {
    //     this.console.inject(`data = cdms2.open('${this.props.file_path}')`)
    // }
    updateListInfo(variables: string[], graphicsMethods: any, templates: any){
        this.setState({
            variables: variables,
            graphicsMethods: graphicsMethods,
            templates: templates
        })
    }
    handleLoadVariable(name: string, dimInfo: any) {
        let dimInfoString = `data('${name}'`;
        Object.keys(dimInfo).forEach((item: any) => {
            dimInfoString += `, ${item}=(${dimInfo[item].min}, ${dimInfo[item].max})`;
        })
        dimInfoString += ')';
        this.console.inject(`${name} = ${dimInfoString}`);
        this.props.refreshAction();
    }
    render() {
        return (
            <div className="jupyter-vcdat-ext">
                <div id="app-container">
                    <div id='main-container'>
                        <div id='left-side-bar'>
                            <Button type="button" color="primary" style={leftBtnStyle} onClick={this.props.refreshAction}>
                                Refresh
                            </Button>
                            <Button type="button" color="primary" style={leftBtnStyle} onClick={this.props.clearAction}>
                                Clear
                            </Button>
                            <Button type="button" color="primary" style={rightBtnStyle} onClick={this.props.plotAction}>
                                Plot
                            </Button>
                            <VarList
                                ref={this.varListEl}
                                file_path={this.props.file_path}
                                variables={this.state.variables}
                                varClickHandler={this.props.varClickHandler}
                                loadVariable={this.handleLoadVariable} />
                            <GMList
                                graphicsMethods={this.state.graphicsMethods}
                                graphClickHandler={this.props.graphClickHandler} />
                            <TemplateList
                                templates={this.state.templates}
                                templateClickHandler={this.props.templateClickHandler} />
                            <ToastContainer />
                        </div>
                        <div id="vcs-target"></div>
                    </div>
                </div>
            </div>
        );
    }
}
