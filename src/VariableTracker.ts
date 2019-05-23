import { NotebookPanel } from "@jupyterlab/notebook";
import { Variable } from "./components/Variable";
import { ISignal, Signal } from "@phosphor/signaling";

import { NotebookUtilities } from "./NotebookUtilities";
import {
  FILE_PATH_KEY,
  GET_AXIS_INFO_VAR_CMD,
  getAxisInfoFromVariableCommand,
  getFileVarsCommand,
  REFRESH_VAR_CMD,
  SELECTED_VARIABLES_KEY,
  VARIABLE_ALIASES_KEY,
  VARIABLE_SOURCES_KEY,
  VARIABLES_LOADED_KEY
} from "./constants";
import { Utilities } from "./Utilities";
import { AxisInfo } from "./components/AxisInfo";

export class VariableTracker {
  private _isBusy: boolean;
  private _notebookPanel: NotebookPanel;

  private _currentFile: string; // The last file source that was used
  private _currentFileChanged: Signal<this, string>;
  private _variableSources: { [varID: string]: string }; // Tracks what file each variable came from
  private _variableSourcesChanged: Signal<this, { [varID: string]: string }>;
  private _variableAliases: { [alias: string]: string };
  private _variableAliasesChanged: Signal<this, { [alias: string]: string }>;
  // private _dataReaderList: { [dataName: string]: string }; // A dictionary containing data variable names and associated file path
  // private _dataReaderListChanged: Signal<this, { [dataName: string]: string }>;
  private _variables: Variable[];
  private _variablesChanged: Signal<this, Variable[]>;
  private _selectedVariables: Variable[];
  private _selectedVariablesChanged: Signal<this, Variable[]>;

