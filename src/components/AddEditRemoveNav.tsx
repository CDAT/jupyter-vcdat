import * as React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import "./../../style/css/AddEditRemoveNav.css";


type AddEditRemoveNaveProps = {
    title: string       // title for nav
    addAction: any      // action to take click on add
    editAction: any     // action to take for click on edit
    removeAction: any   // action to take for click on remove
    addText: string     // text for add
    editText: string    // text for edit
    removeText: string  // text for remove
}

class AddEditRemoveNav extends React.Component<AddEditRemoveNaveProps, any> {

    constructor(props: AddEditRemoveNaveProps) {
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
    // render() {
    //     return (
    //         <nav id="add-edit-remove-nav" className="navbar navbar-default">
    //             <div className="container-fluid">
    //                 <div>
    //                     <ul className="nav navbar-nav navbar-right side-nav">
    //                         <li className="action-add-button">
    //                             <a href='#' onClick={this.props.addAction} title={this.props.addText ? this.props.addText : ""}>
    //                                 <i className={`glyphicon glyphicon-plus-sign ${this.props.addAction ? "" : "disabled"}`}></i>
    //                                 {/* <i className={`glyphicon glyphicon-plus-sign disabled`}></i> */}
    //                             </a>
    //                         </li>
    //                         <li className="action-edit-button">
    //                             <a href="#" onClick={this.props.editAction} title={this.props.editText ? this.props.editText : ""}>
    //                                 {/*<i className={`glyphicon glyphicon-edit ${this.props.editAction ? "" : "disabled"}`}></i>*/}
    //                                 <i className={`glyphicon glyphicon-edit disabled`}></i>
    //                             </a>
    //                         </li>
    //                         <li className="action-remove-button">
    //                             <a href="#" onClick={this.props.removeAction} title={this.props.removeText ? this.props.removeText : ""}>
    //                                 {/*<i className={`glyphicon glyphicon-remove-sign ${this.props.removeAction ? "" : "disabled"}`}></i>*/}
    //                                 <i className={`glyphicon glyphicon-remove-sign disabled`}></i>
    //                             </a>
    //                         </li>
    //                     </ul>
    //                 </div>
    //                 <p className='side-nav-header'>{this.props.title}</p>
    //             </div>
    //         </nav>
    //     )
    // }
}

export default AddEditRemoveNav;