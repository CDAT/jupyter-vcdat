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

import { NCViewerWidget, LeftSideBarWidget } from "./widgets";
import { INotebookTracker, NotebookTracker } from "@jupyterlab/notebook";

import "../style/css/index.css";
import { notebook_utils } from "./notebook_utils";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcs";

// Declare the widget variables
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
function activate(app: JupyterLab, tracker: NotebookTracker): void {
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

  // Creates the left side bar widget once the app has fully started
  app.started.then(() => {
    sidebar = new LeftSideBarWidget(app, tracker);
    sidebar.id = "vcdat-left-side-bar";
    sidebar.title.iconClass = "jp-vcdat-icon jp-SideBar-tabIcon";
    sidebar.title.closable = true;

    // Attach it to the left side of main area
    shell.addToLeftArea(sidebar);

    // Activate the widget
    shell.activateById(sidebar.id);
  });

  // Initializes the sidebar widget once the application shell has been restored
  // and all the widgets have been added to the notebooktracker
  app.shell.restored.then(() => {
    sidebar.initialize();
  });
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

    if (sidebar == null || context == null) {
      return;
    }

    // Activate sidebar widget
    shell.activateById(sidebar.id);

    // Prepare the notebook for code injection
    sidebar.prepareNotebookPanel(context.session.name).catch(error => {
      if (error.status == "error") {
        notebook_utils.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        notebook_utils.showMessage("Error", error.message);
      } else {
        notebook_utils.showMessage(
          "Error",
          "An error occurred when preparing the notebook."
        );
      }
    });

    return ncWidget;
  }
}
