/* eslint-disable no-underscore-dangle */
import { JupyterFrontEnd, LabShell } from "@jupyterlab/application";
import { MainMenu } from "@jupyterlab/mainmenu";
import { NotebookTracker, Notebook, NotebookPanel } from "@jupyterlab/notebook";
import { ISettingRegistry } from "@jupyterlab/settingregistry";
import { AppSettings } from "./AppSettings";
import { Widget } from "@lumino/widgets";
import { CommandRegistry } from "@lumino/commands";
import NotebookUtilities from "./Utilities/NotebookUtilities";
import CellUtilities from "./Utilities/CellUtilities";

const extensionID = "jupyter-vcdat:extension";
type shellArea = "top" | "left" | "right" | "main" | "bottom" | "header";

/**
 * Specifies the states of the Jupyterlab main area tab/notebook
 */
export enum NOTEBOOK_STATE {
  Unknown, // The current state of the notebook is unknown and should be updated.
  NoOpenNotebook, // JupyterLab has no notebook opened
  InactiveNotebook, // No notebook is currently active, but one or more are open
  ActiveNotebook, // There's an active notebook, but needs imports
  InitialCellsReady, // Has imports cell, but they need to be run
  VCSReady, // The notebook is ready for code injection
}

/**
 * Tracks the state of the Control for JupyterLab
 */
export interface IControlState {
  notebookState: NOTEBOOK_STATE;
  errorLogging: boolean;
}

/**
 * This class is meant to provide a simplified interface for the extension
 * to interact with the underlying Jupyter Lab. It to be initialized within the
 * 'activate' function at the start of the extension. Any actions to the Jupyter
 * Lab environment should be performed using this class. To allow objects access
 * to these functions, you must access the 'instance' function.
 */
export default class LabControl {
  private static _instance: LabControl;
  private static _initialized: boolean;
  private _state: IControlState;
  private _app: JupyterFrontEnd;
  private _shell: LabShell;
  private _menu: MainMenu;
  private _settings: AppSettings;
  private _nbTracker: NotebookTracker;

  /** Provide handle to the LabControl instance. */
  static getInstance(): LabControl {
    // Return the full instance only if it's initialized
    if (LabControl._initialized) {
      return LabControl._instance;
    }
    throw Error(
      `${LabControl.name} is not initialized. Must initialize first.`
    );
  }

  public static async initialize(
    application: JupyterFrontEnd,
    labShell: LabShell,
    mainMenu: MainMenu,
    settings: ISettingRegistry,
    notebookTracker: NotebookTracker
  ): Promise<LabControl> {
    // Create singleton instance
    const lab = new LabControl();
    LabControl._initialized = false;
    LabControl._instance = lab;

    // Update the instance objects
    lab._app = application;
    lab._shell = labShell;
    lab._menu = mainMenu;
    lab._nbTracker = notebookTracker;
    lab._state = {
      notebookState: NOTEBOOK_STATE.Unknown,
      errorLogging: true,
    };

    // Wait for the app to get started before loading settings
    await lab._app.started;
    const loadedSettings = await settings.load(extensionID);
    lab._settings = new AppSettings(loadedSettings);
    LabControl._initialized = true;
    return lab;
  }

  get state(): IControlState {
    return LabControl.getInstance()._state;
  }

  set state(newState: IControlState) {
    LabControl.getInstance()._state = newState;
  }

  get commands(): CommandRegistry {
    return LabControl.getInstance()._app.commands;
  }

  get settings(): AppSettings {
    return LabControl.getInstance()._settings;
  }

  get shell(): LabShell {
    return LabControl.getInstance()._shell;
  }

  get menu(): MainMenu {
    return LabControl.getInstance()._menu;
  }

  get notebookPanel(): NotebookPanel {
    if (LabControl.getInstance()._nbTracker.currentWidget) {
      return LabControl.getInstance()._nbTracker.currentWidget;
    } else {
      return null;
    }
  }

  public addCommand(
    commandID: string,
    execute: (args: any) => void,
    label?: string,
    caption?: string,
    iconClass?: string,
    isEnabled?: (args: any) => boolean,
    isVisible?: (args: any) => boolean,
    isToggled?: (args: any) => boolean
  ): void {
    if (this.commands.hasCommand(commandID)) {
      return;
    }
    this.commands.addCommand(commandID, {
      execute,
      label,
      iconClass,
      caption,
      isEnabled,
      isVisible,
      isToggled,
    });
  }

  public async createNotebook(): Promise<NotebookPanel> {
    const newNotebookPanel: NotebookPanel = await NotebookUtilities.createNewNotebook(
      this.commands
    );
    return newNotebookPanel;
  }

  public activateCurrentNotebook(): void {
    if (this.notebookPanel) {
      this.shell.activateById(this.notebookPanel.id);
    }
  }

  // Add item to help menu
  public helpMenuItem(commandID: string, args?: {}): void {
    this.menu.helpMenu.menu.addItem({
      args,
      command: commandID,
    });
  }

  public attachWidget(widget: Widget, position: shellArea): void {
    // Attach it to the left side of main area
    this.shell.add(widget, position);

    // Activate the widget
    this.shell.activateById(widget.id);
  }

  /**
   * Creates new cell at the specified index, then injects code into cell and
   * runs the code.
   * @param code The code/text to inject
   * @param index The index of the cell, 0 is top, default is bottom cell
   */
  public async inject(code: string, index?: number): Promise<[number, string]> {
    if (this.notebookPanel === null) {
      throw Error("No notebook, code injection cancelled.");
    }
    try {
      let idx: number = index;

      if (!idx || idx < 0) {
        idx = this.notebookPanel.content.model.cells.length - 1;
      }

      const [newIdx, result]: [
        number,
        string
      ] = await CellUtilities.insertRunShow(
        this.notebookPanel,
        idx,
        code,
        true
      );
      this.notebookPanel.content.activeCellIndex = newIdx + 1;
      return [newIdx, result];
    } catch (error) {
      throw new Error(error);
    }
  }
}
