/* eslint-disable no-underscore-dangle */
import LabControl from "./LabControl";
import VariableTracker from "./VariableTracker";
import NotebookUtilities from "./Utilities/NotebookUtilities";

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
  kernels: string[];
  runIndex: number;
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

  public static async initialize(
    labControl: LabControl,
    varTracker: VariableTracker
  ): Promise<AppControl> {
    // Create singleton instance
    const library = new AppControl();
    AppControl._instance = library;
    AppControl._initialized = false;

    // Update the instance objects
    library._lab = LabControl.getInstance();
    library._varTracker = varTracker;
    library._state = {
      kernels: [],
      runIndex: 0,
    };

    // Wait for the app to get started before loading settings
    AppControl._initialized = true;

    return library;
  }

  get state(): IAppState {
    return AppControl._instance._state;
  }

  get runIndex(): number {
    return this.state.runIndex;
  }

  set runIndex(index: number) {
    this.state.runIndex = index;
  }

  /**
   * This is a decorator that causes a function to inject code into the
   * notebook cell at the current runIndex, assuming a notebook is open.
   * The function must return a string (the code to inject).
   * If no notebook is open, injection will not be run.
   */
  public static codeInjection(
    target: AppControl,
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

  @AppControl.codeInjection
  public injectCode(code: string, index?: number): string {
    if (index && index >= 0) {
      this.runIndex = index;
      return code;
    }
    this.runIndex = -1;
    return code;
  }
}
