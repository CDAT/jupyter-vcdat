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
import {
  ITutorial,
  ITutorialManager,
  TutorialDefault,
} from "jupyterlab-tutorial";

// Project Components
import "../style/css/index.css";
import {
  EXTENSIONS,
  GETTING_STARTED,
  REPLACEMENT_STEPS,
} from "./modules/constants";
import NCViewerWidget from "./NCViewerWidget";
import LeftSideBarWidget from "./LeftSideBarWidget";
import Utilities from "./modules/Utilities/Utilities";
import { Step } from "react-joyride";
import { AppSettings } from "./modules/AppSettings";
import LabControl from "./modules/LabControl";
import AppControl from "./modules/AppControl";
import VCDATWidget from "./VCDATWidget";
import NotebookUtilities from "./modules/Utilities/NotebookUtilities";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcdat";

// Declare the widget variables
let sidebar: LeftSideBarWidget; // The sidebar widget of the app
let rightbar: VCDATWidget;
let shell: JupyterFrontEnd.IShell;
let mainMenu: MainMenu;

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
  mainMenu = menu;

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
      const appControl: AppControl = await AppControl.initialize(labControl);
      // const appSettings: AppSettings = labControl.settings;
      rightbar = new VCDATWidget("left-sidebar-vcdat");
      rightbar.id = /* @tag<left-side-bar>*/ "left-side-bar-vcdat";
      rightbar.title.iconClass = "jp-SideBar-tabIcon jp-icon-vcdat";
      rightbar.title.closable = true;

      labControl.addCommand(
        "test-vcdat-command",
        (name: string) => {
          console.log(appControl.injectCode(`print("Hello ${name}")`));
        },
        "Hello Test"
      );
      labControl.addCommand("vcdat:refresh-browser", (): void => {
        labControl.commands.execute("filebrowser:go-to-path", {
          path: ".",
        });
      });
      labControl.addCommand(
        "vcdat-show-about",
        () => {
          rightbar.showAbout();
        },
        "About VCDAT",
        "See the VCDAT about page."
      );

      labControl.helpMenuItem("test-vcdat-command", "Billy");
      labControl.helpMenuItem("vcdat-show-about");
      labControl.attachWidget(rightbar, "left");
      labControl.shell.activateById(rightbar.id);
    }
  );

  // Creates the left side bar widget once the app has fully started

  // app.started
  //   .then(() => {
  //     settings.load("jupyter-vcdat:extension").then((loadedSettings) => {
  //       const appSettings: AppSettings = new AppSettings(loadedSettings);
  //       sidebar = new LeftSideBarWidget(app, labShell, tracker, appSettings);
  //       sidebar.id = /* @tag<left-side-bar>*/ "left-side-bar-vcdat";
  //       sidebar.title.iconClass = "jp-SideBar-tabIcon jp-icon-vcdat";
  //       sidebar.title.closable = true;

  //       // Attach it to the left side of main area
  //       shell.add(sidebar, "right");

  //       // Activate the widget
  //       shell.activateById(sidebar.id);
  //     });
  //   })
  //   .catch((error) => {
  //     console.error(error);
  //   });

  // Initializes the sidebar widget once the application shell has been restored
  // and all the widgets have been added to the notebooktracker
  app.restored
    .then(() => {
      // Utilities.addHelpMenuItem(mainMenu, {}, "vcdat-show-about");
      Utilities.addHelpReference(
        mainMenu,
        "VCS Basic Tutorial",
        "https://cdat.llnl.gov/Jupyter-notebooks/vcs/VCS_Basics/VCS_Basics.html"
      );
      Utilities.addHelpReference(
        mainMenu,
        "CDMS Reference",
        "https://cdms.readthedocs.io/en/latest/"
      );

      mainMenu.helpMenu.menu.addItem({ type: "separator" });

      // Create a jupyterlab intro tutorial
      const jupyterlabIntro: ITutorial = tutorialManager.createTutorial(
        "jp_intro",
        "Jupyterlab Tutorial: Intro",
        true
      );
      jupyterlabIntro.steps = TutorialDefault.steps;

      const vcdatIntro: ITutorial = tutorialManager.createTutorial(
        "vcdat_intro",
        `VCDAT Tutorial: Introduction`,
        true
      );

      vcdatIntro.options.styles.backgroundColor = "#fcffff";
      vcdatIntro.options.styles.primaryColor = "#084f44";
      initializeTutorial(vcdatIntro, GETTING_STARTED, updateIntroTutorial);
    })
    .catch((error) => {
      console.error(error);
    });
}

function initializeTutorial(
  tutorial: ITutorial,
  steps: Step[],
  handler: (tutorial: ITutorial) => void
): void {
  tutorial.steps = Utilities.deepCopy(steps);

  function clickListenerOn(t: ITutorial): void {
    shell.node.onclick = (): void => {
      handler(t);
    };
  }
  function clickListenerOff(): void {
    shell.node.onclick = null;
  }

  function stepChangedHandler(t: ITutorial): void {
    handler(t);
  }

  tutorial.started.connect(clickListenerOn);
  tutorial.finished.connect(clickListenerOff);
  tutorial.skipped.connect(clickListenerOff);
  tutorial.stepChanged.connect(stepChangedHandler);
}

// Function that returns true if a step needs to be replaced
function shouldModifyStep(index: number): boolean {
  if (index === 1) {
    const element: Element = shell.node.querySelector("#left-side-bar-vcdat");
    if (element.classList.contains("p-mod-hidden")) {
      return true;
    }
    return false;
  }

  return false;
}

function getStepForIndex(index: number, alternate: boolean): Step {
  const mapping = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (alternate) {
    return Utilities.deepCopy(REPLACEMENT_STEPS[mapping[index]]);
  }
  return Utilities.deepCopy(GETTING_STARTED[index]);
}

function updateIntroTutorial(tutorial: ITutorial): void {
  if (tutorial.currentStepIndex >= 0) {
    const newStep: Step = getStepForIndex(
      tutorial.currentStepIndex,
      shouldModifyStep(tutorial.currentStepIndex)
    );
    tutorial.replaceStep(tutorial.currentStepIndex, newStep);
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

    if (rightbar === null || context === null) {
      return;
    }

    // Activate sidebar widget
    shell.activateById(rightbar.id);

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
