// Dependencies
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
  IDocumentWidget
} from "@jupyterlab/docregistry";

import {
  ApplicationShell,
  JupyterLab,
  JupyterLabPlugin
} from "@jupyterlab/application";

import { IMainMenu, MainMenu } from "@jupyterlab/mainmenu";
import { INotebookTracker, NotebookTracker } from "@jupyterlab/notebook";

// Project Components
import "../style/css/index.css";
import { EXTENSIONS } from "./constants";
import { LeftSideBarWidget } from "./widgets";
import { NCViewerWidget } from "./NCViewerWidget";
import { NotebookUtilities } from "./NotebookUtilities";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcs";

// Declare the widget variables
let sidebar: LeftSideBarWidget; // The sidebar widget of the app
let shell: ApplicationShell;
let mainMenu: MainMenu;

/**
 * Initialization data for the jupyter-vcdat extension.
 */
const extension: JupyterLabPlugin<void> = {
  activate,
  autoStart: true,
  id: "jupyter-vcdat",
  requires: [INotebookTracker, IMainMenu]
};

export default extension;

/**
 * Activate the vcs widget extension.
 */
function activate(
  app: JupyterLab,
  tracker: NotebookTracker,
  menu: MainMenu
): void {
  shell = app.shell;
  mainMenu = menu;

  const factory = new NCViewerFactory({
    defaultFor: [FILETYPE],
    fileTypes: [FILETYPE],
    name: FACTORY_NAME,
    readOnly: true
  });

  const ft: DocumentRegistry.IFileType = {
    contentType: "file",
    extensions: EXTENSIONS,
    fileFormat: "base64",
    mimeTypes: ["application/netcdf"],
    name: FILETYPE
  };

  app.docRegistry.addFileType(ft);
  app.docRegistry.addWidgetFactory(factory);

  // Creates the left side bar widget once the app has fully started
  app.started
    .then(() => {
      sidebar = new LeftSideBarWidget(app, tracker);
      sidebar.id = "vcdat-left-side-bar";
      sidebar.title.iconClass = "jp-vcdat-icon jp-SideBar-tabIcon";
      sidebar.title.closable = true;

      // Attach it to the left side of main area
      shell.addToLeftArea(sidebar);

      // Activate the widget
      shell.activateById(sidebar.id);
    })
    .catch(error => {
      console.error(error);
    });

  // Initializes the sidebar widget once the application shell has been restored
  // and all the widgets have been added to the notebooktracker
  app.shell.restored
    .then(() => {
      addHelpReference(
        mainMenu,
        "VCS Reference",
        "https://cdat-vcs.readthedocs.io/en/latest/"
      );
      addHelpReference(
        mainMenu,
        "CDMS Reference",
        "https://cdms.readthedocs.io/en/latest/"
      );
      sidebar.initialize();
    })
    .catch(error => {
      console.error(error);
    });
}

// Adds a reference link to the help menu in JupyterLab
function addHelpReference(menu: MainMenu, text: string, url: string): void {
  // Add item to help menu
  menu.helpMenu.menu.addItem({
    args: { text, url },
    command: "help:open"
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

    if (sidebar === null || context === null) {
      return;
    }

    // Activate sidebar widget
    shell.activateById(sidebar.id);

    // Prepare the notebook for code injection
    sidebar.prepareNotebookPanel(context.session.path).catch(error => {
      if (error.status === "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when preparing the notebook."
        );
      }
    });

    return ncWidget;
  }
}
