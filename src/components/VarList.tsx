import * as React from 'react';
import { toast } from 'react-toastify';
import AddEditRemoveNav from './AddEditRemoveNav';

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
    }
    
    addVariable() {
        toast.info("A form should open for a variable to be added.", { position: toast.POSITION.BOTTOM_CENTER })
    }

    editVariable() {
        toast.info("A form should open for a variable to be edited.", { position: toast.POSITION.BOTTOM_CENTER })
    }

    removeVariable() {
        toast.info("A variable will be removed from the list", { position: toast.POSITION.BOTTOM_CENTER })
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
                    <ul id='var-list' className='no-bullets left-list'>
                        {Object.keys(this.props.variables).map((value, index) => {
                            return(
                                <li>
                                    Key: {index} Value: {value}
                                </li>
                            ) 
                        })}
                    </ul>
                </div>
            </div>
        )
    }
}

export default VarList;
