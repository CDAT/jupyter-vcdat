import * as React from "react";
import * as $ from "jquery";
import { toast } from "react-toastify";
import { VarLoader } from "./VarLoader";
import List from "./List";

const base_url = "/vcs";

type VarListProps = {
  file_path: string; // path to the file we're loading variables from
  variables: any; // array of variables {varName: {variableAttributes}}
  loadVariable: any; // function to call when user hits load
  varClickHandler: any; // function to call when user clicks on a variable
};
type VarEditState = {
  variables: any; // object containing variable information
  axis: any;
  file_path: string;
};

class VarList extends React.Component<VarListProps, VarEditState> {
  varLoader: VarLoader;
  constructor(props: VarListProps) {
    super(props);
    this.state = {
      file_path: "",
      variables: {},
      axis: {}
    };
    this.varLoader = (React as any).createRef();

    this.addVariables = this.addVariables.bind(this);
    this.editVariable = this.editVariable.bind(this);
    this.removeVariable = this.removeVariable.bind(this);
    this.varClickHandler = this.varClickHandler.bind(this);
    this.callApi = this.callApi.bind(this);
  }

  addVariables() {
    let params = $.param({
      file_path: this.props.file_path
    });
    let url = base_url + "/get_axis?" + params;
    this.callApi(url).then((variableAxes: any) => {
      this.setState({
        variables: variableAxes.vars,
        axis: variableAxes.axes
      });
      this.varLoader.toggle();
      this.varLoader.setVariables(variableAxes.vars, variableAxes.axes);
    });
  }

  callApi = async (url: string) => {
    const response = await fetch(url);
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  editVariable() {
    console.log("A form should open for a variable to be edited.");
    toast.info("A form should open for a variable to be edited.", {
      position: toast.POSITION.BOTTOM_CENTER
    });
  }

  removeVariable() {
    console.log("A variable will be removed from the list.");
    toast.info("A variable will be removed from the list.", {
      position: toast.POSITION.BOTTOM_CENTER
    });
  }

  varClickHandler(listName: string, varName: string) {
    this.props.varClickHandler(listName, varName);
  }

  render() {
    let itemStyle = {
      paddingLeft: "1em"
    };
    let varLoaderProps = {
      variables: {},
      axis: {},
      file_path: this.props.file_path,
      loadVariable: this.props.loadVariable
    };
    return (
      <div className="left-side-list scroll-area-list-parent var-list-container">
        <AddEditRemoveNav
          title="Variables"
          addAction={this.addVariables}
          editAction={this.editVariable}
          removeAction={this.removeVariable}
          addText="Load a variable"
          editText="Edit a loaded variable"
          removeText="Remove a loaded variable"
        />
        <VarLoader
          {...varLoaderProps}
          ref={loader => (this.varLoader = loader)}
        />
        <div className="scroll-area">
          <List
            activeItem={""}
            activeList={""}
            listName={""}
            clickAction={this.props.varClickHandler}
            itemList={this.props.variables}
          />
        </div>
      </div>
    );
  }
}

export default VarList;
