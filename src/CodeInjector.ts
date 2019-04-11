// Dependencies
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { CellUtilities } from "./CellUtilities";
import AxisInfo from "./components/AxisInfo";
import Variable from "./components/Variable";

// Project Components
import { NotebookUtilities } from "./NotebookUtilities";

// Specifies valid plot export formats
export type ExportFormats = "png" | "pdf" | "svg" | "ps" | "";
export type ImageUnits = "pixels" | "in" | "cm" | "mm" | "dot";

/**
 * A class that manages the code injection of vCDAT commands
 */
export class CodeInjector {
  private _notebookPanel: NotebookPanel;
  private _commandRegistry: CommandRegistry;
  private _logErrorsToConsole: boolean; // Whether errors should log to console. Should be false during production.

  constructor(commands: CommandRegistry) {
    this._notebookPanel = null;
    this._commandRegistry = commands;
    this._logErrorsToConsole = true;
    this.inject = this.inject.bind(this);
    this.exportPlot = this.exportPlot.bind(this);
    this.createCopyOfGM = this.createCopyOfGM.bind(this);
    this.getGraphicMethod = this.getGraphicMethod.bind(this);
    this.getTemplate = this.getTemplate.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.plot = this.plot.bind(this);
    this.clearPlot = this.clearPlot.bind(this);
  }

