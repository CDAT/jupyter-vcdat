import * as React from 'react';
import { ToastContainer } from 'react-toastify';
import VarList from './VarList';
import GMList from './GMList';
import TemplateList from './TemplateList';

/**
 * A left sidebar container that holds the variable, graphics methods and templates lists.
 * 
 * props: 
 *  varClickHandler: a function that handles when an item in the variables list is clicked.
 *  variables: A dictionary containing variable names and values
 *  graphicMethods: A dictionary conatining graphic method names and values
 *  templates: A dictionary conatining template names and values
 */

export class LeftSideBar extends React.Component <any> {
    
    render() {
        return (
            <div id="vcdat-left-side-bar">
                <div id="app-container">
                    <div id='main-container'>
                        <div id='left-side-bar'>
                            <VarList
                                clickHandler={this.props.varClickHandler}
                                variables={this.props.variables}
                            />
                            <GMList 
                                graphicMethods={this.props.graphicMethods}
                            />
                            <TemplateList
                                templates={this.props.templates}
                            />
                            <ToastContainer />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
