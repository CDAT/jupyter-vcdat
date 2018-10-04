import * as React from 'react';
import * as $ from 'jquery';

import { ToastContainer } from 'react-toastify';
import VarList from './VarList';
import GMList from './GMList';
import TemplateList from './TemplateList';
import { EditVariable } from './EditVariable';

declare var vcs: any;

type LeftSideBarProps = {};
type LeftSideBarState = {
    file_path: string,
    variables: any, // object of varnames: varinfo
    graphicMethods: any,
    templates: any,
    showEditVariable: boolean, // should the edit variable modal show up
    active_variable: string // name of the selected variable
};
/**
 * A left sidebar container that holds the variable, graphics methods and templates lists.
 * 
 * props: 
 *  varClickHandler: a function that handles when an item in the variables list is clicked.
 *  variables: A dictionary containing variable names and values
 *  graphicMethods: A dictionary conatining graphic method names and values
 *  templates: A dictionary conatining template names and values
 */
export class LeftSideBar extends React.Component<LeftSideBarProps, LeftSideBarState> {
    
    canvas: any;
    constructor(props: any){
        super(props);
        this.state = {
            file_path: '',
            variables: [],
            graphicMethods: [],
            templates: [],
            showEditVariable: false,
            active_variable: ''
        }
        this.handleVCSLoad = this.handleVCSLoad.bind(this);
        this.handleVarClick = this.handleVarClick.bind(this);
    }
    // initialize the vcs.js object and query for variable info
    handleVCSLoad(){
        debugger;
        console.log('vcs.js load complete');
        let vcs_target = $('#vcs-target')[0];
        this.canvas = vcs.init(vcs_target);

        vcs.allvariables(this.state.file_path).then((variableAxes: any) => {
            this.setState({
                variables: variableAxes[0]
            })
        })
    }
    // setup the global vcs.js object
    componentDidMount(){
        console.log('starting vcs.js load');
        let script = document.createElement('script');
        script.src = `http://localhost:5000/vcs.js`;
        script.async = true;
        script.addEventListener('load', this.handleVCSLoad);
        document.body.appendChild(script);
    }
    // handle click on a variable by opening dimension select modal
    handleVarClick(){
        debugger;
    }
    render() {
        return (
            <div id="vcdat-left-side-bar">
                <div id="app-container">
                    <div id='main-container'>
                        <div id='left-side-bar'>
                            <VarList 
                                variables={this.state.variables}
                                handleClick={this.handleVarClick}/>
                            <GMList 
                                graphicMethods={this.state.graphicMethods}/>
                            <TemplateList
                                templates={this.state.templates}/>
                            <ToastContainer />
                        </div>
                        <div id="vcs-target"></div>
                    </div>
                </div>
                <EditVariable
                    show={this.state.showEditVariable}
                    onTryClose={() => {this.setState({ showEditVariable: false })}}
                    active_variable={this.state.active_variable}/>
            </div>
        );
    }
}
