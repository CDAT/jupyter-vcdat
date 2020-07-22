export interface ICodeAction {
  name: string;
  arguments: any;
  execute: () => any;
}

function CodeAction(target: Function): ICodeAction {
  return {
    name: target.name,
    arguments: target.arguments,
    execute: (): any => {
      target(target.arguments);
    },
  };
}

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
import LabControl from "./LabControl";
import VariableTracker from "./VariableTracker";

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
export interface IActionState {
  kernels: string[];
}

/**
 * This class is meant to provide a simplified interface for the extension
 * to interact with the underlying Jupyter Lab. It to be initialized within the
 * 'activate' function at the start of the extension. Any actions to the Jupyter
 * Lab environment should be performed using this class. To allow objects access
 * to these functions, you must call the 'getInstance()' function.
 */
export default class ActionLibrary {
  private static _instance: ActionLibrary;
  private static _initialized: boolean;
  private _state: IActionState;
  private _labControl: LabControl;
  private _varTracker: VariableTracker;

  /** Provide handle to the LabControl instance. */
  get instance(): ActionLibrary {
    // Return the instance only if it's initialized
    if (ActionLibrary._initialized) {
      return ActionLibrary._instance;
    }
    // Prevent access to instance if it's not initialized.
    throw Error(
      `${ActionLibrary.name} is not initialized. Must initialize first.`
    );
  }

  public static async initialize(
    labControl: LabControl,
    varTracker: VariableTracker
  ): Promise<ActionLibrary> {
    // Create singleton instance
    const library = new ActionLibrary();
    ActionLibrary._instance = library;
    ActionLibrary._initialized = false;

    // Update the instance objects
    library._labControl = labControl;
    library._varTracker = varTracker;
    library._state = {
      kernels: [],
    };

    // Wait for the app to get started before loading settings
    ActionLibrary._initialized = true;

    return library;
  }

  get state(): IActionState {
    return this._state;
  }
}
