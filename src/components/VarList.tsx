import * as React from 'react';
import { toast } from 'react-toastify';
import AddEditRemoveNav from './AddEditRemoveNav';
import List from "./List";

/**
 * A test component to show variables list where variables can be clicked on.
 * 
 * props:
 *  variables: A dictionary containing key value pairs of variable names and their data.
 *  clickHandler: onClick handler for when a specific variable in the list is clicked,
 *  the onClick event is passed to the function.
 */

class VarList extends React.Component <any, any> {
    constructor(props: any){
        super(props)
        this.state = {
            showFile: false,
            showEdit: false
        }
        this.addVariable = this.addVariable.bind(this);
        this.editVariable = this.editVariable.bind(this)
        this.removeVariable = this.removeVariable.bind(this)
        this.varClickHandler = this.varClickHandler.bind(this);
    }
    
    addVariable() {
        console.log("A form should open for a variable to be added.");
        toast.info("A form should open for a variable to be added.", { position: toast.POSITION.BOTTOM_CENTER })
    }

    editVariable() {
        console.log("A form should open for a variable to be edited.");
        toast.info("A form should open for a variable to be edited.", { position: toast.POSITION.BOTTOM_CENTER })
    }

    removeVariable() {
        console.log("A variable will be removed from the list.");
        toast.info("A variable will be removed from the list.", { position: toast.POSITION.BOTTOM_CENTER })
    }

    varClickHandler(listName: string, varName: string) {
        this.props.varClickHandler(listName,varName);
    }

    render() {
        return (
            <div className='left-side-list scroll-area-list-parent var-list-container'>
                <AddEditRemoveNav 
                    title='Variables'
                    addAction={()=>this.setState({ showFile: true, showEdit: false })} 
                    editAction={()=>this.editVariable()}
                    removeAction={()=>this.removeVariable()}
                    addText="Load a variable"
                    editText="Edit a loaded variable"
                    removeText="Remove a loaded variable"
                />
                <div className='scroll-area'>
                    <List 
                        clickAction={this.varClickHandler}
                        itemList={this.props.variables}
                        hidden={false}
                    />
                </div>
                {/*<div className='scroll-area'>
                    <ul id='var-list' className='no-bullets left-list'>
                        {Object.keys(this.props.variables).map((key, index) => {
                            return(
                                <li>
                                    <a href='#' onClick={(e) => {this.clickItemHandler(e,key,this.props.variables[key])}}>   Key: {key} Value: {this.props.variables[key]}</a>
                                </li>
                            ) 
                        })}
                    </ul>
                    </div>*/}
            </div>
        )
    }
}

export default VarList;
