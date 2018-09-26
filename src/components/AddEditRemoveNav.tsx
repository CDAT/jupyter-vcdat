import * as React from 'react';
import "./../../style/css/AddEditRemoveNav.css";

class AddEditRemoveNav extends React.PureComponent <any> {
        
    constructor(props: any) {
        super(props);
        this.props = props;
    }

    render() {
        return (
            <nav id="add-edit-remove-nav" className="navbar navbar-default">
                <div className="container-fluid">
                    <div>
                        <ul className="nav navbar-nav navbar-right side-nav">
                            <li className="action-add-button">
                                <a href='#' onClick={this.props.addAction} title={this.props.addText ? this.props.addText : ""}>
                                    <i className={`glyphicon glyphicon-plus-sign ${this.props.addAction ? "" : "disabled"}`}></i>
                                </a>
                            </li>
                            <li className="action-edit-button">
                                <a href="#" onClick={this.props.editAction} title={this.props.editText ? this.props.editText : ""}>
                                    <i className={`glyphicon glyphicon-edit ${this.props.editAction ? "" : "disabled"}`}></i>
                                </a>
                            </li>
                            <li className="action-remove-button">
                                <a href="#" onClick={this.props.removeAction} title={this.props.removeText ? this.props.removeText : ""}>
                                    <i className={`glyphicon glyphicon-remove-sign ${this.props.removeAction ? "" : "disabled"}`}></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <p className='side-nav-header'>{this.props.title}</p>
                </div>
            </nav>
        )
    }
}

export default AddEditRemoveNav;