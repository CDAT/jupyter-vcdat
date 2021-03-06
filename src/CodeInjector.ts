// Dependencies
import { NotebookPanel } from "@jupyterlab/notebook";

// Project Components
import CellUtilities from "./CellUtilities";
import AxisInfo from "./AxisInfo";
import Variable from "./Variable";
import VariableTracker from "./VariableTracker";
import {
  BASE_DATA_READER_NAME,
  CANVAS_CELL_KEY,
  DISPLAY_MODE,
  IMPORT_CELL_KEY,
  MAX_SLABS,
  REQUIRED_MODULES,
  VCDAT_VERSION,
  VCDAT_VERSION_KEY,
} from "./constants";

import {
  CHECK_MODULES_CMD,
  CHECK_SIDECAR_EXISTS_CMD,
  getSidecarDisplayCommand,
} from "./PythonCommands";

import NotebookUtilities from "./NotebookUtilities";
import Utilities from "./Utilities";
import { ExportFormat, ImageUnit } from "./types";
import { boundMethod } from "autobind-decorator";

/**
 * A class that manages the code injection of vCDAT commands
 */
export default class CodeInjector {
  private _isBusy: boolean;
  private canvasReady: boolean; // Whether the canvas is ready/has been already run
  private _notebookPanel: NotebookPanel;
  private varTracker: VariableTracker;
  private logErrorsToConsole: boolean; // Whether errors should log to console. Should be false during production.

  constructor(variableTracker: VariableTracker) {
    this._notebookPanel = null;
    this._isBusy = false;
    this.canvasReady = false;
    this.varTracker = variableTracker;
    this.logErrorsToConsole = true;
  }

  get isBusy(): boolean {
    return this._isBusy;
  }

