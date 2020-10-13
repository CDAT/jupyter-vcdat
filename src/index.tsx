// Dependencies
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
  IDocumentWidget,
} from "@jupyterlab/docregistry";

import { INotebookTracker, NotebookTracker } from "@jupyterlab/notebook";

import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  LabShell,
} from "@jupyterlab/application";

import { ISettingRegistry } from "@jupyterlab/settingregistry";

import { IMainMenu, MainMenu } from "@jupyterlab/mainmenu";
import { ITutorialManager } from "jupyterlab-tutorial";

// Project Components
import "../style/css/index.css";
import { EXTENSIONS } from "./modules/constants";
import NCViewerWidget from "./NCViewerWidget";
import LabControl from "./modules/LabControl";
import AppControl from "./modules/AppControl";
import VCDATWidget from "./VCDATWidget";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcdat";

// Declare the widget variables
let mainWidget: VCDATWidget;
let shell: JupyterFrontEnd.IShell;

/**
 * Initialization data for the jupyter-vcdat extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  activate,
  autoStart: true,
  id: "jupyter-vcdat",
  requires: [
    INotebookTracker,
    IMainMenu,
    ILabShell,
    ITutorialManager,
    ISettingRegistry,
  ],
};

export default extension;

/**
 * Activate the vcs widget extension.
 */
function activate(
  app: JupyterFrontEnd,
  tracker: NotebookTracker,
  menu: MainMenu,
  labShell: LabShell,
  tutorialManager: ITutorialManager,
  settings: ISettingRegistry
): void {
  shell = app.shell;

  const factory = new NCViewerFactory({
    defaultFor: [FILETYPE],
    fileTypes: [FILETYPE],
    name: FACTORY_NAME,
    readOnly: true,
    defaultRendered: [FILETYPE],
  });

  const ft: DocumentRegistry.IFileType = {
    contentType: "file",
    extensions: EXTENSIONS,
    fileFormat: "base64",
    mimeTypes: ["application/netcdf"],
    name: FILETYPE,
  };

  app.docRegistry.addFileType(ft);
  app.docRegistry.addWidgetFactory(factory);

  // Testing LabControl
  LabControl.initialize(app, labShell, menu, settings, tracker).then(
    async (labControl: LabControl) => {
      // Create VCDAT widget, then pass it to app control
      mainWidget = new VCDATWidget("main-widget-vcdat");

      // Once lab control is initialized, create the app control
      await AppControl.initialize(labControl, tutorialManager, mainWidget);
    }
  );
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

    if (mainWidget === null || context === null) {
      return;
    }

    // Activate sidebar widget
    shell.activateById(mainWidget.id);

    AppControl.getInstance().prepareNotebookPanel(context.sessionContext.path);
    // Prepare the notebook for code injection
    /* sidebar.prepareNotebookPanel(context.sessionContext.path).catch((error) => {
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
    });*/

    return ncWidget;
  }
}
