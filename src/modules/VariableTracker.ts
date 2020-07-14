// Dependencies
import { NotebookPanel } from "@jupyterlab/notebook";
import { ISignal, Signal } from "@lumino/signaling";

// Project Components
import {
  FILE_PATH_KEY,
  SELECTED_VARIABLES_KEY,
  VARIABLE_INFO_KEY,
  VARIABLES_LOADED_KEY,
} from "./constants";
import {
  getAxisInfoFromFileCommand,
  getAxisInfoFromVariableCommand,
  getFileVarsCommand,
  REFRESH_VAR_CMD,
} from "./PythonCommands";
import Utilities from "./Utilities/Utilities";
import NotebookUtilities from "./Utilities/NotebookUtilities";
import Variable from "./types/Variable";
import AxisInfo from "./types/AxisInfo";
import { boundMethod } from "autobind-decorator";

export default class VariableTracker {
  private _isBusy: boolean;
  private _notebookPanel: NotebookPanel;
  private _currentFile: string; // The last file source that was used
  private _currentFileChanged: Signal<this, string>;
  // Tracks information specific to each variable, such as its original name, source and alias
  private _variableInfo: { [alias: string]: { name: string; source: string } };
  // A signal for when variable information is added or removed
  private _variableInfoChanged: Signal<
    this,
    { [alias: string]: { name: string; source: string } }
  >;
  private _variables: Variable[];
  private _variablesChanged: Signal<this, Variable[]>;
  private _selectedVariables: string[];
  private _selectedVariablesChanged: Signal<this, string[]>;

  constructor() {
    this._notebookPanel = null;
    this._isBusy = false;

    this._currentFile = "";
    this._currentFileChanged = new Signal<this, string>(this);
    this._variableInfo = {};
    this._variableInfoChanged = new Signal<
      this,
      { [alias: string]: { name: string; source: string } }
    >(this);
    this._selectedVariables = Array<string>();
    this._selectedVariablesChanged = new Signal<this, string[]>(this);
    this._variables = Array<Variable>();
    this._variablesChanged = new Signal<this, Variable[]>(this);
  }

  get isBusy(): boolean {
    return this._isBusy;
  }

