import "../style/css/index.css";
import vcdat_utils, { vCDAT_UTILS } from "./vcdat_utils";
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

import { Cell } from "@jupyterlab/cells";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcs";

// Declare the widget variables
let commands: CommandRegistry;
let nb_current: NotebookPanel; // The current notebook panel targeted by the app
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

  /*factory.widgetCreated.connect((sender, widget) => {
    console.log("NCViewerWidget created from factory");
  });*/

  // Creates the left side bar widget once the app has fully started
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
    console.log(shell.activeWidget);
  });

  // Sets the current notebook once the application shell has been restored
  // and all the widgets have been added to the notebooktracker
  app.shell.restored.then(() => {
    if (tracker.currentWidget instanceof NotebookPanel) {
      nb_current = tracker.currentWidget;
      if (nb_current.model.metadata.has("test-key")) {
        console.log("Test key found!");
      }
    } else {
      console.log("Created new notebook at start!");
      sidebar.createNewNotebook("");
    }
  });

  // Notebook tracker will signal when a notebook is changed
  tracker.currentChanged.connect(notebook_switched);
}

// Perform actions when user switches notebooks
function notebook_switched(tracker: NotebookTracker, notebook: NotebookPanel) {
  //console.log(`Notebook changed to ${notebook.title.label}!`);
  nb_current = notebook; // Set the current notebook
  sidebar.notebook = nb_current; // Update sidebar notebook

  //nb_current.content.activeCellChanged.connect(cell_switched);
  try {
    //console.log(vCDAT_UTILS.readOutput(nb_current.content, 0));
    nb_current.content.model.metadata.set("test-key", 1234);
  } catch (error) {
    console.log(error);
  }
  try {
    vCDAT_UTILS.codeInjectSelectCell(nb_current.content,"#This is the first cell\n3 + 2");
    vCDAT_UTILS.selectCell(notebook.content,0);
    vCDAT_UTILS.runSelectCell(commands, nb_current.content).then(output => {
      console.log("1st injection done.");
      console.log(output);
    });
  } catch (error) {
    console.log(error);
  }
}

// Active cell trigger
function cell_switched(notebook: Notebook, cell: Cell) {
  console.log(`Cells changed in ${notebook.title.label}!`);
  try {
    console.log(cell.id);
    console.log(vCDAT_UTILS.readOutput(notebook, notebook.activeCellIndex));
  } catch (error) {
    console.log(error);
  }
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
