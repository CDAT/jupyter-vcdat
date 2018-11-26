import * as React from "react";
import * as $ from "jquery";
import AddEditRemoveNav from "./AddEditRemoveNav";
import { VarLoader } from "./VarLoader";
import { VarEditor } from "./VarEditor";
import { Collapse } from "reactstrap";
import List from "./List";

const base_url = "/vcs";

type VarListProps = {
  file_path: string; // path to the file we're loading variables from
  variables: any; // array of variables {varName: {variableAttributes}}
  loadVariable: any; // function to call when user hits load
  editVariable: any; // function to call when user hits edit after selecting a variable
  varClickHandler: any; // function to call when user clicks on a variable
};
type VarEditState = {
  file_path: string;
  variables: any; // object containing variable information
  axis: any;
  selectedVariable: any; // object with the selected variable info
  collapse: boolean; // should every variable be shown, or just the selected one
};

class VarList extends React.Component<VarListProps, VarEditState> {
  varLoader: VarLoader;
  varEditor: VarEditor;
  constructor(props: VarListProps) {
    super(props);
    this.state = {
      file_path: "",
      variables: {},
      axis: {},
      selectedVariable: {},
      collapse: true
    };

    // variable loader and editor elements
    this.varLoader = (React as any).createRef();
    this.varEditor = (React as any).createRef();

    this.addVariables = this.addVariables.bind(this);
    this.editVariable = this.editVariable.bind(this);
    this.callApi = this.callApi.bind(this);
    this.toggle = this.toggle.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
  }
  toggle() {
    this.setState({
      collapse: !this.state.collapse
    });
  }
  addVariables() {
    let params = $.param({
      file_path: this.props.file_path
    });
    let url = base_url + "/get_vars?" + params;
    this.callApi(url).then((variableAxes: any) => {
      this.setState({
        variables: variableAxes.vars,
        axis: variableAxes.axes
      });
      this.varLoader.toggle();
      this.varLoader.setVariables(variableAxes.vars, variableAxes.axes);
    });
  }
  // update the editor with the selected variable and toggle it open
  editVariable() {
    if (!this.state.selectedVariable) {
      return;
    }
    this.varEditor.updateVariableInfo(this.state.selectedVariable);
    this.varEditor.toggle();
  }
  // call an external API
  callApi = async (url: string) => {
    const response = await fetch(url);
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  };
  // handle click event on variable
  handleItemClick(listName: string, itemName: string) {
    this.setState({
      selectedVariable: itemName
    });
    this.props.varClickHandler(listName, itemName);
  }
  // render the compoenent
  render() {
    let varLoaderProps = {
      variables: {},
      axis: {},
      file_path: this.props.file_path,
      loadVariable: this.props.loadVariable
    };
    let varEditorProps = {
      selectedVariableInfo: this.state.selectedVariable,
      editVariable: this.props.editVariable
    };
    let addEdditRemoveNavProps = {
      title: "Variables",
      addAction: this.addVariables,
      editAction: this.editVariable,
      removeAction: () => {},
      removeText: "",
      addText: "Load a variable",
      editText: "Edit a variable"
    };
    return (
      <div className="left-side-list scroll-area-list-parent var-list-container">
        <VarLoader
          {...varLoaderProps}
          ref={(loader: VarLoader) => (this.varLoader = loader)}
        />
        <VarEditor
          {...varEditorProps}
          ref={(editor: VarEditor) => (this.varEditor = editor)}
        />
        <AddEditRemoveNav {...addEdditRemoveNavProps} />
        <p className="selected-var-display">
          Selected Variable: {this.state.selectedVariable.name}
        </p>
        <Collapse isOpen={this.state.collapse} onClick={this.toggle}>
          <div className="scroll-area">
            <List
              activeItem={""}
              activeList={""}
              listName={""}
              clickAction={this.handleItemClick}
              itemList={this.props.variables}
            />
          </div>
        </Collapse>
      </div>
    );
  }
}

export default VarList;