  get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }

  get variables(): Variable[] {
    return this._variables;
  }

  set variables(newVariables: Variable[]) {
    // Ensure selected variable list doesn't contain deleted variables
    const newSelection: string[] = Array<string>();
    this.selectedVariables.forEach((selection) => {
      if (this.findVariableByID(selection, newVariables)[0] >= 0) {
        newSelection.push(selection);
      }
    });
    this.selectedVariables = newSelection;

    this._variables = newVariables;
    this._variablesChanged.emit(newVariables);
  }

  get variablesChanged(): ISignal<this, Variable[]> {
    return this._variablesChanged;
  }

  get currentFile(): string {
    return this._currentFile;
  }

  set currentFile(filePath: string) {
    this._currentFile = filePath;
    this._currentFileChanged.emit(filePath);
  }

  get currentFileChanged(): ISignal<this, string> {
    return this._currentFileChanged;
  }

  get variableInfo(): {
    [alias: string]: { name: string; source: string };
  } {
    return this._variableInfo;
  }

  set variableInfo(varInfo: {
    [alias: string]: { name: string; source: string };
  }) {
    this._variableInfo = varInfo;
    this._variableInfoChanged.emit(varInfo);
  }

  get variableInfoChanged(): ISignal<
    this,
    { [alias: string]: { name: string; source: string } }
  > {
    return this._variableInfoChanged;
  }

  get selectedVariables(): string[] {
    return this._selectedVariables;
  }

  set selectedVariables(selection: string[]) {
    this._selectedVariables = selection;
    this._selectedVariablesChanged.emit(selection); // Publish that selected variables changed
  }

  get selectedVariablesChanged(): ISignal<this, string[]> {
    return this._selectedVariablesChanged;
  }

  public resetVarTracker(): void {
    this.currentFile = "";
    this.variables = Array<Variable>();
    this._variableInfo = {};
    this._notebookPanel = null;
  }

  @boundMethod
  public async setNotebook(notebookPanel: NotebookPanel): Promise<void> {
    if (this._notebookPanel) {
      // Save meta data in current notebook before switching
      await this.saveMetaData();
    }

    // Update to new notebook
    if (notebookPanel) {
      this._notebookPanel = notebookPanel;
      // Load any relevant meta data from new notebook
      await this.loadMetaData();

      // Refresh the notebook
      await this.refreshVariables();
    } else {
      this.resetVarTracker();
    }
  }

  /**
   * Searches for a variable with the specified varID and returns the index and variable if found.
   * By default the search will search within the varTracker variables (all loaded variables).
   * @param varID The variable's ID
   * @param varArray If set, function will search within the specified group of variables (instead of all variables)
   */
  @boundMethod
  public findVariableByID(
    varID: string,
    varArray?: Variable[]
  ): [number, Variable] {
    const variables: Variable[] = varArray ? varArray : this.variables;

    for (let idx = 0; idx < variables.length; idx += 1) {
      if (variables[idx].varID === varID) {
        return [idx, variables[idx]];
      }
    }
    return [-1, null];
  }

  /**
   * Searches for a variable with the specified alias and returns the index and variable if found.
   * By default the search will search within the varTracker variables (all loaded variables).
   * @param alias The variable's name/alias
   * @param varArray If set, function will search within the specified group of variables (instead of all variables)
   */
  @boundMethod
  public findVariableByAlias(
    alias: string,
    varArray?: Variable[]
  ): [number, Variable] {
    const variables: Variable[] = varArray ? varArray : this.variables;

    for (let idx = 0; idx < variables.length; idx += 1) {
      if (variables[idx].alias === alias) {
        return [idx, variables[idx]];
      }
    }
    return [-1, null];
  }

  /**
   * Adds the variable to the varTracker, and replaces any existing variable
   * @param variable The variable to load into the notebook
   */
  @boundMethod
  public addVariable(variable: Variable): void {
    // Save the variable information
    this.variableInfo[variable.alias] = {
      name: variable.name,
      source: variable.sourceName,
    };

    let currentVars: Variable[] = this.variables;

    // If no variables are in the list, update meta data and variables list
    if (!currentVars || currentVars.length < 1) {
      currentVars = Array<Variable>();
      currentVars.push(variable);
    } else {
      // If there are already variables stored, check if variable exists and replace if so
      const idx: number = this.findVariableByID(variable.varID)[0];
      if (idx >= 0) {
        currentVars[idx] = variable;
      } else {
        currentVars.push(variable);
      }
    }

    this.variables = currentVars;
    this.refreshVariables();
  }

  /**
   * Creates a copy of the variable, gives it a new name and returns the variable
   * @param variable - Variable: The original variable to copy
   * @param newName - string: The new name for the variable
   * @param addVar - boolean: Whether the copy should be added to the varTracker
   * @returns - Variable: The newly created variable
   */
  @boundMethod
  public copyVariable(
    variable: Variable,
    newName: string,
    addVar: boolean
  ): Variable {
    // Exit if variable is not defined or blank
    if (!variable || !newName) {
      return;
    }

    // Create copy
    const newCopy: Variable = new Variable();

    newCopy.alias = newName;
    newCopy.axisInfo = variable.axisInfo;
    newCopy.axisList = variable.axisList;
    newCopy.longName = variable.longName;
    newCopy.name = variable.name;
    newCopy.pythonID = variable.pythonID;
    newCopy.sourceName = variable.sourceName;
    newCopy.units = variable.units;

    // Select copy
    this.selectedVariables.push(newCopy.varID);

    // Add copy to current variables
    if (addVar) {
      this.addVariable(newCopy);
    }

    return newCopy;
  }

  /**
   *
   * @param variable The variable to load into the notebook
   */
  @boundMethod
  public deleteVariable(variable: Variable): void {
    // Deselect variable
    this.deselectVariable(variable.varID);

    // Remove the variable's information
    const newVarInfo: {
      [alias: string]: { name: string; source: string };
    } = this.variableInfo;
    delete newVarInfo[variable.alias];
    this.variableInfo = newVarInfo;

    const currentVars: Variable[] = this.variables;

    // If variables are in the list, delete variable from variables list
    if (currentVars.length >= 1) {
      const currentIdx: number = this.findVariableByID(variable.varID)[0];
      if (currentIdx >= 0) {
        currentVars.splice(currentIdx, 1);
      }
    }

    // Update variable list
    this.variables = currentVars;
  }

  /**
   * @description adds a variable to the selectedVariables list
   * @param variable the variable to add to the selected list
   */
  @boundMethod
  public async selectVariable(varID: string): Promise<void> {
    if (varID) {
      // Make sure variable isn't already selected
      if (this.selectedVariables.indexOf(varID) < 0) {
        const newSelection = this.selectedVariables;
        newSelection.push(varID);
        this.selectedVariables = newSelection;
      }
    }
  }

  /**
   * @description removes a variable from the selectedVariables list
   * @param variable the variable to remove from the selected list
   */
  @boundMethod
  public async deselectVariable(varID: string): Promise<void> {
    const idx: number = this.selectedVariables.indexOf(varID);
    if (idx >= 0) {
      const newSelection = this.selectedVariables;
      newSelection.splice(idx, 1);
      this.selectedVariables = newSelection;
    }
  }

  @boundMethod
  public async saveMetaData(): Promise<void> {
    await this.notebookPanel.sessionContext.ready;

    if (!this.notebookPanel || !this.notebookPanel.model) {
      return;
    }

    // Save name of last file viewed in the notebook
    await NotebookUtilities.setMetaData(
      this.notebookPanel,
      FILE_PATH_KEY,
      this.currentFile
    );

    // Save the variable aliases
    NotebookUtilities.setMetaDataNow(
      this.notebookPanel,
      VARIABLE_INFO_KEY,
      this.variableInfo
    );

    // Save the selected variables inbto  meta data
    NotebookUtilities.setMetaDataNow(
      this.notebookPanel,
      SELECTED_VARIABLES_KEY,
      this.selectedVariables
    );

    // Save variables to meta data
    NotebookUtilities.setMetaDataNow(
      this.notebookPanel,
      VARIABLES_LOADED_KEY,
      this.variables
    );

    await NotebookUtilities.saveNotebook(this.notebookPanel);
  }

  @boundMethod
  public async loadMetaData(): Promise<void> {
    await this.notebookPanel.sessionContext.ready;

    if (!this.notebookPanel || !this.notebookPanel.model) {
      return;
    }

    // Update last file opened
    const lastSource: string | null = await NotebookUtilities.getMetaData(
      this.notebookPanel,
      FILE_PATH_KEY
    );
    this.currentFile = lastSource ? lastSource : "";

    // Update the loaded variables data from meta data
    let result: any = await NotebookUtilities.getMetaData(
      this.notebookPanel,
      VARIABLES_LOADED_KEY
    );
    this.variables = result ? result : Array<Variable>();

    // Update the variable sources from meta data
    result = await NotebookUtilities.getMetaData(
      this.notebookPanel,
      VARIABLE_INFO_KEY
    );
    this.variableInfo = result ? result : {};

    // Load the selected variables from meta data (if exists)
    const selection: any = await NotebookUtilities.getMetaData(
      this.notebookPanel,
      SELECTED_VARIABLES_KEY
    );

    // No meta data means fresh notebook with no selections
    this.selectedVariables = selection ? selection : Array<Variable>();
  }

  /**
   * Opens a '.nc' file to read in it's variables via a kernel request.
   * @param filePath The file to open for variable reading
   * @returns Promise<Array<Variable>> -- A promise contianing an array of variables
   * that were found in the file.
   */
  @boundMethod
  public async getFileVariables(filePath: string): Promise<Variable[]> {
    if (!filePath) {
      return Array<Variable>();
    }

    try {
      // Get valid path for the file
      const nbPath = `${this.notebookPanel.sessionContext.path}`;
      const path: string = Utilities.getUpdatedPath(nbPath, filePath);

      this._isBusy = true;

      // Try to open file in cdms, exit early if fails
      if (!(await Utilities.tryFilePath(this.notebookPanel, path))) {
        this._isBusy = false;
        console.error(`Opening file failed. Path: ${path}`);
        return Array<Variable>();
      }

      // File loaded successfully, pull variables from file
      const result: string = await Utilities.sendSimpleKernelRequest(
        this.notebookPanel,
        getFileVarsCommand(path)
      );
      this._isBusy = false;

      // Exit if result is blank
      if (!result) {
        console.error(`File had no variables. Path: ${path}`);
        return Array<Variable>();
      }

      // Parse the resulting output into an object
      const fileVariables: any = JSON.parse(result.slice(1, result.length - 1));
      const newVars = Array<Variable>();
      Object.keys(fileVariables.vars).map((varName: string) => {
        const v = new Variable();
        v.name = varName;
        v.alias = varName;
        v.pythonID = fileVariables.vars[varName].pythonID;
        v.longName = fileVariables.vars[varName].name;
        v.axisList = fileVariables.vars[varName].axisList;
        v.axisInfo = Array<AxisInfo>();
        if (v.axisList) {
          v.axisList.map((item: any) => {
            v.axisInfo.push(fileVariables.axes[item]);
          });
        }
        v.units = fileVariables.vars[varName].units;
        v.sourceName = filePath;
        newVars.push(v);
      });
      return newVars;
    } catch (error) {
      return Array<Variable>();
    }
  }

  /**
   * This updates the current variable list by sending a command to the kernel directly.
   */
  @boundMethod
  public async refreshVariables(): Promise<void> {
    if (!this.notebookPanel) {
      return;
    }
    this._isBusy = true;
    // Get the variables info
    const result: string = await Utilities.sendSimpleKernelRequest(
      this.notebookPanel,
      REFRESH_VAR_CMD
    );
    this._isBusy = false;

    // Exit if result is blank
    if (!result) {
      return;
    }

    // A grouping object so that variables from each data source are updated together
    const varGroups: { [sourceName: string]: Variable[] } = {};
    // A grouping object for variables that are derived/have no source listed
    const derivedVars = Array<Variable>();
    // Parse the resulting output into a list of variables with basic data
    const notebookVariables: any = JSON.parse(
      result.slice(1, result.length - 1)
    );

    // Exit early if no variables exist
    if (Object.keys(notebookVariables).length < 1) {
      this.variables = Array<Variable>();
      return;
    }

    const newVars = Array<Variable>();
    Object.keys(notebookVariables).map(async (varAlias: string) => {
      const v: Variable = new Variable();
      const existingInfo: { name: string; source: string } = this.variableInfo[
        varAlias
      ];
      v.name = existingInfo ? existingInfo.name : varAlias;
      v.alias = varAlias;
      v.pythonID = notebookVariables[varAlias].pythonID;
      v.longName = notebookVariables[varAlias].name;
      v.axisList = notebookVariables[varAlias].axisList;
      v.axisInfo = Array<AxisInfo>();
      v.units = notebookVariables[varAlias].units;

      // Update the data source
      v.sourceName = existingInfo ? existingInfo.source : "";
      if (v.sourceName) {
        if (varGroups[v.sourceName]) {
          varGroups[v.sourceName].push(v);
        } else {
          // If this source hasn't been initialized, initialize it
          varGroups[v.sourceName] = Array<Variable>();
          varGroups[v.sourceName].push(v);
        }
      } else {
        derivedVars.push(v);
      }

      newVars.push(v);
    });

    // Update axis info for each group of file variables
    if (varGroups) {
      Object.keys(varGroups).forEach(async (sourceName: string) => {
        await this.updateAxesInfoGroup(varGroups[sourceName]);
      });
    }
    // Update axis info for each derived variable
    derivedVars.forEach(async (variable: Variable) => {
      await this.updateAxesInfoVariable(variable);
    });

    this.variables = newVars;
  }

  // Updates the axes information for each variable based on what source it came from
  @boundMethod
  public async updateAxesInfoGroup(varGroup: Variable[]): Promise<void> {
    // Get the filepath from the data readerlist
    const sourceFile: string = varGroup[0].sourceName;

    // Exit early if no source filepath exists
    if (!sourceFile) {
      return;
    }

    // Get relative path for the file
    const nbPath = `${this.notebookPanel.sessionContext.path}`;
    const path: string = Utilities.getUpdatedPath(nbPath, sourceFile);

    this._isBusy = true;

    // Try to open file in cdms, exit early if fails
    if (!(await Utilities.tryFilePath(this.notebookPanel, path))) {
      this._isBusy = false;
      console.error(`File had no variables: ${path}`);
      return;
    }

    // Get the variables info
    const result: string = await Utilities.sendSimpleKernelRequest(
      this.notebookPanel,
      getAxisInfoFromFileCommand(path)
    );
    this._isBusy = false;

    // Exit if result is blank
    if (!result) {
      return;
    }

    // Parse the resulting output as file specific axes
    const axesInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Update axes info for each variable in the group
    varGroup.forEach((variable: Variable) => {
      if (variable.axisList) {
        variable.axisList.map((item: any) => {
          if (axesInfo[item] && axesInfo[item].data) {
            axesInfo[item].first = axesInfo[item].data[0];
            axesInfo[item].last =
              axesInfo[item].data[axesInfo[item].data.length - 1];
            variable.axisInfo.push(axesInfo[item]);
          }
        });
      }
    });
  }

  // Add the axes information for each variable if it has no info
  @boundMethod
  public async updateAxesInfoVariable(variable: Variable): Promise<void> {
    // Exit early if axis info is present already
    if (variable.axisInfo.length > 0) {
      return;
    }
    this._isBusy = true;
    // Get the variables info
    const result: string = await Utilities.sendSimpleKernelRequest(
      this.notebookPanel,
      getAxisInfoFromVariableCommand(variable.alias)
    );
    this._isBusy = false;

    // Exit if result is blank
    if (!result) {
      return;
    }

    // Parse the resulting output as file specific axes
    const axesInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Update axes info for the variable
    if (variable.axisList) {
      variable.axisList.map((item: any) => {
        if (axesInfo[item] && axesInfo[item].data) {
          axesInfo[item].first = axesInfo[item].data[0];
          axesInfo[item].last =
            axesInfo[item].data[axesInfo[item].data.length - 1];
          variable.axisInfo.push(axesInfo[item]);
        }
      });
    }
  }
}