  get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }

  set notebookPanel(notebookPanel: NotebookPanel) {
    this._notebookPanel = notebookPanel;
  }

  /**
   * Injects code into the bottom cell of the notebook, doesn't display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns Promise<[number, string]> - A promise for when the cell code has executed containing
   * the cell's index and output result
   */

  public async exportPlot(
    format: ExportFormats,
    name: string,
    width?: string,
    height?: string,
    units?: ImageUnits,
    provenance?: boolean
  ): Promise<void> {
    let cmd: string;

    // Set beginning of command based on type
    switch (format) {
      case "png":
        cmd = `canvas.png('${name}'`;
        break;
      case "pdf":
        cmd = `canvas.pdf('${name}'`;
        break;
      case "svg":
        cmd = `canvas.svg('${name}'`;
        break;
      case "ps":
        cmd = `canvas.postscript('${name}'`;
        break;
      default:
        cmd = `canvas.png('${name}'`;
    }

    // If width and height specified, add to command based on units
    if (width && height) {
      let w, h: number;
      if (units === "pixels" || units === "dot") {
        w = Number.parseInt(width);
        h = Number.parseInt(height);
      } else {
        w = Number.parseFloat(width);
        h = Number.parseFloat(height);
      }
      cmd += `, width=${w}, height=${h}, units='${units}'`;
      // Export of png plot can include provenance
      if (format === "png" && provenance !== undefined) {
        if (provenance) {
          cmd += `, provenance=True)`;
        } else {
          cmd += `, provenance=False)`;
        }
      } else {
        cmd += `)`;
      }
    }

    await this.inject(cmd, "Failed to export plot.", "exportPlot", arguments);
  }

  public async createCopyOfGM(
    newName: string,
    groupName: string,
    methodName: string
  ) {
    // Exit if any parameter is empty string
    if (!newName || !groupName || !methodName) {
      throw new Error("One of the input parameters was empty.");
    }

    // Create the code to copy the graphics method
    let cmd: string = `${newName}_${groupName} = `;
    cmd += `vcs.create${groupName}('${newName}',source='${methodName}')`;

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      "Failed to copy graphics method.",
      "createCopyOfGM",
      arguments
    );
  }

  public async getGraphicMethod(group: string, name: string) {
    let cmd: string = "";
    if (name.indexOf(group) < 0) {
      cmd = `${name}_${group} = vcs.get${group}('${name}')`;
    } else {
      cmd = `${name} = vcs.get${group}('${name}')`;
    }

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      "Failed to inject new graphic method.",
      "getGraphicMethod",
      arguments
    );
  }

  public async getTemplate(templateName: string) {
    const cmd: string = `${templateName} = vcs.gettemplate('${templateName}')`;

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      "Failed to inject new template.",
      "getTemplate",
      arguments
    );
  }

  public async loadVariable(variable: Variable) {
    // inject the code to load the variable into the notebook
    let cmd = `${variable.name} = ${variable.sourceName}("${variable.name}"`;
    variable.axisInfo.forEach((axis: AxisInfo) => {
      cmd += `, ${axis.name}=(${axis.min}, ${axis.max})`;
    });
    cmd += ")";

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      "Failed to load variable.",
      "loadVariable",
      arguments
    );
  }

  public async clearPlot() {
    await this.inject("canvas.clear()", "Clearing canvas failed.", "clearPlot");
  }

  public async plot(
    selectedVariables: string[],
    selectedGM: string,
    selectedGMGroup: string,
    selectedTemplate: string,
    overlayMode: boolean
  ) {
    // Create graphics method code
    if (!selectedGM) {
      if (selectedVariables.length > 1) {
        selectedGM = '"vector"';
      } else {
        selectedGM = '"boxfill"';
      }
    } else if (selectedGM.indexOf(selectedGMGroup) < 0) {
      selectedGM += `_${selectedGMGroup}`;
    }

    // Create template code
    if (!selectedTemplate) {
      selectedTemplate = '"default"';
    }

    // Create plot injection command string
    let cmd: string = "";
    if (overlayMode) {
      cmd = "canvas.plot(";
    } else {
      cmd = "canvas.clear()\ncanvas.plot(";
    }
    for (const varName of selectedVariables) {
      cmd += varName + ", ";
    }
    cmd += `${selectedTemplate}, ${selectedGM})`;

    await this.inject(cmd, "Failed to make plot.", "plot", arguments);
  }

  /**
   * This is the injection method used by the other code injector functions for injecting code into the notebook
   * @param code The code that will be injected
   * @param errorMsg The error message to provide if injection throws an error
   * @param funcName The name of the function calling the injection
   * @param funcArgs The arguments object of the calling function
   */
  private async inject(
    code: string,
    errorMsg?: string,
    funcName?: string,
    funcArgs?: IArguments
  ): Promise<[number, string]> {
    if (this.notebookPanel == null) {
      throw Error("The notebook panel was empty, code injection cancelled.");
    }
    try {
      const [index, result]: [
        number,
        string
      ] = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this._commandRegistry,
        this.notebookPanel.content.model.cells.length - 1,
        code,
        true
      );
      this.notebookPanel.content.activeCellIndex = index + 1;
      return [index, result];
    } catch (error) {
      const detailError: InjectionError = new InjectionError(
        error,
        code,
        errorMsg,
        funcName,
        funcArgs
      );
      if (this._logErrorsToConsole) {
        console.log(detailError.getRawError());
      }
      NotebookUtilities.showMessage(
        "Command Error",
        detailError.getUserErrorMsg()
      );
    }
  }
}

/**
 * Provides more detail for code injection related errors. For use only within code injector class.
 */
class InjectionError {
  private _error: Error; // The original error thrown
  private _message: string; // A detailed message for the error
  constructor(
    error: Error, // The error that occurred
    code: string, // Injection code used in the function that caused error
    msg?: string, // Error message to use
    funcName?: string, // The name of the injection function
    args?: IArguments // The arguments passed to the injection function
  ) {
    const message = msg || "An error occurred.";
    const codeStr = code || "Not applicable.";
    let funcStr = funcName || "No function name provided.";
    if (args) {
      funcStr += `(${[...args]})`;
    } else {
      funcStr = "()";
    }
    this._message = `${message}\nFunction call: ${funcStr} \
    \nCode injected: ${codeStr}\nOriginal${error.stack}`;
    this._error = error;
  }
  // Returns the error object created by this class
  public getRawError(): Error {
    return new Error(this._message);
  }

  // Returns an error message for user display
  public getUserErrorMsg(): string {
    return `${this._error.message}`;
  }
}
