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
import { NotebookUtilities } from "./NotebookUtilities";
import { IMainMenu, MainMenu, IHelpMenu } from "@jupyterlab/mainmenu";
import { Menu } from "@phosphor/widgets";
import { CommandRegistry } from "@phosphor/commands";
import { ReadonlyJSONObject, JSONObject } from "@phosphor/coreutils";

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
  id: "jupyter-vcdat",
  autoStart: true,
  requires: [INotebookTracker, IMainMenu],
  activate: activate
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
  });
}

// Adds a reference link to the help menu in JupyterLab
function addHelpReference(mainMenu: MainMenu, text: string, url: string): void {
  // Add item to help menu
  mainMenu.helpMenu.menu.addItem({
    args: { text: text, url: url },
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

    if (sidebar == null || context == null) {
      return;
    }

    // Activate sidebar widget
    shell.activateById(sidebar.id);

    // Prepare the notebook for code injection
    sidebar
      .prepareNotebookPanel(context.session.name)

      .catch(error => {
        if (error.status == "error") {
          NotebookUtilities.showMessage(error.ename, error.evalue);
        } else if (error.message != null) {
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
/*
function createMenuItem(
  itemLabel: string,
  commandID: string,
  params: Object,
  callback: Function,
  commands: CommandRegistry,
  iconClass?: string
): Menu.IItemOptions {
  // Create args JSON object for command
  const args: ReadonlyJSONObject = {
    title: itemLabel,
    icon: iconClass,
    args: params as ReadonlyJSONObject
  };

  // If command already exists, just pass it along with args
  if (commands.hasCommand(commandID)) {
    let menuItems1: Array<Menu.IItemOptions> = new Array<Menu.IItemOptions>();
    menuItems1.push(
      createMenuItem(
        "Hello",
        "say:hello",
        { msg: "Hello World!" },
        (args: ReadonlyJSONObject) => {
          alert(args["msg"]);
        },
        app.commands
      )
    );
    let menuItems2: Array<Menu.IItemOptions> = new Array<Menu.IItemOptions>();
    menuItems2.push(
      createMenuItem(
        "Test 1",
        "test:math",
        { values: [0, 2, 3], title: "Test 1" },
        (args: ReadonlyJSONObject) => {
          let vals: number[] = args["values"] as number[];
          let msgString: string = `0 + 2 + 3 = ${vals[0] + vals[1] + vals[2]}`;
          NotebookUtilities.showMessage(
            args["title"] as string,
            msgString,
            "TEST!"
          );
        },
        app.commands
      )
    );
    menuItems2.push(
      createMenuItem(
        "Test 2",
        "test:math",
        { values: [4, 5, 6], title: "Test 2" },
        (args: ReadonlyJSONObject) => {
          let vals: number[] = args["values"] as number[];
          let msgString: string = `4 + 5 + 6 = ${vals[0] + vals[1] + vals[2]}`;
          NotebookUtilities.showMessage(
            args["title"] as string,
            msgString,
            "TEST!"
          );
        },
        app.commands
      )
    );
    let menu: Menu = createMenu("Test", menuItems1, app.commands);
    let sub: Menu = createMenu("Submenu", menuItems2, app.commands);
    addSubMenu(menu, sub);
    mainMenu.addMenu(menu, { rank: 0 });

    return { type: "command", args: args, command: commandID };
  }
  // Create a command for the item if it doesn't exist
  commands.addCommand(commandID, {
    label: args => args["title"] as string,
    iconClass: args => args["iconClass"] as string,
    execute: args => {
      callback(args["args"]);
    }
  });

  return { args: args, command: commandID };
}

export class MenuCustomizer {
  commands: CommandRegistry;
  mainMenu: MainMenu;
  actions: Array<[number, string]>;
  actionCount: number;

  private constructor() {
    this.actions = new Array<[number, string]>();
    this.actionCount = 0;
  }

  initialize(mainMenu: MainMenu, commands: CommandRegistry) {
    this.commands = commands;
    this.mainMenu = mainMenu;
  }

  createNewMenu(menuTitle: string, iconClass?: string): Menu {
    // Create a menu object that has the specified parameters
    let menu: Menu = new Menu({ commands: this.commands });
    menu.title.label = menuTitle;
    menu.title.iconClass = iconClass;

    return menu;
  }

  addAction(name: string, callback: Function): string {
    const actionID: string = `menu-customizer:action${this.actionCount}`;

    // If action already exists, return the action name

    // Create menu action
    if (this.commands.hasCommand(actionID)) {
    }
    this.commands.addCommand(actionID, {
      label: args => args["title"] as string,
      iconClass: args => args["iconClass"] as string,
      execute: args => {
        callback(args["args"]);
      }
    });

    // Add to action list
    this.actionIDs.push(actionID);

    return;
  }

  addSubMenu(menu: Menu, subMenu: Menu): void {
    menu.addItem({ type: "submenu", submenu: subMenu });
  }
}

export class MenuCustomizerItem {
  commands: CommandRegistry;
  private _itemTitle: string;
  private _itemIconClass: string;
  private _itemCommandID: string;
  private _itemArguments: Object;
  constructor(
    commands: CommandRegistry,
    itemTitle: string,
    itemIconClass: string
  ) {
    this.commands = commands;
    this._itemTitle = itemTitle;
    this._itemIconClass = itemIconClass;
  }

  setAction(commandID: string, commandArgs: Object) {
    const args: Object = {
      title: this._itemTitle,
      iconClass: this._itemIconClass,
      args: commandArgs
    };
    this._itemCommandID = commandID;
    this._itemArguments = args;
  }
}
*/