  constructor() {
    this._notebookPanel = null;
    this._isBusy = false;

    this._currentFile = "";
    this._currentFileChanged = new Signal<this, string>(this);
    this._variableSources = {};
    this._variableSourcesChanged = new Signal<
      this,
      { [varID: string]: string }
    >(this);
    this._variableAliases = {};
    this._variableAliasesChanged = new Signal<
      this,
      { [alias: string]: string }
    >(this);
    /*this._dataReaderList = {};
    this._dataReaderListChanged = new Signal<
      this,
      { [dataName: string]: string }
    >(this);*/
    this._selectedVariables = Array<Variable>();
    this._selectedVariablesChanged = new Signal<this, Variable[]>(this);
    this._variables = Array<Variable>();
    this._variablesChanged = new Signal<this, Variable[]>(this);

    this.addVariable = this.addVariable.bind(this);
    this.deleteVariable = this.deleteVariable.bind(this);
    // this.addDataSource = this.addDataSource.bind(this);

    // this.getDataReaderName = this.getDataReaderName.bind(this);
    this.getFileVariables = this.getFileVariables.bind(this);
    this.loadMetaData = this.loadMetaData.bind(this);
    this.refreshVariables = this.refreshVariables.bind(this);
    this.setNotebook = this.setNotebook.bind(this);
    this.tryFilePath = this.tryFilePath.bind(this);
    this.updateAxesInfoGroup = this.updateAxesInfoGroup.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.saveMetaData = this.saveMetaData.bind(this);
    this.copyVariable = this.copyVariable.bind(this);
    this.findVarByID = this.findVarByID.bind(this);
    this.findVarByAlias = this.findVarByAlias.bind(this);
    this.resetVarTracker = this.resetVarTracker.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.deselectVariable = this.deselectVariable.bind(this);
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
    const newIDs: string[] = newVariables.map((variable: Variable) => {
      return variable.varID;
    });

    // Clean-up any variables that are not in the new Variables set
    const newSources: { [varID: string]: string } = this.variableSources;
    const newAliases: { [varAlias: string]: string } = this.variableAliases;
    const newSelections: Variable[] = this.selectedVariables;
    this._variables.forEach((variable: Variable) => {
      // If the old variable is not in the new list, remove it
      if (newIDs.indexOf(variable.varID) === -1) {
        delete newSources[variable.varID];
        delete newAliases[variable.alias];
        const idx: number = this.findVarByID(variable.varID)[0];
        if (idx >= 0) {
          newSelections.splice(idx, 1);
        }
      }
    });

    this.variableSources = newSources;
    this.variableAliases = newAliases;
    this.selectedVariables = newSelections;
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

  /*get dataReaderList(): { [dataName: string]: string } {
    return this._dataReaderList;
  }

  get dataReaderListChanged(): ISignal<this, { [dataName: string]: string }> {
    return this._dataReaderListChanged;
  }*/

  get selectedVariables(): Variable[] {
    return this._selectedVariables;
  }

  set selectedVariables(selection: Variable[]) {
    this._selectedVariables = selection;
    this._selectedVariablesChanged.emit(selection); // Publish that selected variables changed
  }

  get selectedVariablesChanged(): ISignal<this, Variable[]> {
    return this._selectedVariablesChanged;
  }

  get variableSources(): { [varID: string]: string } {
    return this._variableSources;
  }

  set variableSources(newSources: { [varID: string]: string }) {
    this._variableSources = newSources;
    this._variableSourcesChanged.emit(newSources);
  }

  get variableSourcesChanged(): ISignal<this, { [varID: string]: string }> {
    return this._variableSourcesChanged;
  }

  get variableAliases(): { [alias: string]: string } {
    return this._variableAliases;
  }

  set variableAliases(newAliases: { [alias: string]: string }) {
    this._variableAliases = newAliases;
    this._variableAliasesChanged.emit(newAliases);
  }

  get variableAliasesChanged(): ISignal<this, { [alias: string]: string }> {
    return this._variableAliasesChanged;
  }

  public resetVarTracker() {
    this.currentFile = "";
    this.variables = Array<Variable>();
    this.selectedVariables = Array<Variable>();
    this.variableSources = {};
    // this._dataReaderList = {};
    this._notebookPanel = null;
  }

  public async setNotebook(notebookPanel: NotebookPanel) {
    if (this._notebookPanel) {
      // Save meta data in current notebook before switching
      await this.saveMetaData();
    }

    // Update to new notebook
    if (notebookPanel) {
      this._notebookPanel = notebookPanel;
      // Load any relevant meta data from new notebook
      await this.loadMetaData();
    } else {
      this.resetVarTracker();
    }
  }

  /**
   * @param readerName The name of the file reader to add
   * @param filePath The file path of the file to add to the reader
   */
  /*public addDataSource(readerName: string, filePath: string): void {
    this._dataReaderList[readerName] = filePath;
    this._dataReaderListChanged.emit(this._dataReaderList);
  }*/

  /**
   * Searches for a variable with the specified varID and returns the index and variable if found.
   * By default the search will search within the varTracker variables (all loaded variables).
   * @param varID The variable's ID
   * @param varArray If set, function will search within the specified group of variables (instead of all variables)
   */
  public findVarByID(varID: string, varArray?: Variable[]): [number, Variable] {
    const variables: Variable[] = varArray ? varArray : this.variables;

    for (let idx: number = 0; idx < variables.length; idx += 1) {
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
  public findVarByAlias(
    alias: string,
    varArray?: Variable[]
  ): [number, Variable] {
    const variables: Variable[] = varArray ? varArray : this.variables;

    for (let idx: number = 0; idx < variables.length; idx += 1) {
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
  public addVariable(variable: Variable): void {
    // Save the source of the variable
    const newSource: { [varID: string]: string } = this.variableSources;
    newSource[variable.varID] = variable.sourceName;
    this.variableSources = newSource;

    // Save the original name of the variable
    const newAliases: { [varAlias: string]: string } = this.variableAliases;
    newAliases[variable.alias] = variable.name;
    this.variableAliases = newAliases;

    let currentVars: Variable[] = this.variables;

    // If no variables are in the list, update meta data and variables list
    if (!currentVars || currentVars.length < 1) {
      currentVars = Array<Variable>();
      currentVars.push(variable);
    } else {
      // If there are already variables stored, check if variable exists and replace if so
      const idx: number = this.findVarByID(variable.varID)[0];
      if (idx >= 0) {
        currentVars[idx] = variable;
      } else {
        currentVars.push(variable);
      }
    }

    this.variables = currentVars;
  }

  /**
   * Creates a copy of the variable, gives it a new name and adds it to varTracker
   * @param variable - Variable: The original variable to copy
   * @param newName - string: The new name for the variable
   * @returns - Variable: The newly created variable
   */
  public copyVariable(variable: Variable, newName: string): Variable {
    // Exit if variable is not defined, new name is same as current alias or blank
    if (!variable || !newName || variable.alias === newName) {
      return;
    }

    // Exit if name already exists
    if (
      this.variableAliases &&
      Object.keys(this.variableAliases).indexOf(newName) >= 0
    ) {
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
    this.selectedVariables.push(newCopy);

    // Add copy to current variables
    this.addVariable(newCopy);

    return newCopy;
  }

  /**
   *
   * @param variable The variable to load into the notebook
   */
  public deleteVariable(variable: Variable): void {
    // Update variable selections
    const selections: Variable[] = this.selectedVariables;
    const selectIdx: number = this.findVarByID(variable.varID, selections)[0];
    if (selectIdx >= 0) {
      selections.splice(selectIdx, 1);
    }
    this.selectedVariables = selections;

    // Remove the source of the variable
    const newSource: { [varID: string]: string } = this.variableSources;
    delete newSource[variable.varID];
    this.variableSources = newSource;

    // Remove the original name of the variable
    const newAliases: { [varAlias: string]: string } = this.variableAliases;
    delete newAliases[variable.alias];
    this.variableAliases = newAliases;

    const currentVars: Variable[] = this.variables;

    // If variables are in the list, delete variable from variables list
    if (currentVars.length >= 1) {
      const currentIdx: number = this.findVarByID(variable.varID)[0];
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
  public async selectVariable(
    variable: Variable,
    array?: Variable[]
  ): Promise<void> {
    if (variable) {
      const newSelection = this.selectedVariables;
      newSelection.push(variable);
      this.selectedVariables = newSelection;
    }
  }

  /**
   * @description removes a variable from the selectedVariables list
   * @param variable the variable to remove from the selected list
   */
  public async deselectVariable(
    variable: Variable,
    array?: Variable[]
  ): Promise<void> {
    const idx: number = this.findVarByID(
      variable.varID,
      this.selectedVariables
    )[0];
    if (idx >= 0) {
      const newSelection = this.selectedVariables;
      newSelection.splice(idx, 1);
      this.selectedVariables = newSelection;
    }
  }

  public async saveMetaData() {
    await this.notebookPanel.session.ready;

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
      VARIABLE_ALIASES_KEY,
      this.variableAliases
    );

    // Save data reader list to meta data
    /*NotebookUtilities.setMetaDataNow(
      this.notebookPanel,
      DATA_LIST_KEY,
      this.dataReaderList
    );*/

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

    // Save the variable file sources
    NotebookUtilities.setMetaDataNow(
      this.notebookPanel,
      VARIABLE_SOURCES_KEY,
      this.variableSources
    );

    await NotebookUtilities.saveNotebook(this.notebookPanel);
  }

  public async loadMetaData() {
    await this.notebookPanel.session.ready;

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
      VARIABLE_SOURCES_KEY
    );
    this.variableSources = result ? result : {};

    // Update the variable aliases
    result = await NotebookUtilities.getMetaData(
      this.notebookPanel,
      VARIABLE_ALIASES_KEY
    );
    this.variableAliases = result ? result : {};

    // Load the selected variables from meta data (if exists)
    const selection: Variable[] = await NotebookUtilities.getMetaData(
      this.notebookPanel,
      SELECTED_VARIABLES_KEY
    );

    // No meta data means fresh notebook with no selections
    this.selectedVariables = selection ? selection : Array<Variable>();

    // Update the list of data variables and associated filepath
    /*const readers: {
      [dataName: string]: string;
    } = await NotebookUtilities.getMetaData(this.notebookPanel, DATA_LIST_KEY);
    this._dataReaderList = readers ? readers : {};
    this._dataReaderListChanged.emit(this._dataReaderList);*/
  }

  // Will try to open a file path in cdms2. Returns true if successful.
  public async tryFilePath(filePath: string) {
    try {
      await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        `tryOpenFile = cdms2.open('${filePath}')\ntryOpenFile.close()`,
        false
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the name for a data reader object to read data from a file. Creates a new name if one doesn't exist.
   * @param filePath The file path of the new file added
   */
  /*public getDataReaderName(filePath: string): string {
    // Check whether that file path is already open, return the data name if so
    let dataName: string = "";
    const found: boolean = Object.keys(this.dataReaderList).some(
      (dataVar: string) => {
        dataName = dataVar;
        return this.dataReaderList[dataVar] === filePath;
      }
    );
    if (found) {
      return dataName;
    }

    // Filepath hasn't been added before, create the name for data variable based on file path
    dataName = `${Utilities.createValidVarName(filePath)}_data`;

    // If the reader name already exist but the path is different (like for two files with
    // similar names but different paths) add a count to the end until it's unique
    let count: number = 1;
    let newName: string = dataName;

    while (Object.keys(this.dataReaderList).indexOf(newName) >= 0) {
      newName = `${dataName}${count}`;
      count += 1;
    }

    return newName;
  }*/

  /**
   * Opens a '.nc' file to read in it's variables via a kernel request.
   * @param filePath The file to open for variable reading
   * @returns Promise<Array<Variable>> -- A promise contianing an array of variables
   * that were found in the file.
   */
  public async getFileVariables(filePath: string): Promise<Variable[]> {
    if (!filePath) {
      return Array<Variable>();
    }

    try {
      // Get relative path for the file
      const nbPath: string = `${this.notebookPanel.session.path}`;
      const relativePath: string = Utilities.getRelativePath(nbPath, filePath);

      this._isBusy = true;
      const result: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        getFileVarsCommand(relativePath)
      );
      this._isBusy = false;

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
        fileVariables.vars[varName].axisList.map((item: any) => {
          v.axisInfo.push(fileVariables.axes[item]);
        });
        v.units = fileVariables.vars[varName].units;
        // v.sourceName = this.getDataReaderName(filePath);
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
  public async refreshVariables(): Promise<void> {
    if (!this.notebookPanel) {
      return;
    }
    this._isBusy = true;
    // Get the variables info
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      REFRESH_VAR_CMD
    );
    this._isBusy = false;

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
    let srcName: string;
    Object.keys(notebookVariables).map(async (varAlias: string) => {
      const v: Variable = new Variable();
      const originalName: string = this.variableAliases[varAlias];
      v.name = originalName ? originalName : varAlias;
      v.alias = varAlias;
      v.pythonID = notebookVariables[varAlias].pythonID;
      v.longName = notebookVariables[varAlias].name;
      v.axisList = notebookVariables[varAlias].axisList;
      v.axisInfo = Array<AxisInfo>();
      v.units = notebookVariables[varAlias].units;

      // Update the data source
      srcName = this.variableSources[v.varID];
      // v.sourceName = srcName ? srcName : "";
      if (srcName) {
        v.sourceName = srcName;
        if (varGroups[v.sourceName]) {
          varGroups[v.sourceName].push(v);
        } else {
          // If this source hasn't been initialized, initialize it
          varGroups[v.sourceName] = Array<Variable>();
          varGroups[v.sourceName].push(v);
        }
      } else {
        v.sourceName = "";
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
  public async updateAxesInfoGroup(varGroup: Variable[]): Promise<void> {
    // Get the filepath from the data readerlist
    // const sourceFile: string = this.dataReaderList[varGroup[0].sourceName];
    const sourceFile: string = varGroup[0].sourceName;

    // Exit early if no source filepath exists
    if (!sourceFile) {
      return;
    }

    // Get relative path for the file
    const nbPath: string = `${this.notebookPanel.session.path}`;
    const relativePath: string = Utilities.getRelativePath(nbPath, sourceFile);

    this._isBusy = true;
    // Get the variables info
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      getAxisInfoFromVariableCommand(relativePath)
    );
    this._isBusy = false;

    // Parse the resulting output as file specific axes
    const axesInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Update axes info for each variable in the group
    varGroup.forEach((variable: Variable) => {
      variable.axisList.map((item: any) => {
        if (axesInfo[item].data) {
          axesInfo[item].min = axesInfo[item].data[0];
          axesInfo[item].max =
            axesInfo[item].data[axesInfo[item].data.length - 1];
          variable.axisInfo.push(axesInfo[item]);
        }
      });
    });
  }

  // Add the axes information for each variable if it has no info
  public async updateAxesInfoVariable(variable: Variable): Promise<void> {
    // Exit early if axis info is present already
    if (variable.axisInfo.length > 0) {
      return;
    }
    this._isBusy = true;
    // Get the variables info
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      GET_AXIS_INFO_VAR_CMD(variable.alias)
    );
    this._isBusy = false;

    // Parse the resulting output as file specific axes
    const axesInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Update axes info for the variable
    variable.axisList.map((item: any) => {
      if (axesInfo[item].data) {
        axesInfo[item].min = axesInfo[item].data[0];
        axesInfo[item].max =
          axesInfo[item].data[axesInfo[item].data.length - 1];
        variable.axisInfo.push(axesInfo[item]);
      }
    });
  }

  /**
   * @param newInfo new dimension info for the variables axis
   * @param varID the name of the variable to update
   */
  public updateDimInfo(newInfo: any, varID: string): void {
    const newVariables: Variable[] = this._variables;
    newVariables.forEach((variable: Variable, varIndex: number) => {
      if (variable.varID !== varID) {
        return;
      }
      variable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
        if (axis.name !== newInfo.name) {
          return;
        }
        newVariables[varIndex].axisInfo[axisIndex].min = newInfo.min;
        newVariables[varIndex].axisInfo[axisIndex].max = newInfo.max;
      });
    });
    this.variables = newVariables;
  }
}
