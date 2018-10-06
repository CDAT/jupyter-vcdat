import * as React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import "./../../style/css/AddEditRemoveNav.css";


type AddEditRemoveNavProps = {
    title: string       // title for nav
    addAction: any      // action to take click on add
    editAction: any     // action to take for click on edit
    removeAction: any   // action to take for click on remove
    addText: string     // text for add
    editText: string    // text for edit
    removeText: string  // text for remove
}

class AddEditRemoveNav extends React.PureComponent<AddEditRemoveNavProps> {

    constructor(props: AddEditRemoveNavProps) {
        super(props);
    }
    render() {
        return (
            <Nav id="add-edit-remove-nav" className="navbar navbar-default" pills>
                <div className="container-fluid">
                    <p>{this.props.title}</p>
                    <NavItem>
                        <NavLink href="#" onClick={this.props.addAction} title={this.props.addText ? this.props.addText : ""}>
                            <i className={`glyphicon glyphicon-plus-sign ${this.props.addAction ? "" : "disabled"}`}></i>
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink href="#" onClick={this.props.editAction} title={this.props.editText ? this.props.editText : ""}>
                            <i className={`glyphicon glyphicon-edit disabled`}></i>
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink href="#" onClick={this.props.removeAction} title={this.props.removeText ? this.props.removeText : ""}>
                            <i className={`glyphicon glyphicon-remove-sign disabled`}></i>
                        </NavLink>
                    </NavItem>
                </div>
            </Nav>
        )
    }
}

export default AddEditRemoveNav;