  get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }

  @boundMethod
  public async setNotebook(notebookPanel: NotebookPanel): Promise<void> {
    if (notebookPanel) {
      await notebookPanel.sessionContext.ready;
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
  @boundMethod
  public async injectImportsCode(index = -1, skip = false): Promise<number> {
    // Check if required modules are imported in notebook
    let cmd = "#These imports are added for vcdat.";

    if (skip) {
      // Check if necessary modules are loaded
      const output: string = await Utilities.sendSimpleKernelRequest(
        this.notebookPanel,
        CHECK_MODULES_CMD
      );

      // Create import string based on missing dependencies
      if (!output) {
        cmd += this.buildImportCommand(JSON.parse(`${REQUIRED_MODULES}`));
      } else {
        const missingModules: string[] = Utilities.strToArray(output);
        if (missingModules.length > 0) {
          cmd += this.buildImportCommand(missingModules);
        } else {
          return index;
        }
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
      await CellUtilities.runCellAtIndex(this._notebookPanel, cellIdx);
    }

    // Set cell meta data to identify it as containing imports
    await CellUtilities.setCellMetaData(
      this.notebookPanel,
      cellIdx,
      IMPORT_CELL_KEY,
      "saved",
      true
    );

    // Save the notebook's version to its meta data
    await NotebookUtilities.setMetaData(
      this.notebookPanel,
      VCDAT_VERSION_KEY,
      VCDAT_VERSION
    );

    return cellIdx;
  }

  /**
   * Looks for a cell containing the canvas declarations and updates its code
   * to contain the specified number of canvases.
   * If no cell containing canvas code is found a whole new one is inserted.
   * @param index The index of the cell to replace or insert the canvas code
   */
  @boundMethod
  public async injectCanvasCode(index: number): Promise<number> {
    // Creates canvas(es)
    const cmd = `#Create canvas
canvas = vcs.init(display_target='off')`;

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
      await CellUtilities.runCellAtIndex(this.notebookPanel, cellIdx);
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

  @boundMethod
  public async saveNetCDFFile(
    filename: string,
    currentVariableName: string,
    newVariableName: string,
    appendToExistingFile: boolean,
    shuffle: boolean,
    deflate: boolean,
    deflateValue: number
  ): Promise<void> {
    let cmd = ``;
    if (shuffle) {
      cmd += `cdms2.setNetcdfShuffleFlag(1)\n`;
    }
    if (deflate) {
      cmd += `cdms2.setNetcdfDeflateFlag(1)\n`;
      cmd += `cdms2.setNetcdfDeflateLevelFlag(int(${deflateValue}))\n`;
    }
    const writeMode = appendToExistingFile ? "r+" : "w";
    const variableNameInFile = newVariableName
      ? newVariableName
      : currentVariableName;
    cmd += `with cdms2.open('${filename}', "${writeMode}") as f:\n`;
    cmd += `\tf.write(${currentVariableName}, id='${variableNameInFile}')`;

    await this.inject(
      cmd,
      undefined,
      "Failed to save NetCDF file.",
      "saveNetCDFFile",
      arguments
    );
  }

  /**
   * Injects code into the bottom cell of the notebook, doesn't display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns Promise<[number, string]> - A promise for when the cell code has executed containing
   * the cell's index and output result
   */

  @boundMethod
  public async exportPlot(
    format: ExportFormat,
    name: string,
    width?: string,
    height?: string,
    units?: ImageUnit,
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

  @boundMethod
  public async createCopyOfGM(
    newName: string,
    groupName: string,
    methodName: string
  ): Promise<void> {
    // Exit if any parameter is empty string
    if (!newName || !groupName || !methodName) {
      throw new Error("One of the input parameters was empty.");
    }

    // Create the code to copy the graphics method
    let cmd = `${newName}_${groupName} = `;
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

  @boundMethod
  public async getGraphicMethod(group: string, name: string): Promise<void> {
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

  @boundMethod
  public async getTemplate(templateName: string): Promise<void> {
    const cmd = `${templateName} = vcs.gettemplate('${templateName}')`;

    // Inject the code into the notebook cell
    await this.inject(
      cmd,
      undefined,
      "Failed to inject new template.",
      "getTemplate",
      arguments
    );
  }

  @boundMethod
  public async deleteVariable(variable: Variable): Promise<void> {
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

  @boundMethod
  public async loadVariable(
    variable: Variable,
    newAlias?: string
  ): Promise<void> {
    // If the variable doesn't have a source listed, load as a derived variable
    let isDerived = false;
    if (!variable.sourceName) {
      isDerived = true;
    }

    // inject the code to load the variable into the notebook
    const varAlias: string = newAlias ? newAlias : variable.alias;
    let cmd: string = isDerived
      ? `${varAlias} = ${variable.alias}(`
      : `${varAlias} = ${BASE_DATA_READER_NAME}("${variable.name}"`;

    // update axis info
    const axesCount: number = variable.axisInfo.length;
    if (axesCount > 0) {
      let axis: AxisInfo = variable.axisInfo[0];
      const axisCmd: string =
        axis.first === axis.last
          ? `${axis.name}=(${axis.first})`
          : `${axis.name}=(${axis.first}, ${axis.last})`;
      cmd += isDerived ? axisCmd : `, ${axisCmd}`;
      for (let idx = 1; idx < axesCount; idx += 1) {
        axis = variable.axisInfo[idx];
        cmd +=
          axis.first === axis.last
            ? `, ${axis.name}=(${axis.first})`
            : `, ${axis.name}=(${axis.first}, ${axis.last})`;
      }
    }
    cmd += ")";

    if (!isDerived) {
      cmd = await this.openCloseFileCmd(variable.sourceName, cmd);
    }

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

  @boundMethod
  public async loadMultipleVariables(variables: Variable[]): Promise<void> {
    if (!variables) {
      return;
    }

    const fileName: string = variables[0].sourceName;

    if (!fileName) {
      throw Error("Could not determine what file the variables are from.");
    }

    let cmd = ``;
    const newSelection = Array<string>();
    variables.forEach((variable: Variable) => {
      // Create code to load the variable into the notebook
      cmd += `${variable.alias} = ${BASE_DATA_READER_NAME}("${variable.name}"`;
      variable.axisInfo.forEach((axis: AxisInfo) => {
        cmd +=
          axis.first === axis.last
            ? `, ${axis.name}=(${axis.first})`
            : `, ${axis.name}=(${axis.first}, ${axis.last})`;
      });
      cmd += ")\n";

      // Select variable
      newSelection.push(variable.varID);

      // new variable to var tracker
      this.varTracker.addVariable(variable);
    });
    cmd = cmd.slice(0, cmd.length - 1);

    cmd = await this.openCloseFileCmd(fileName, cmd);
    if (!cmd) {
      console.error(
        "openCloseFileCmd result was empty. Could be the path was not correct."
      );
    }

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

  @boundMethod
  public async clearPlot(): Promise<void> {
    await this.inject(
      "canvas.clear()",
      undefined,
      "Clearing canvas failed.",
      "clearPlot"
    );
  }

  /**
   * Updates the colormap thats to be used by the selected graphics method
   * @param gmName: the name of the graphics method to update the color map for
   * @param gmGroup: the name of the graphic method type
   * @param cmName: the name of the color map
   * @returns Promise<[number, string]> - A promise for when the cell code has executed containing
   * the cell's index and output result
   */
  @boundMethod
  public async updateColormapName(
    gmName: string,
    gmGroup: string,
    cmName: string
  ): Promise<[number, string]> {
    const cmd: string =
      gmName.indexOf(gmGroup) < 0
        ? `${gmName}_${gmGroup}.colormap = '${cmName}'`
        : `${gmName}.colormap = '${cmName}'`;

    return this.inject(
      cmd,
      undefined,
      "Failed to update colormap.",
      "updateColormapName",
      arguments
    );
  }

  public async animate(
    selectedGM: string,
    selectedGMGroup: string,
    selectedTemplate: string,
    axisIndex: number,
    rate: number,
    invertAxis: boolean,
    colormap: string
  ): Promise<[number, string]> {
    const selectedVariable: string = this.varTracker.findVariableByID(
      this.varTracker.selectedVariables[0]
    )[1].alias;

    // Create graphics method code
    let group: string = selectedGMGroup;
    if (!group) {
      group = "boxfill";
    }

    // Create template code
    let templateParam: string = selectedTemplate;
    if (!selectedTemplate) {
      templateParam = '"default"';
    }

    let cmd = "from tqdm import tqdm_notebook\n";
    cmd += "from glob import glob\n";
    cmd += `pngpath = "vcdat_tmp"\n`;
    cmd += `outpath = "vcdat_animations"\n`;
    cmd += `if not os.path.exists(pngpath):\n`;
    cmd += `    os.makedirs(pngpath)\n`;
    cmd += `if not os.path.exists(outpath):\n`;
    cmd += `    os.makedirs(outpath)\n`;
    cmd += `else:\n`;
    cmd += `    try:\n`;
    cmd += `        [os.remove(os.path.join(pngpath, x)) for x in os.listdir(pngpath)]\n`;
    cmd += "    except Exception as e:\n";
    cmd += "        print(repr(e))\n";
    cmd += "frame_index = 0\n";
    cmd += `min, max = vcs.minmax(${selectedVariable})\n`;

    if (selectedGM) {
      cmd += `gm = vcs.create${group}(source='${selectedGM}')\n`;
    } else {
      cmd += `gm = vcs.create${group}()\n`;
    }

    cmd += `gm.levels = [round(x) for x in numpy.arange(min, max, (max-min)/10)]\n`;
    cmd += `gm.fillareacolors = vcs.getcolors(gm.levels)\n`;

    if (colormap) {
      cmd += `gm.colormap = "${colormap}"\n`;
    }

    if (invertAxis) {
      cmd += `for step in tqdm_notebook(list(reversed(range(${selectedVariable}.shape[${axisIndex}]))), desc="Creating animation frames for ${selectedVariable}"):\n`;
    } else {
      cmd += `for step in tqdm_notebook(list(range(${selectedVariable}.shape[${axisIndex}])), desc="Creating animation for ${selectedVariable}"):\n`;
    }
    cmd += `    canvas.clear()\n`;

    let indexPrefix = "";
    for (let i = 0; i < axisIndex; i += 1) {
      indexPrefix += ":, ";
    }

    cmd += `    canvas.plot(${selectedVariable}[${indexPrefix}step], ${templateParam}, gm)\n`;

    cmd +=
      "    canvas.png(os.path.join(pngpath,'{:06}'.format(frame_index)))\n";
    cmd += "    frame_index += 1\n";
    cmd += `canvas.ffmpeg(os.path.join(outpath, "${selectedVariable}_animation.mp4"), sorted(glob(os.path.join(pngpath, "*png"))), rate=${rate})\n`;
    cmd += `\n`;

    return this.inject(
      cmd,
      undefined,
      "Failed to make animation.",
      "animate",
      arguments
    );
  }

  @boundMethod
  public async plot(
    selectedGM: string,
    selectedGMGroup: string,
    selectedTemplate: string,
    overlayMode: boolean,
    previousDisplayMode: DISPLAY_MODE,
    currentDisplayMode: DISPLAY_MODE
  ): Promise<[number, string]> {
    // Limit selection to MAX_SLABS
    let selectedVariables: string[] = this.varTracker.selectedVariables;
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

    let cmd = "";
    const sidecarReady: string = await Utilities.sendSimpleKernelRequest(
      this.notebookPanel,
      CHECK_SIDECAR_EXISTS_CMD
    );

    // Change display target if neccessary
    if (previousDisplayMode !== currentDisplayMode) {
      cmd = getSidecarDisplayCommand(
        currentDisplayMode,
        sidecarReady === "True",
        this.notebookPanel.title.label
      );
    }

    // Create plot injection command string
    cmd += overlayMode ? `canvas.plot(` : `canvas.clear()\ncanvas.plot(`;
    for (const varID of selectedVariables) {
      cmd += `${this.varTracker.findVariableByID(varID)[1].alias}, `;
    }
    cmd += `${templateParam}, ${gmParam})`;

    return this.inject(
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
   * @returns [number, string] The index of the following the newly injected cell, and the output result as a string
   */
  @boundMethod
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
      message = `${message}${funcStr}\nCode Injected: ${code}\nOriginal${error.stack}`;

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
  @boundMethod
  private buildImportCommand(modules: string[]): string {
    let cmd = "";

    // Import modules
    modules.forEach((module) => {
      cmd += `\nimport ${module}`;
    });

    return cmd;
  }

  /**
   * Will surround specified code with a file open and close command, returns new command as string.
   * If the file couldn't be opened, returns empty string
   * @param filePath The path of the file to open
   * @param code The code that needs the open file
   */
  @boundMethod
  private async openCloseFileCmd(
    filePath: string,
    code: string
  ): Promise<string> {
    if (!filePath || !code) {
      throw new Error("Filepath and code must be defined.");
    }

    // Get the relative filepath to open the file
    const path = Utilities.getUpdatedPath(
      this.notebookPanel.sessionContext.path,
      filePath
    );

    // Check that file can open before adding it as code
    if (await Utilities.tryFilePath(this.notebookPanel, path)) {
      // Add code to notebook
      let newCode = `${BASE_DATA_READER_NAME} = cdms2.open('${path}')\n`;
      newCode += `${code}\n${BASE_DATA_READER_NAME}.close()`;
      return newCode;
    }
    console.error(`Opening file failed. Path: ${path}`);

    return "";
  }
}
