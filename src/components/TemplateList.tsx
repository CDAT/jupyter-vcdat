import * as React from 'react';
import AddEditRemoveNav from './AddEditRemoveNav';
import { toast } from 'react-toastify';
import List from './List';
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
        this.tmplClickHandler = this.tmplClickHandler.bind(this);
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

    tmplClickHandler(listName: string, templateName: string) {
        this.props.tmplClickHandler(listName,templateName);
    }

    render() {
        return (
            <div className='left-side-list scroll-area-list-parent template-list-container'>
                <AddEditRemoveNav
                    addText="Create a new template"
                    addAction={this.addTemplate}
                    editAction={this.editTemplate}
                    editText="Edit a selected template"
                    removeAction={this.removeTemplate}
                    removeText="Remove a template"
                    title='Templates'
                />
                <div className='scroll-area'>
                    <List 
                        clickAction={this.tmplClickHandler}
                        itemList={this.props.templates}
                        hidden={false}
                    />
                </div>
            </div>
        );
    }
}

export default TemplateList;
