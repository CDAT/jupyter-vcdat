// Dependencies
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";

// Project Components
import { CellUtilities } from "./CellUtilities";
import { AxisInfo } from "./components/AxisInfo";
import { Variable } from "./components/Variable";
import { VariableTracker } from "./VariableTracker";
import {
  CANVAS_CELL_KEY,
  CHECK_MODULES_CMD,
  EXPORT_FORMATS,
  EXTENSIONS_REGEX,
  IMAGE_UNITS,
  IMPORT_CELL_KEY,
  MAX_SLABS,
  READER_CELL_KEY,
  REQUIRED_MODULES
} from "./constants";
import { NotebookUtilities } from "./NotebookUtilities";
import { Utilities } from "./Utilities";

/**
 * A class that manages the code injection of vCDAT commands
 */
export class CodeInjector {
  private _isBusy: boolean;
  private canvasReady: boolean; // Whether the canvas is ready/has been already run
  private _notebookPanel: NotebookPanel;
  private cmdRegistry: CommandRegistry;
  private varTracker: VariableTracker;
  private logErrorsToConsole: boolean; // Whether errors should log to console. Should be false during production.

  constructor(commands: CommandRegistry, variableTracker: VariableTracker) {
    this._notebookPanel = null;
    this._isBusy = false;
    this.canvasReady = false;
    this.cmdRegistry = commands;
    this.varTracker = variableTracker;
    this.logErrorsToConsole = true;
    this.inject = this.inject.bind(this);
    this.addFileCmd = this.addFileCmd.bind(this);
    this.buildImportCommand = this.buildImportCommand.bind(this);
    this.injectImportsCode = this.injectImportsCode.bind(this);
    this.injectDataReaders = this.injectDataReaders.bind(this);
    this.injectCanvasCode = this.injectCanvasCode.bind(this);
    this.exportPlot = this.exportPlot.bind(this);
    this.createCopyOfGM = this.createCopyOfGM.bind(this);
    this.getGraphicMethod = this.getGraphicMethod.bind(this);
    this.getTemplate = this.getTemplate.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.loadMultipleVariables = this.loadMultipleVariables.bind(this);
    this.plot = this.plot.bind(this);
    this.setNotebook = this.setNotebook.bind(this);
    this.clearPlot = this.clearPlot.bind(this);
    this.deleteVariable = this.deleteVariable.bind(this);
  }

  get isBusy(): boolean {
    return this._isBusy;
  }

