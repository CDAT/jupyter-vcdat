/* eslint-disable no-underscore-dangle */
import LabControl from "./LabControl";
import VariableTracker from "./VariableTracker";
import NotebookUtilities from "./Utilities/NotebookUtilities";
import CodeInjector from "./CodeInjector";
import { DISPLAY_MODE } from "./constants";

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
 * @arg kernels: An array containing the ids of ready kernels
 * @arg injectionIndex: The cell index within a notebook where code will
 * be injected. 0 injects cell at top of notebook, -1 injects at bottom.
 */
interface IAppState {
  currentDisplayMode: DISPLAY_MODE;
  kernels: string[];
  runIndex: number;
  plotReady: boolean;
  plotExists: boolean;
  overlayPlot: boolean;
  shouldAnimate: boolean;
}

interface IState {
  aboutOpen: boolean;
}

/**
 *
 */
export default class AppControl {
  private static _instance: AppControl;
  private static _initialized: boolean;
  private _state: IAppState;
  private _lab: LabControl;
  private _varTracker: VariableTracker;
  private _codeInjector: CodeInjector;

  /** Provide handle to the LabControl instance. */
  static getInstance(): AppControl {
    // Return the instance only if it's initialized
    if (AppControl._initialized) {
      return AppControl._instance;
    }
    throw Error(
      `${AppControl.name} is not initialized. Must initialize first.`
    );
  }

  public static async initialize(labControl: LabControl): Promise<AppControl> {
    // Create singleton instance
    const library = new AppControl();
    AppControl._instance = library;
    AppControl._initialized = false;

    // Update the instance objects
    library._lab = labControl;
    library._varTracker = new VariableTracker();
    library._codeInjector = new CodeInjector(library._varTracker);
    library._state = {
      kernels: [],
      runIndex: 0,
      plotReady: false,
      plotExists: false,
      overlayPlot: false,
      currentDisplayMode: DISPLAY_MODE.Notebook,
      shouldAnimate: false,
    };

    // Wait for the app to get started before loading settings
    AppControl._initialized = true;

    return library;
  }

  get labControl(): LabControl {
    return AppControl._instance._lab;
  }

  get varTracker(): VariableTracker {
    return AppControl._instance._varTracker;
  }

  get codeInjector(): CodeInjector {
    return AppControl._instance._codeInjector;
  }

  get state(): IAppState {
    return AppControl._instance._state;
  }

  /**
   * Get index of the notebook cell where code will be injected/run.
   */
  get runIndex(): number {
    return this.state.runIndex;
  }

  /**
   * Set index of the notebook cell where code will be injected/run.
   */
  set runIndex(index: number) {
    this.state.runIndex = index;
  }

  /**
   * This is a decorator that causes a function to inject code into the
   * notebook cell at the current runIndex, assuming a notebook is open.
   * The function must return a string (the code to inject).
   * If no notebook is open, injection action will not occur.
   * This will throw an error and log the info to console if injection fails.
   */
  public static codeInjection(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void {
    const originalMethod = descriptor.value;
    descriptor.value = async function (
      ...args: any[]
    ): Promise<[number, string]> {
      const result: string = await originalMethod.apply(this, args);
      console.log(
        `Index run: ${AppControl._instance.runIndex}\nResult: ${result}`
      );
      try {
        return await LabControl.getInstance().inject(
          result,
          AppControl._instance.runIndex
        );
      } catch (error) {
        if (LabControl.getInstance().state.errorLogging) {
          const argStr = args && args.length > 0 ? `(${args})` : "()";
          const message = `Code Run Error. Function Call: ${propertyKey}${argStr}\n\
          Code Injected: ${result}\nOriginal ${error.stack}`;
          console.error(message);
        }
        NotebookUtilities.showMessage("Command Error", error.message);
        throw new Error(error);
      }
    };
  }

  /**
   * This is a generic code injection function which will run specified code
   * in the cell at specified index. Note that this uses the codeInjection
   * decorator to actually run the injection.
   * @param code A string of code to inject in the cell.
   * @param index The index of the cell to inject code into.
   * Index of -1 will inject code in last notebook cell (default)
   */
  @AppControl.codeInjection
  public injectCode(code: string, index?: number): string {
    if (index && index >= 0) {
      this.runIndex = index; // Set the run index to specified index
      return code; // Return the code to inject for code inject action
    }
    this.runIndex = -1;
    return code;
  }
}
