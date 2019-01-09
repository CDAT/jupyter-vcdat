import "../style/css/index.css";

import {
  ABCWidgetFactory,
  DocumentRegistry,
  IDocumentWidget,
  DocumentWidget
} from "@jupyterlab/docregistry";

import {
  JupyterLab,
  JupyterLabPlugin,
  ApplicationShell
} from "@jupyterlab/application";

import { CommandRegistry } from "@phosphor/commands";
import { NCViewerWidget, LeftSideBarWidget } from "./widgets";
import {
  INotebookTracker,
  NotebookTracker,
  NotebookPanel,
  Notebook
} from "@jupyterlab/notebook";

import { Cell, ICellModel, isCodeCellModel } from "@jupyterlab/cells";
import { nbformat } from "@jupyterlab/coreutils";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcs";

// Declare the widget variables
let commands: CommandRegistry;
let nb_current: NotebookPanel; // The current notebook panel target of the app
let sidebar: LeftSideBarWidget; // The sidebar widget of the app
let shell: ApplicationShell;

/**
 * Initialization data for the jupyter-vcdat extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: "jupyter-vcdat",
  autoStart: true,
  requires: [INotebookTracker],
  activate: activate
};

export default extension;

/**
 * Activate the vcs widget extension.
 */
function activate(app: JupyterLab, tracker: NotebookTracker) {
  commands = app.commands;
  shell = app.shell;

  const factory = new NCViewerFactory({
    name: FACTORY_NAME,
    fileTypes: [FILETYPE],
    defaultFor: [FILETYPE],
    readOnly: true
  });

  let ft: DocumentRegistry.IFileType = {
    name: FILETYPE,
    extensions: [".nc"],
    mimeTypes: ["application/netcdf"],
    contentType: "file",
    fileFormat: "base64"
  };

  app.docRegistry.addFileType(ft);
  app.docRegistry.addWidgetFactory(factory);

  factory.widgetCreated.connect((sender, widget) => {
    console.log("NCViewerWidget created from factory");
  });

  // Creates the left side bar widget when the app has started
  app.started.then(() => {

    // Create the left side bar
    sidebar = new LeftSideBarWidget(commands, tracker);
    sidebar.id = "vcdat-left-side-bar";
    //sidebar.title.label = "vcdat";
    sidebar.title.iconClass = "jp-vcdat-icon jp-SideBar-tabIcon";
    //sidebar.title.iconLabel = "vcdat";
    sidebar.title.closable = true;

    // Attach it to the left side of main area
    shell.addToLeftArea(sidebar);

    // Activate the widget
    shell.activateById(sidebar.id);

    console.log(tracker.currentChanged);
    if (tracker.currentWidget instanceof NotebookPanel) {
      nb_current = tracker.currentWidget;
      console.log(nb_current.context.path);
    } else {
      console.log("Created new notebook at start!");
      sidebar.createNewNotebook("");
    }
  });

  let nb: Notebook;

  // Returns a string value of the cell output given the notebook and cell index
  // If the cell has no output, returns null
  function readOutput(notebook: Notebook, cellIndex: number): any {
    let msg: string = ""; // For error tracking
    if (notebook) {
      if (cellIndex >= 0 && cellIndex < notebook.model.cells.length) {
        let cell: ICellModel = notebook.model.cells.get(cellIndex);
        if (isCodeCellModel(cell)) {
          let codeCell = cell;
          if (codeCell.outputs.length < 1) {
            return null;
          } else {
            let out = codeCell.outputs.toJSON().pop();
            if (nbformat.isExecuteResult(out)) {
              let exec_data: nbformat.IExecuteResult = out;
              return exec_data.data["text/plain"];
            } else {
              msg = "The cell output is not expected format.";
            }
          }
        } else {
          msg = "cell is not a code cell.";
        }
      } else {
        msg = "Cell index out of range.";
      }
    }

    throw new Error(msg);
  }

  // Perform actions when user switches notebooks
  function notebook_switched(
    tracker: NotebookTracker,
    notebook: NotebookPanel
  ) {
    if (nb && nb.model.metadata.has("test-key")) {
      console.log(
        `This notebook has been visited before! ${nb.model.metadata.get(
          "test-key"
        )}`
      );
    }
    console.log(`Notebook changed to ${notebook.title.label}!`);
    nb = notebook.content;
    sidebar.notebook = nb;
    nb.activeCellChanged.connect(cell_switched);
    try {
      console.log(readOutput(nb, 0));
      nb.model.metadata.set("test-key", 1234);
    } catch (error) {
      console.log(error);
    }
  }

  // Active cell trigger
  function cell_switched(notebook: Notebook, cell: Cell) {
    console.log(`Cells changed in ${notebook.title.label}!`);
    try {
      console.log(readOutput(notebook, notebook.activeCellIndex));
    } catch (error) {
      console.log(error);
    }
    /*if (cell instanceof CodeCell) {
      let codeCell: CodeCell = cell;
      let outputs: nbformat.IOutput[] = codeCell.outputArea.model.toJSON();
      if (outputs.length < 1) {
        console.log("No outputs!");
        return;
      }
      let output: any = outputs.pop();
      if (output.output_type == "execute_result") {
        console.log(output);
        let exec_data: nbformat.IExecuteResult = output;
        console.log(exec_data.data);
        console.log(exec_data.data["text/plain"]);
      } else {
        console.log("No execution result.");
      }
    }*/
  }

  // Notebook tracker will signal when a notebook is changed
  tracker.currentChanged.connect(notebook_switched);

  // Whenever a panel is changed in the shell, this will trigger
  /*app.shell.activeChanged.connect((sender, data) => {
    let widget = shell.activeWidget;
    if (widget) {
      console.log(widget);
      if (widget.hasClass("jp-NotebookPanel")) {
        sidebar.notebook = widget;

        console.log(
          `User switched to notebook with label: ${widget.title.label}`
        );
      }
    }*/
  /*if (
      data.oldValue &&
      data.newValue &&
      data.newValue.hasClass("jp-NotebookPanel")
    ) {
      console.log(data.newValue);
      console.log(
        `User switched to notebook with label: ${data.newValue.title.label}`
      );
    }
  });*/
}

/**
 * Create a new widget given a context.
 */
export class NCViewerFactory extends ABCWidgetFactory<
  IDocumentWidget<NCViewerWidget>
> {
  protected createNewWidget(
    context: DocumentRegistry.Context
  ): IDocumentWidget<NCViewerWidget> {
    const content = new NCViewerWidget(context);
    const ncWidget = new DocumentWidget({ content, context });

    if (sidebar) {
      // Activate sidebar widget
      shell.activateById(sidebar.id);

      // Get name of opened file
      sidebar.current_file = context.session.name;
      console.log(sidebar.current_file);

      //Get the current active notebook if a notebook is opened
      if (shell.activeWidget == nb_current) {
        sidebar.notebook = nb_current;

        sidebar.getReadyNotebook();
      } else {
        shell.activateById(nb_current.id);
        sidebar.getReadyNotebook();
      }
    }

    return ncWidget;
  }
}