  get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }

  public async setNotebook(notebookPanel: NotebookPanel) {
    if (notebookPanel) {
      await notebookPanel.activated;
      await notebookPanel.session.ready;
      this._notebookPanel = notebookPanel;
    } else {
      this._notebookPanel = null;
    }
  }

  /**
   * This will inject the required modules into the current notebook (if a module was not already imported)
   * @param index The index of where the imports cell should be. Default is -1, which will insert at the top.
   * @param skip Default false. If set to true, a check of the kernel will be made to see if the modules are already
   * imported and any that are will be skipped (not added) in the import statements of the required code.
   * @returns The index of where the cell was inserted
   */
  public async injectImportsCode(
    index: number = -1,
    skip: boolean = false
  ): Promise<number> {
    // Check if required modules are imported in notebook
    let cmd = "#These imports are added for vcdat.";

    if (skip) {
      // Check if necessary modules are loaded
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        CHECK_MODULES_CMD
      );

      // Create import string based on missing dependencies
      const missingModules: string[] = Utilities.strToArray(output);
      if (missingModules.length > 0) {
        cmd += this.buildImportCommand(missingModules);
      } else {
        return index;
      }
    } else {
      cmd += this.buildImportCommand(JSON.parse(`${REQUIRED_MODULES}`));
    }

    // Find the index where the imports code is injected
    let cellIdx: number = CellUtilities.findCellWithMetaKey(
      this.notebookPanel,
      IMPORT_CELL_KEY
    )[0];

    if (cellIdx < 0) {
      const [newIdx]: [number, string] = await this.inject(
        cmd,
        index,
        "Error occured when adding imports.",
        "injectImportsCode",
        arguments
      );
      cellIdx = newIdx;
    } else {
      // Inject code into existing imports cell and run
      CellUtilities.injectCodeAtIndex(this.notebookPanel.content, cellIdx, cmd);
      await CellUtilities.runCellAtIndex(
        this.cmdRegistry,
        this._notebookPanel,
        cellIdx
      );
    }

    // Set cell meta data to identify it as containing imports
    await CellUtilities.setCellMetaData(
      this.notebookPanel,
      cellIdx,
      IMPORT_CELL_KEY,
      "saved",
      true
    );

    return cellIdx;
  }

  /**
   * This will load data from a file so it can be used by vcdat
   * @param index The index to use for the cell containing the data variables
   * @param filePath The filepath of the new file to open
   */
  public async injectDataReaders(
    index: number,
    filePath: string
  ): Promise<number> {
    // If the data file doesn't have correct extension, exit
    if (filePath === "") {
      throw new Error("The file path was empty.");
    }

    // If the data file doesn't have correct extension, exit
    if (!EXTENSIONS_REGEX.test(filePath)) {
      throw new Error("The file has the wrong extension type.");
    }

    // Get the relative path of the file for the injection command
    const nbPath: string = `${this.notebookPanel.session.path}`;
    const newFilePath: string = Utilities.getRelativePath(nbPath, filePath);

    // Try opening the file first, before injecting into code, exit if failed
    const isValidPath: boolean = await this.varTracker.tryFilePath(newFilePath);
    if (!isValidPath) {
      throw new Error(`The file failed to open. Path: ${newFilePath}`);
    }

    // If file opened fine, find the index where the file data code is injected
    let cellIdx: number = CellUtilities.findCellWithMetaKey(
      this.notebookPanel,
      READER_CELL_KEY
    )[0];

    // Get list of data files to open
    const dataVarNames: string[] = Object.keys(this.varTracker.dataReaderList);

    // Build command that opens any existing data file(s)
    let cmd: string;
    let tmpFilePath: string;
    const addCmds = Array<Promise<string>>();

    if (dataVarNames.length > 0) {
      cmd = "#Open the files for reading";
      dataVarNames.forEach((existingDataName: string, idx: number) => {
        tmpFilePath = this.varTracker.dataReaderList[existingDataName];

        // Exit early if the filepath has already been opened
        if (tmpFilePath === filePath) {
          if (idx < 0) {
            return index;
          }
          return idx;
        }

        // Add file open command to the list
        addCmds.push(this.addFileCmd(tmpFilePath));
      });

      const allFiles: string[] = await Promise.all(addCmds);
      cmd += allFiles.join("");
    } else {
      cmd = `#Open the file for reading`;
    }

    const newName: string = this.varTracker.getDataReaderName(filePath);
    const addCmd: string = `\n${newName} = cdms2.open('${newFilePath}')`;

    cmd += addCmd;

    if (cellIdx < 0) {
      // Insert a new cell with given command and run
      const [newIdx]: [number, string] = await this.inject(
        cmd,
        index,
        "Error occured when opening data readers.",
        "injectDataReaders",
        arguments
      );

      cellIdx = newIdx;
    } else {
      // Inject code into existing data variables cell and run
      CellUtilities.injectCodeAtIndex(this.notebookPanel.content, cellIdx, cmd);
      await CellUtilities.runCellAtIndex(
        this.cmdRegistry,
        this.notebookPanel,
        index
      );
    }

    // Update or add the file path to the data readers list
    await this.varTracker.addDataSource(newName, filePath);

    // Set cell meta data to identify it as containing data variables
    await CellUtilities.setCellMetaData(
      this.notebookPanel,
      cellIdx,
      READER_CELL_KEY,
      "saved",
      true
    );

    return cellIdx;
  }

  /**
   * Looks for a cell containing the canvas declarations and updates its code
   * to contain the specified number of canvases.
   * If no cell containing canvas code is found a whole new one is inserted.
   * @param index The index of the cell to replace or insert the canvas code
   */
  public async injectCanvasCode(index: number): Promise<number> {
    // Creates canvas(es)
    const cmd: string = `#Create canvas and sidecar\ncanvas = vcs.init()`;

    // Find the index where the canvas code is injected
    let cellIdx: number = CellUtilities.findCellWithMetaKey(
      this.notebookPanel,
      CANVAS_CELL_KEY
    )[0];

    if (cellIdx < 0) {
      // Inject the code for starting the canvases
      const [newIdx]: [number, string] = await this.inject(
        cmd,
        index,
        "Error occurred when injecting canvas code.",
        "injectCanvasCode",
        arguments
      );

      cellIdx = newIdx;
    } else {
      if (this.canvasReady) {
        // Exit early if the canvas cell has already been run
        return cellIdx;
      }
      // Replace code in canvas cell and run
      CellUtilities.injectCodeAtIndex(this.notebookPanel.content, cellIdx, cmd);
      await CellUtilities.runCellAtIndex(
        this.cmdRegistry,
        this.notebookPanel,
        cellIdx
      );
    }

    // Set cell meta data to identify it as containing canvases
    await CellUtilities.setCellMetaData(
      this.notebookPanel,
      cellIdx,
      CANVAS_CELL_KEY,
      "saved",
      true
    );

    this.canvasReady = true;
    return cellIdx;
  }

  /**
   * Injects code into the bottom cell of the notebook, doesn't display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns Promise<[number, string]> - A promise for when the cell code has executed containing
   * the cell's index and output result
   */

  public async exportPlot(
    format: EXPORT_FORMATS,
    name: string,
    width?: string,
    height?: string,
    units?: IMAGE_UNITS,
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
      let w: number;
      let h: number;
      let unit: string = units;
      if (units === "px" || units === "dot") {
        w = Number.parseInt(width, 10);
        h = Number.parseInt(height, 10);
      } else {
        w = Number.parseFloat(width);
        h = Number.parseFloat(height);
      }

      if (units === "px") {
        unit = "pixels";
      }
      cmd += `, width=${w}, height=${h}, units='${unit}'`;
    }

    // Export of png plot can include provenance
    if (format === "png" && provenance !== undefined) {
      cmd += provenance ? `, provenance=True` : ``;
    }

    // Close command
    cmd += `)`;

    await this.inject(
      cmd,
      undefined,
      "Failed to export plot.",
      "exportPlot",
      arguments
    );
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
      undefined,
      "Failed to copy graphics method.",
      "createCopyOfGM",
      arguments
    );
  }

  public async getGraphicMethod(group: string, name: string) {
    const cmd: string =
      name.indexOf(group) < 0
        ? `${name}_${group} = vcs.get${group}('${name}')`
        : `${name} = vcs.get${group}('${name}')`;

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      undefined,
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
      undefined,
      "Failed to inject new template.",
      "getTemplate",
      arguments
    );
  }

  public async deleteVariable(variable: Variable) {
    // inject the code to delete variable from notebook
    const cmd = `del ${variable.alias}`;

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      undefined,
      "Failed to load variable.",
      "loadVariable",
      arguments
    );

    // Refresh variable list
    this.varTracker.refreshVariables();
  }

  public async loadVariable(variable: Variable) {
    // inject the code to load the variable into the notebook
    let cmd = `${variable.alias} = ${variable.sourceName}("${variable.name}"`;
    variable.axisInfo.forEach((axis: AxisInfo) => {
      cmd +=
        axis.min === axis.max
          ? `, ${axis.name}=(${axis.min})`
          : `, ${axis.name}=(${axis.min}, ${axis.max})`;
    });
    cmd += ")";

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      undefined,
      "Failed to load variable.",
      "loadVariable",
      arguments
    );

    // new variable to var tracker
    this.varTracker.addVariable(variable);
  }

  public async loadMultipleVariables(variables: Variable[]): Promise<void> {
    if (!variables) {
      return;
    }

    let cmd: string = ``;
    let newSelection: Variable[] = Array<Variable>();
    variables.forEach((variable: Variable) => {
      // Create code to load the variable into the notebook
      cmd += `${variable.alias} = ${variable.sourceName}("${variable.name}"`;
      variable.axisInfo.forEach((axis: AxisInfo) => {
        cmd +=
          axis.min === axis.max
            ? `, ${axis.name}=(${axis.min})`
            : `, ${axis.name}=(${axis.min}, ${axis.max})`;
      });
      cmd += ")\n";

      // Select variable
      newSelection.push(variable);

      // new variable to var tracker
      this.varTracker.addVariable(variable);
    });
    cmd = cmd.slice(0, cmd.length - 1);

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      undefined,
      "Failed to load variable.",
      "loadMultipleVariables",
      arguments
    );

    // Update selected variables
    this.varTracker.selectedVariables = newSelection;

    // Refresh the list
    await this.varTracker.refreshVariables();
  }

  public async clearPlot() {
    await this.inject(
      "canvas.clear()",
      undefined,
      "Clearing canvas failed.",
      "clearPlot"
    );
  }

  public async plot(
    selectedGM: string,
    selectedGMGroup: string,
    selectedTemplate: string,
    overlayMode: boolean
  ) {
    // Limit selection to MAX_SLABS
    let selectedVariables: Variable[] = this.varTracker.selectedVariables;
    if (selectedVariables.length > MAX_SLABS) {
      selectedVariables = selectedVariables.slice(0, MAX_SLABS);
      this.varTracker.selectedVariables = selectedVariables;
    }

    // Create graphics method code
    let gmParam: string = selectedGM;
    if (!selectedGM) {
      gmParam = selectedVariables.length > 1 ? '"vector"' : '"boxfill"';
    } else if (selectedGM.indexOf(selectedGMGroup) < 0) {
      gmParam += `_${selectedGMGroup}`;
    }

    // Create template code
    let templateParam: string = selectedTemplate;
    if (!selectedTemplate) {
      templateParam = '"default"';
    }

    // Create plot injection command string
    let cmd: string = overlayMode
      ? "canvas.plot("
      : "canvas.clear()\ncanvas.plot(";
    for (let variable of selectedVariables) {
      cmd += `${variable.alias}, `;
    }
    cmd += `${templateParam}, ${gmParam})`;

    await this.inject(
      cmd,
      undefined,
      "Failed to make plot.",
      "plot",
      arguments
    );
  }

  /**
   * This is the injection method used by the other code injector functions for injecting code into the notebook
   * @param code The code that will be injected
   * @param index The index of where the code should be injected (will be that last cell in notebook if undefined)
   * @param errorMsg The error message to provide if injection throws an error
   * @param funcName The name of the function calling the injection
   * @param funcArgs The arguments object of the calling function
   */
  private async inject(
    code: string,
    index?: number,
    errorMsg?: string,
    funcName?: string,
    funcArgs?: IArguments
  ): Promise<[number, string]> {
    if (this.notebookPanel === null) {
      throw Error("No notebook, code injection cancelled.");
    }
    try {
      this._isBusy = true;
      const idx: number =
        index || this.notebookPanel.content.model.cells.length - 1;
      const [newIdx, result]: [
        number,
        string
      ] = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.cmdRegistry,
        idx,
        code,
        true
      );
      this.notebookPanel.content.activeCellIndex = newIdx + 1;
      return [newIdx, result];
    } catch (error) {
      const argStr =
        funcArgs && funcArgs.length > 0 ? `(${[...funcArgs]})` : "()";
      const funcStr = funcName ? `\nFunction Name: ${funcName}${argStr}` : "";

      let message = errorMsg || "An error occurred.";
      message = `${message}${funcStr}\nCode Injected: ${code}\nOriginal${
        error.stack
      }`;

      if (this.logErrorsToConsole) {
        console.error(message);
      }
      NotebookUtilities.showMessage("Command Error", error.message);
      throw error;
    } finally {
      this._isBusy = false;
    }
  }

  /**
   * This will construct an import string for the notebook based on the modules passed to it. It is used for imports injection.
   * @param modules An array of strings representing the modules to include in the import command.
   */
  private buildImportCommand(modules: string[]): string {
    let cmd: string = "";

    // Import modules
    modules.forEach(module => {
      cmd += `\nimport ${module}`;
    });

    return cmd;
  }

  // Add returns a line of code for adding the specified file to the notebook
  // If the file couldn't be opened, returns empty string
  private async addFileCmd(filePath: string): Promise<string> {
    // Get the relative filepath to open the file
    const relativePath = Utilities.getRelativePath(
      this.notebookPanel.session.path,
      filePath
    );
    // Check that file can open before adding it as code
    const valid: boolean = await this.varTracker.tryFilePath(relativePath);
    if (valid) {
      const addCode: string = `\n${this.varTracker.getDataReaderName(
        filePath
      )} = cdms2.open('${relativePath}')`;
      return addCode;
    }
    return "";
  }
}
