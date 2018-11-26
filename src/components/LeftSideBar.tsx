import * as React from "react";
import * as $ from "jquery";

import { ToastContainer } from "react-toastify";
import { Button } from "reactstrap";
// import GMMenu from "./GMMenu";
// import TemplateMenu from "./TemplateMenu";
import PlotMenu from "./PlotMenu";
import VarMenu from "./VarMenu";

const leftBtnStyle: React.CSSProperties = {
  margin: "5px"
  // float: 'left'
};

type LeftSideBarProps = {
  refreshAction: any; // method to call onClick of refresh button
  plotAction: any; // method to call onClico of plot button
  clearAction: any; // clear the console
  varClickHandler: any; // a function that handles when an item in the variables list is clicked.
  graphicsMethods: any; // a dictionary containing graphic method names and values
  graphClickHandler: any; // a handler for clicks on GMList items
  templates: string[]; // list of templates available to the user
  templateClickHandler: any; // a handler for when the user clicks a template
  file_path: string;
  variables: string[]; // list of loaded variables
  inject: any;
};
type LeftSideBarState = {
  variables: any; // object of varnames: varinfo
  graphicsMethods: any; // list of available graphicsmethods
  templates: any; // list of availabe templates
  showEditVariable: boolean; // should the edit variable modal show up
  active_variable: string; // name of the selected variable
};

export class LeftSideBar extends React.Component<
  LeftSideBarProps,
  LeftSideBarState
> {
  canvas: any;
  notebook: any;
  varListEl: any;
  constructor(props: LeftSideBarProps) {
    super(props);
    this.state = {
      variables: props.variables,
      graphicsMethods: props.graphicsMethods,
      templates: props.templates,
      showEditVariable: false,
      active_variable: ""
    };
    this.varListEl = (React as any).createRef();

    this.handleVarClick = this.handleVarClick.bind(this);
    this.handleLoadVariable = this.handleLoadVariable.bind(this);
    this.updateListInfo = this.updateListInfo.bind(this);
  }
  // handle click on a variable by opening dimension select modal
  handleVarClick(e: any) {
    debugger;
  }
  updateListInfo(variables: string[], graphicsMethods: any, templates: any) {
    this.setState({
      variables: variables,
      graphicsMethods: graphicsMethods,
      templates: templates
    });
  }
  handleLoadVariable(name: string, dimInfo: any) {
    let dimInfoString = `data('${name}'`;
    Object.keys(dimInfo).forEach((item: any) => {
      dimInfoString += `, ${item}=(${dimInfo[item].min}, ${dimInfo[item].max})`;
    });
    dimInfoString += ")";
    this.props.inject(`${name} = ${dimInfoString}`);
    this.props.refreshAction();
  }
  render() {
    return (
      <div className="jupyter-vcdat-ext">
        <div id="app-container">
          <div id="main-container">
            <div id="left-side-bar">
              <PlotMenu plotAction={this.props.plotAction} />
              <VarMenu
                file_path={this.props.file_path}
                variables={this.state.variables}
                varClickHandler={this.props.varClickHandler}
                loadVariable={this.handleLoadVariable}
                editVariable={this.handleLoadVariable}
              />
              {/* <GMMenu
                                graphicsMethods={this.state.graphicsMethods}
                                graphClickHandler={this.props.graphClickHandler} />
                            <TemplateMenu
                                templates={this.state.templates}
                                templateClickHandler={this.props.templateClickHandler} /> */}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
