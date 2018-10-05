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
 *  refreshAction: A function that handles the refresh button
 *  plotAction: A function that handles the plot button
 */

const leftBtnStyle = {
    margin: '5px',
}

const rightBtnStyle = {
    float: 'right',
    margin: '5px'
}

export class LeftSideBar extends React.Component <any, any> {

    render() {
        return (
            <div id="vcdat-left-side-bar">
                <div id="app-container">
                    <div id='main-container'>
                        <div id='left-side-bar'>
                            <button type="button" style={leftBtnStyle} onClick={this.props.refreshAction}>Refresh</button>
                            <button type="button" style={rightBtnStyle} onClick={this.props.plotAction}>Plot</button><br />
                            <VarList
                                varClickHandler={this.props.varClickHandler}
                                variables={this.props.variables}
                            />
                            <GMList 
                                graphClickHandler={this.props.graphClickHandler}
                                graphicsMethods={this.props.graphicsMethods}
                            />
                            <TemplateList
                                tmplClickHandler={this.props.tmplClickHandler}
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
