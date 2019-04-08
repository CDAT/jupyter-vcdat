import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { CellUtilities } from "./CellUtilities";

/**
 * A class that manages the code injection of vCDAT commands
 */
export class CodeInjector {
  private _notebookPanel: NotebookPanel;
  private _commandRegistry: CommandRegistry;

  constructor(commands: CommandRegistry) {
    this._notebookPanel = null;
    this._commandRegistry = commands;
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
  public async inject(code: string): Promise<[number, string]> {
    if (this.notebookPanel == null) {
      throw Error("The notebook panel was empty, code injection cancelled.");
    }
    try {
      const result = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this._commandRegistry,
        this.notebookPanel.content.model.cells.length - 1,
        code,
        true
      );
      this.notebookPanel.content.activeCellIndex = result[0] + 1;
      return result;
    } catch (error) {
      if (error.status == "error" || error.message != null) {
        throw error;
      } else {
        throw new Error("An error occurred when injecting the code.");
      }
    }
  }

  public async exportPlot(
    format: string,
    name: string,
    width?: string,
    height?: string,
    units?: string,
    provenance?: boolean
  ): Promise<void> {
    let command: string;

    // Set beginning of command based on type
    switch (format) {
      case "png":
        command = `canvas.png('${name}'`;
        break;
      case "pdf":
        command = `canvas.pdf('${name}'`;
        break;
      case "svg":
        command = `canvas.svg('${name}'`;
        break;
      case "ps":
        command = `canvas.postscript('${name}'`;
        break;
      default:
        command = `canvas.png('${name}'`;
    }

    // If width and height specified, add to command based on units
    if (width && height) {
      let w, h: number;
      if (units === "px" || units === "dot") {
        w = Number.parseInt(width);
        h = Number.parseInt(height);
      } else {
        w = Number.parseFloat(width);
        h = Number.parseFloat(height);
      }
      command += `, width=${w}, height=${h}, units='${units}'`;
      // Export of png plot can include provenance
      if (format === "png" && provenance !== undefined) {
        if (provenance) {
          command += `, provenance=True)`;
        } else {
          command += `, provenance=False)`;
        }
      } else {
        command += `)`;
      }
    }

    try {
      await this.inject(command);
    } catch (error) {
      throw new Error("Failed to export plot.");
    }
  }

  public async copyGM(newName: string, groupName: string, methodName: string) {
    // Exit if any parameter is empty string
    if (!newName || !groupName || !methodName) {
      throw new Error("One of the input parameters was empty.");
    }

    // Create the code to copy the graphics method
    let command: string = `${newName}_${groupName} = `;
    command += `vcs.create${groupName}('${newName}',source='${methodName}')`;

    try {
      // Inject the code into the notebook cell
      await this.inject(command);
    } catch (error) {
      throw new Error("Failed to copy graphics method");
    }
  }
}

/**
 * Allows custom error messages withot losing the stack
 */
/*class CustomError extends Error {
  constructor(public msg?: string) {
    super(msg);
    this.stack = new Error().stack;
  }
}*/
