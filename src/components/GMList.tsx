import * as React from "react";
import AddEditRemoveNav from "./AddEditRemoveNav";
import ListSet from "./ListSet";
import { toast } from "react-toastify";

class GMList extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      show_edit_modal: false,
      show_create_modal: false
    };
    this.clickedAdd = this.clickedAdd.bind(this);
    this.clickedEdit = this.clickedEdit.bind(this);
    this.confirmRemove = this.confirmRemove.bind(this);
    this.graphClickHandler = this.graphClickHandler.bind(this);
  }

  clickedAdd() {
    toast.info("A Graphics Method will be created soon :]", {
      position: toast.POSITION.BOTTOM_CENTER
    });
  }

  clickedEdit() {
    toast.info("A Graphics Method must be selected to edit", {
      position: toast.POSITION.BOTTOM_CENTER
    });
  }

  confirmRemove() {
    toast.info("A Graphics Method must be selected to delete", {
      position: toast.POSITION.BOTTOM_CENTER
    });
  }

  graphClickHandler(graphicsType: string, graphicsName: string) {
    this.props.graphClickHandler(graphicsType, graphicsName);
  }

  render() {
    return (
      <div className="left-side-list scroll-area-list-parent gm-list-container">
        <AddEditRemoveNav
          title="Graphics Methods"
          addAction={undefined}
          addText="Create a new Graphics Method"
          editAction={this.clickedEdit}
          editText="Edit a selected graphics method"
          removeAction={this.confirmRemove}
          removeText="Removing a graphics method is not supported yet"
        />
        <ListSet
          listSet={this.props.graphicsMethods}
          clickAction={this.graphClickHandler}
        />
      </div>
    );
  }
}

export default GMList;
