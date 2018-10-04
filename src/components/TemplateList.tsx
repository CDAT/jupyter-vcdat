import * as React from 'react';
import AddEditRemoveNav from './AddEditRemoveNav';
import { toast } from 'react-toastify';

class TemplateList extends React.Component <any, any> {
    constructor(props: any){
        super(props)
        this.state = {
            showTemplateEditor: false,
            showTemplateCreator: false,
        }
        this.addTemplate = this.addTemplate.bind(this);
        this.editTemplate = this.editTemplate.bind(this);
        this.removeTemplate = this.removeTemplate.bind(this);
    }
    
    addTemplate() {
        toast.info("A form should open for a variable to be added.", { position: toast.POSITION.BOTTOM_CENTER });
    }

    editTemplate() {
        toast.info("A form should open for a variable to be edited.", { position: toast.POSITION.BOTTOM_CENTER });
    }

    removeTemplate() {
        toast.info("A variable will be removed from the list", { position: toast.POSITION.BOTTOM_CENTER });
    }

    render() {
        return (
            <div className='left-side-list scroll-area-list-parent template-list-container'>
                <AddEditRemoveNav
                    addText="Create a new template"
                    addAction={undefined}
                    editAction={this.editTemplate}
                    editText="Edit a selected template"
                    removeAction={this.removeTemplate}
                    removeText="Remove a template"
                    title='Templates'
                />
                <div className='scroll-area'>
                    <ul id='temp-list' className='no-bullets left-list'>
                        {Object.keys(this.props.templates).map((value, index) => {
                            return(
                                <li>
                                    Key: {index} Value: {value}
                                </li>
                            ) 
                        })}
                    </ul>
                </div>
            </div>
        );
    }
}

export default TemplateList;
