import "../style/css/index.css";
import { notebook_utils as nb_utils, notebook_utils } from "./notebook_utils";
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
import { REFRESH_VARS_CMD } from "./constants";
import { Cell } from "@jupyterlab/cells";
import { IClientSession } from "@jupyterlab/apputils";
import { Kernel } from "@jupyterlab/services";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcs";

// Declare the widget variables
let commands: CommandRegistry;
let nb_tracker: NotebookTracker;
let nb_panel_current: NotebookPanel; // The current notebook panel targeted by the app
let sidebar: LeftSideBarWidget; // The sidebar widget of the app
let shell: ApplicationShell;
let notebook_active: boolean; // Keeps track whether a notebook is active or not
let var_refresh: boolean; // If true, it means the vars list should be updated

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
  nb_tracker = tracker;

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
    sidebar = new LeftSideBarWidget(commands, nb_tracker);
    sidebar.id = "vcdat-left-side-bar";
    sidebar.title.iconClass = "jp-vcdat-icon jp-SideBar-tabIcon";
    sidebar.title.closable = true;

    // Attach it to the left side of main area
    shell.addToLeftArea(sidebar);

    // Activate the widget
    shell.activateById(sidebar.id);
  });

  // Sets the current notebook once the application shell has been restored
  // and all the widgets have been added to the notebooktracker
  app.shell.restored
    .then(() => {
      // Set active true because if there isn't an active notebook, one will be created.
      notebook_active = true;

      // Activate variable list refresh
      var_refresh = true;

      // Check the active widget is a notebook panel
      if (nb_tracker.currentWidget instanceof NotebookPanel) {
        console.log("Currently open notebook selected.");
        nb_panel_current = nb_tracker.currentWidget;
        sidebar.notebook_panel = nb_panel_current;
        // Track when kernel runs code and becomes idle
        nb_panel_current.session.statusChanged.connect(handleSessionChanged);

        // Track when active cell is changed in current notebook
        nb_panel_current.content.activeCellChanged.connect(handleCellChanged);

        // Notebook tracker will signal when a notebook is changed
        nb_tracker.currentChanged.connect(handleNotebooksChanged);
      } else {
        // There is no active notebook widget, so create a new one
        console.log("Created new notebook at start.");
        nb_utils
          .createNewNotebook(commands)
          .then(notebook => {
            nb_panel_current = notebook;
            sidebar.notebook_panel = notebook;

            // Track when kernel runs code and becomes idle
            nb_panel_current.session.statusChanged.connect(
              handleSessionChanged
            );

            // Track when active cell is changed in current notebook
            nb_panel_current.content.activeCellChanged.connect(
              handleCellChanged
            );

            // Notebook tracker will signal when a notebook is changed
            nb_tracker.currentChanged.connect(handleNotebooksChanged);
          })
          .catch(error => {
            console.log(error);
          });
      }
    })
    .catch(error => {
      notebook_active = false;
      console.log(error);
    });
}

// Perform actions when current notebook is changed
async function handleNotebooksChanged(
  tracker: NotebookTracker,
  notebook: NotebookPanel
) {
  try {
    if (notebook) {
      console.log(`Notebook changed to ${notebook.title.label}.`);

      // Disconnect handlers from previous notebook_panel
      nb_panel_current.session.statusChanged.disconnect(handleSessionChanged);
      nb_panel_current.content.activeCellChanged.disconnect(handleCellChanged);

      // Update current notebook and status
      nb_panel_current = notebook;
      sidebar.notebook_panel = notebook;
      notebook_active = true;

      // Connect handlers to new notebook
      nb_panel_current.session.statusChanged.connect(handleSessionChanged);
      nb_panel_current.content.activeCellChanged.connect(handleCellChanged);
    } else {
      console.log("No active notebook detected.");
      notebook_active = false;
    }
  } catch (error) {
    console.log(error);
  }
}

// Performs actions whenever the current notebook session changes status
async function handleSessionChanged(
  session: IClientSession,
  status: Kernel.Status
) {
  try {
    // Don't do anythin unless kernel is idle, the notebook is vcs ready and variables need a refresh
    if (status == "idle" && sidebar.vcs_ready && var_refresh) {
      // If the status is idle, vcs is ready and variables need to be refreshed
      var_refresh = false;
      //Refresh the variables
      let output: string = await notebook_utils.sendSimpleKernelRequest(
        nb_panel_current,
        REFRESH_VARS_CMD
      );
      //Output gives the list of latest variables. This could be added to the
      console.log(output);
    } else if (status == "idle" && sidebar.vcs_ready) {
      var_refresh = true;
    }
  } catch (error) {
    console.log(error);
    var_refresh = false;
  }
}

// Perform actions when active cell is changed in current notebook
async function handleCellChanged(notebook: Notebook, cell: Cell) {}

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

      // Update the open filepath in sidebar
      sidebar.current_file = context.session.name;

      // Check if there's an open notebook
      if (notebook_active) {
        // Activate the notebook panel if it's not active
        if (shell.activeWidget == nb_panel_current) {
          // Update current notebook to be the active notebook
          sidebar.notebook_panel = nb_panel_current;
        } else {
          shell.activateById(nb_panel_current.id);
        }

        // Prepare the notebook for code injection
        sidebar.getReadyNotebookPanel().catch(error => {
          console.log(error);
        });
      } else {
        //Create a notebook if none is currently open
        console.log(
          "Created new notebook because all other notebooks were closed."
        );
        nb_utils
          .createNewNotebook(commands)
          .then(notebook_panel => {
            sidebar.notebook_panel = notebook_panel;
            sidebar.getReadyNotebookPanel().catch(error => {
              console.log(error);
            });
          })
          .catch(error => {
            console.log(error);
          });
      }
    }

    return ncWidget;
  }
}
