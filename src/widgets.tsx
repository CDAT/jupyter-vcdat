// Dependencies
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Widget } from "@phosphor/widgets";
import { JupyterLab } from "@jupyterlab/application";
import { IChangedArgs } from "@jupyterlab/coreutils";
import { CommandRegistry } from "@phosphor/commands";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { NotebookTracker, NotebookPanel, Notebook } from "@jupyterlab/notebook";

// Project Components
import {
  FILE_PATH_KEY,
  IMPORT_CELL_KEY,
  CHECK_MODULES_CMD,
  REQUIRED_MODULES,
  GET_FILE_VARIABLES,
  VARIABLES_LOADED_KEY,
  NOTEBOOK_STATE,
  REFRESH_GRAPHICS_CMD,
  BASE_GRAPHICS,
  REFRESH_TEMPLATES_CMD,
  BASE_TEMPLATES,
  REFRESH_VAR_INFO,
  GET_AXIS_INFO,
  CANVAS_CELL_KEY,
  READER_CELL_KEY,
  DATA_LIST_KEY,
  VARIABLE_SOURCES_KEY,
  EXTENSIONS_REGEX
} from "./constants";
import { VCSMenu } from "./components/VCSMenu";
import { NotebookUtilities } from "./NotebookUtilities";
import { CellUtilities } from "./CellUtilities";
import Variable from "./components/Variable";
import AxisInfo from "./components/AxisInfo";
import { showErrorMessage } from "@jupyterlab/apputils";
import { MiscUtilities } from "./Utilities";

/**
 * This is the main component for the vcdat extension.
 */
export class LeftSideBarWidget extends Widget {
  div: HTMLDivElement; // The div container for this widget
  commands: CommandRegistry; // Jupyter app CommandRegistry
  notebookTracker: NotebookTracker; // This is to track current notebooks
  application: JupyterLab; //The JupyterLab application object
  VCSMenuRef: VCSMenu; // the LeftSidebar component
  variableList: Array<Variable>; // An array of variable objects
  dataReaderList: { [dataName: string]: string }; // A dictionary containing data variable names and associated file path
  graphicsMethods: any; // The current available graphics methods
  templatesList: Array<string>; // The list of current templates
  usingKernel: boolean; // The widgets is running a ker nel command
  canvasCount: number; // The number of canvases currently in use (just 1 for now)

  private _plotExists: boolean; // True if there exists a plot that can be exported, false if not.
  private _readyKernels: string[]; // A list containing kernel id's indicating the kernel is vcs_ready
  private _currentFile: string; // The current filepath of the data file being used for variables and data
  private _notebookPanel: NotebookPanel; // The notebook this widget is interacting with
  private _state: NOTEBOOK_STATE; // Keeps track of the current state of the notebook in the sidebar widget

  constructor(app: JupyterLab, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.application = app;
    this.commands = app.commands;
    this.notebookTracker = tracker;
    this._state = NOTEBOOK_STATE.Unknown;
    this.usingKernel = false;
    this.canvasCount = 0;
    this._currentFile = "";
    this._notebookPanel = null;
    this.variableList = new Array<Variable>();
    this.dataReaderList = {};
    this.graphicsMethods = BASE_GRAPHICS;
    this.templatesList = BASE_TEMPLATES;
    this._readyKernels = [];
    this._plotExists = false;
    this.initialize = this.initialize.bind(this);
    this.refreshVarList = this.refreshVarList.bind(this);
    this.setCurrentFile = this.setCurrentFile.bind(this);
    this.setNotebookPanel = this.setNotebookPanel.bind(this);
    this.updateNotebookState = this.updateNotebookState.bind(this);
    this.handleStateChanged = this.handleStateChanged.bind(this);
    this.refreshGraphicsList = this.refreshGraphicsList.bind(this);
    this.getFileVariables = this.getFileVariables.bind(this);
    this.handleNotebooksChanged = this.handleNotebooksChanged.bind(this);
    this.inject = this.inject.bind(this);
    this.getDataReaderName = this.getDataReaderName.bind(this);
    this.checkPlotExists = this.checkPlotExists.bind(this);
    this.injectAndDisplay = this.injectAndDisplay.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.injectImportsCode = this.injectImportsCode.bind(this);
    this.injectCanvasCode = this.injectCanvasCode.bind(this);
    this.injectDataReaders = this.injectDataReaders.bind(this);
    this.prepareNotebookPanel = this.prepareNotebookPanel.bind(this);
    this.VCSMenuRef = (React as any).createRef();
    ReactDOM.render(
      <ErrorBoundary>
        <VCSMenu
          ref={loader => (this.VCSMenuRef = loader)}
          commands={this.commands}
          inject={this.inject}
          plotReady={this.state == NOTEBOOK_STATE.VCS_Ready}
          plotExists={this.plotExists}
          plotExistTrue={() => {
            this.plotExists = true;
          }}
          getFileVariables={this.getFileVariables}
          getDataVarList={() => {
            return this.dataReaderList;
          }}
          getGraphicsList={() => {
            return this.graphicsMethods;
          }}
          getTemplatesList={() => {
            return this.templatesList;
          }}
          updateVariables={(variables: Array<Variable>) => {
            this.variableList = variables;
          }}
          refreshGraphicsList={this.refreshGraphicsList}
          notebookPanel={this._notebookPanel}
        />
      </ErrorBoundary>,
      this.div
    );

    this.commands.addCommand("vcs:load-data", {
      execute: args => {
        this.commands.execute("filebrowser:activate");
      }
    });
  }

  //=======GETTERS AND SETTERS=======
  public get state(): NOTEBOOK_STATE {
    return this._state;
  }

  public set state(notebookState: NOTEBOOK_STATE) {
    this._state = notebookState;

    if (notebookState == NOTEBOOK_STATE.VCS_Ready) {
      this.VCSMenuRef.updatePlotReady(true);
    } else {
      this.VCSMenuRef.updatePlotReady(false);
    }
  }

  public get currentFile(): string {
    return this._currentFile;
  }

  public get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }

  public set plotExists(value: boolean) {
    this._plotExists = value;
    this.VCSMenuRef.setState({ plotExists: value });
  }

  public get plotExists(): boolean {
    return this._plotExists;
  }

  //=======ASYNC SETTER FUNCTIONS=======

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  async setNotebookPanel(notebookPanel: NotebookPanel): Promise<void> {
    try {
      this.VCSMenuRef.setState({
        notebookPanel: notebookPanel
      });

      //Exit early if no change needed
      if (this._notebookPanel == notebookPanel) {
        return;
      }

      // Disconnect handlers from previous notebook_panel (if exists)
      if (this._notebookPanel) {
        this._notebookPanel.content.stateChanged.disconnect(
          this.handleStateChanged
        );
      }

      // Update current notebook
      this._notebookPanel = notebookPanel;

      // Reset the UI components
      await this.VCSMenuRef.resetState();

      // Update notebook state
      await this.updateNotebookState();

      // Reset notebook information
      this.dataReaderList = {};

      // Check if notebook is ready for vcs, and prepare it if so
      if (
        this.state == NOTEBOOK_STATE.VCS_Ready ||
        this.state == NOTEBOOK_STATE.InitialCellsReady
      ) {
        // Update current file
        let lastFileOpened: string | null = await NotebookUtilities.getMetaData(
          notebookPanel,
          FILE_PATH_KEY
        );
        if (lastFileOpened) {
          await this.setCurrentFile(lastFileOpened, false);
        } else {
          await this.setCurrentFile("", false);
        }

        // Update the loaded variables data from meta data
        let result: any = NotebookUtilities.getMetaDataNow(
          this.notebookPanel,
          VARIABLES_LOADED_KEY
        );
        if (result) {
          // Update the variables list
          this.VCSMenuRef.updateVariables(result);
        } else {
          this.VCSMenuRef.updateVariables(new Array<Variable>());
        }

        // Update the variable sources in the VCSMenu widget from meta data
        result = NotebookUtilities.getMetaDataNow(
          this.notebookPanel,
          VARIABLE_SOURCES_KEY
        );
        if (result) {
          // Update the variables list
          this.VCSMenuRef.setState({ variableSources: result });
        } else {
          // Update the variables list
          this.VCSMenuRef.setState({ variableSources: {} });
        }

        // Update the list of data variables and associated filepath
        result = NotebookUtilities.getMetaDataNow(
          this.notebookPanel,
          DATA_LIST_KEY
        );
        if (result) {
          this.dataReaderList = result;
        } else {
          this.dataReaderList = {};
        }

        // Run cells to make notebook vcs ready
        if (this.state == NOTEBOOK_STATE.InitialCellsReady) {
          // Get cell containing the imports key
          let importsCell = CellUtilities.findCellWithMetaKey(
            this.notebookPanel.content,
            IMPORT_CELL_KEY
          );
          // Get cell containing the data key
          let dataCell = CellUtilities.findCellWithMetaKey(
            this.notebookPanel.content,
            READER_CELL_KEY
          );
          // Get cell containing the canvas key
          let canvasCell = CellUtilities.findCellWithMetaKey(
            this.notebookPanel.content,
            CANVAS_CELL_KEY
          );

          this.usingKernel = true;
          if (importsCell[0] >= 0) {
            // If found, run the imports code
            await NotebookUtilities.sendSimpleKernelRequest(
              this.notebookPanel,
              importsCell[1].value.text,
              false
            );
          }
          if (dataCell[0] >= 0) {
            // If found, run the data code
            await NotebookUtilities.sendSimpleKernelRequest(
              this.notebookPanel,
              dataCell[1].value.text,
              false
            );
          }
          if (canvasCell[0] >= 0) {
            // If found, run the canvas code
            await NotebookUtilities.sendSimpleKernelRequest(
              this.notebookPanel,
              canvasCell[1].value.text,
              false
            );
          }
          this.usingKernel = false;

          // Select the last cell
          this.notebookPanel.content.activeCellIndex =
            this.notebookPanel.content.model.cells.length - 1;
          // Update kernel list to identify this kernel is ready
          this._readyKernels.push(this.notebookPanel.session.kernel.id);
          // Update state
          this.state = NOTEBOOK_STATE.VCS_Ready;
        }

        // Update the selected graphics method, variable list, templates and loaded variables
        await this.refreshGraphicsList();
        await this.refreshTemplatesList();
        await this.refreshVarList();

        this.VCSMenuRef.getVariableSelections();
        this.VCSMenuRef.getGraphicsSelections();
        this.VCSMenuRef.getTemplateSelection();

        // Update whether a plot exists
        this.plotExists = await this.checkPlotExists();

        // Set up notebook's handlers to keep track of notebook status
        this.notebookPanel.content.stateChanged.connect(
          this.handleStateChanged
        );
      } else {
        // Leave notebook alone if its not vcs ready, refresh var list for UI
        await this.refreshVarList();
        this.setCurrentFile("", false);
        this.plotExists = false;
      }
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when setting the notebook panel."
        );
      }
    }
  }

  /**
   * Updates the widget's current filepath which is used to load variables.
   * @param filePath The new file path to set
   * @param save Whether the file path should be saved to the notebook's meta data.
   */
  async setCurrentFile(filePath: string, save: boolean): Promise<void> {
    this._currentFile = filePath;
    // If notebook panel exists, set the notebook meta data to store current file path
    if (this.notebookPanel && save) {
      // Update the metadata
      await NotebookUtilities.setMetaData(
        this.notebookPanel,
        FILE_PATH_KEY,
        filePath
      );
    }
    await this.refreshVarList();
  }

  //=======WIDGET SIGNAL HANDLERS=======

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  async handleNotebooksChanged(
    tracker: NotebookTracker,
    notebookPanel: NotebookPanel
  ): Promise<void> {
    // Set the current notebook and wait for the session to be ready
    console.log("Notebook changed");
    await this.setNotebookPanel(notebookPanel);
  }

  /** This handles when the state of the notebook changes, like when a cell is modified, or run etc.
   *  Using this handler, the variable list is refreshed whenever a cell's code is run in a vcs ready
   * notebook.
   */
  async handleStateChanged(
    notebook: Notebook,
    stateChange: IChangedArgs<any>
  ): Promise<void> {
    // Perform actions when the notebook state has a command run and the notebook is vcs ready
    if (
      this.state == NOTEBOOK_STATE.VCS_Ready &&
      stateChange.newValue == "command"
    ) {
      this.refreshVarList();
      this.refreshGraphicsList();
      await this.refreshTemplatesList();
      this.plotExists = await this.checkPlotExists();
    }
  }

  //=======WIDGET COMPONENT METHODS (FOR PROPS)=======

  /**
   * Injects code into the bottom cell of the notebook, doesn't display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns Promise<[number, string]> - A promise for when the cell code has executed containing
   * the cell's index and output result
   */
  async inject(code: string): Promise<[number, string]> {
    try {
      let result = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        this.notebookPanel.content.model.cells.length - 1,
        code,
        true
      );
      this.notebookPanel.content.activeCellIndex = result[0] + 1;
      return result;
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when injecting the code."
        );
      }
      console.log(error);
    }
  }

  /**
   * Injects code into the bottom cell of the notebook, and WILL display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns any - Results from running the code.
   */
  async injectAndDisplay(code: string): Promise<any> {
    try {
      let result: any = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        this.notebookPanel.content.model.cells.length,
        code,
        false
      );
      return result;
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when injecting the code."
        );
      }
    }
  }

  //=======WIDGET MAIN FUNCTIONS=======

  /**
   * This initializes the left side bar widget and checks for any open notebooks.
   * The status of the notebook is set and the notebook switching handler is connected.
   */
  async initialize(): Promise<void> {
    // Check the active widget is a notebook panel
    if (this.application.shell.currentWidget instanceof NotebookPanel) {
      await this.setNotebookPanel(this.application.shell.currentWidget);
    } else {
      // There is no active notebook widget
      await this.setNotebookPanel(null);
    }

    // Notebook tracker will signal when a notebook is changed
    this.notebookTracker.currentChanged.connect(this.handleNotebooksChanged);
  }

  async checkPlotExists(): Promise<boolean> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready) {
        //Get the list of display elements in the canvas
        this.usingKernel = true;
        let output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          "output = canvas.listelements('display')"
        );
        this.usingKernel = false;
        return eval(output).length > 1;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * This updates the current graphics methods list by sending a command to the kernel directly.
   */
  async refreshGraphicsList(): Promise<void> {
    if (this.state == NOTEBOOK_STATE.VCS_Ready) {
      //Refresh the graphic methods
      this.usingKernel = true;
      let output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        REFRESH_GRAPHICS_CMD
      );
      this.usingKernel = false;

      //Update the list of latest variables and data
      this.graphicsMethods = JSON.parse(output.slice(1, output.length - 1));
    } else {
      this.graphicsMethods = BASE_GRAPHICS;
    }
  }

  /**
   * This updates the current templates methods list by sending a command to the kernel directly.
   */
  async refreshTemplatesList(): Promise<void> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready) {
        //Refresh the graphic methods
        this.usingKernel = true;
        let output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          REFRESH_TEMPLATES_CMD
        );
        //Update the list of latest variables and data
        this.templatesList = eval(output);
        this.usingKernel = false;
      } else {
        this.templatesList = BASE_TEMPLATES;
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * This updates the current variable list by sending a command to the kernel directly.
   */
  async refreshVarList(): Promise<void> {
    // Don't refresh if not VCS_Ready
    if (this.state != NOTEBOOK_STATE.VCS_Ready) {
      this.VCSMenuRef.updateVariables(new Array<Variable>());
      return;
    }

    this.usingKernel = true;
    // Get the variables info
    let result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      REFRESH_VAR_INFO
    );
    this.usingKernel = false;
    // A grouping object so that variables from each data source are updated
    let varGroups: { [sourceName: string]: Variable[] } = {};
    // Parse the resulting output into a list of variables with basic data
    let variableInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Exit early if no variables exist
    if (Object.keys(variableInfo).length < 1) {
      this.VCSMenuRef.updateVariables(new Array<Variable>());
      return;
    }

    let newVars = new Array<Variable>();
    let sourceName: string;
    Object.keys(variableInfo).map(async (item: string) => {
      let v: Variable = new Variable();
      v.name = item;
      v.pythonID = variableInfo[item].pythonID;
      v.longName = variableInfo[item].name;
      v.axisList = variableInfo[item].axisList;
      v.axisInfo = new Array<AxisInfo>();
      v.units = variableInfo[item].units;

      // Update the parent data source
      sourceName = this.VCSMenuRef.state.variableSources[v.name];
      if (sourceName) {
        v.sourceName = sourceName;
        if (varGroups[v.sourceName]) {
          // Add variable to group based on source data
          varGroups[v.sourceName].push(v);
        } else {
          // If this source hasn't been initialized, initialize it
          varGroups[v.sourceName] = new Array<Variable>();
          varGroups[v.sourceName].push(v);
        }
      } else {
        v.sourceName = "";
      }

      newVars.push(v);
    });

    // Update axis info for each variable
    if (varGroups) {
      Object.keys(varGroups).forEach(async (sourceName: string) => {
        await this.updateAxesInfo(varGroups[sourceName]);
      });
    }

    this.VCSMenuRef.updateVariables(newVars);
  }

  // Updates the axes information for each variable based on what source it came from
  async updateAxesInfo(varGroup: Array<Variable>): Promise<void> {
    /* variableAxes.vars[item].axisList.map((item: any) => {
          variableAxes.axes[item].min = variableAxes.axes[item].data[0];
          variableAxes.axes[item].max =
            variableAxes.axes[item].data[
              variableAxes.axes[item].data.length - 1
            ];
          v.axisInfo.push(variableAxes.axes[item]);
        });*/
    // Get the filepath from the data readerlist
    let sourceFile: string = this.dataReaderList[varGroup[0].sourceName];

    // Exit early if no source filepath exists
    if (sourceFile == "") {
      return;
    }

    let cmd: string = `import cdms2\nimport json\nreader = cdms2.open('${sourceFile}')`;
    cmd += `\n${GET_AXIS_INFO}\nreader.close()\n`;

    this.usingKernel = true;
    // Get the variables info
    let result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      cmd
    );
    this.usingKernel = false;

    // Parse the resulting output as file specific axes
    let axesInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Update axes info for each variable in the group
    varGroup.forEach((variable: Variable) => {
      variable.axisList.map((item: any) => {
        axesInfo[item].min = axesInfo[item].data[0];
        axesInfo[item].max =
          axesInfo[item].data[axesInfo[item].data.length - 1];
        variable.axisInfo.push(axesInfo[item]);
      });
    });
  }

  /**
   * Opens a '.nc' file to read in it's variables via a kernel request.
   * @param filePath The file to open for variable reading
   * @returns Promise<Array<Variable>> -- A promise contianing an array of variables
   * that were found in the file.
   */
  async getFileVariables(filePath: string): Promise<Array<Variable>> {
    if (filePath == "") {
      return new Array<Variable>();
    }
    try {
      this.usingKernel = true;

      let result: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        `import json\nimport cdms2\nreader = cdms2.open('${filePath}')\n${GET_FILE_VARIABLES}`
      );
      this.usingKernel = false;

      // Get file variables
      /*let result: string;
    try {
      this.usingKernel = true;
      result = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        GET_FILE_VARIABLES
      );
      this.usingKernel = false;
    } catch (error) {
      console.log(error);
      return new Array<Variable>();
    }*/

      // Parse the resulting output into an object
      let variableAxes: any = JSON.parse(result.slice(1, result.length - 1));
      let newVars = new Array<Variable>();
      Object.keys(variableAxes.vars).map((item: string) => {
        let v = new Variable();
        v.name = item;
        v.pythonID = variableAxes.vars[item].pythonID;
        v.longName = variableAxes.vars[item].name;
        v.axisList = variableAxes.vars[item].axisList;
        v.axisInfo = new Array<AxisInfo>();
        variableAxes.vars[item].axisList.map((item: any) => {
          variableAxes.axes[item].min = variableAxes.axes[item].data[0];
          variableAxes.axes[item].max =
            variableAxes.axes[item].data[
              variableAxes.axes[item].data.length - 1
            ];
          v.axisInfo.push(variableAxes.axes[item]);
        });
        v.units = variableAxes.vars[item].units;
        v.sourceName = this.getDataReaderName(filePath);
        newVars.push(v);
      });
      return newVars;
    } catch (error) {
      console.log(error);
      return new Array<Variable>();
    }
  }

  // Checks if the

  // Updates the ids stored in the dataList, for when data files are first opened.
  /*async updateDataList(): Promise<void> {
    // Updates the dataList elements so they hold the latest id
    let cmd: string = "output = [";
    Object.keys(this.dataVarList).forEach(varName => {
      cmd += `{'id': id(${varName}), 'name':'${varName}'},`;
    });
    cmd += "]";
    let result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      cmd
    );
    let newIDs: [{ id: number; name: string }] = eval(result);
    newIDs.forEach((val: { id: number; name: string }) => {
      this.dataVarList[val.name].id = val.id;
    });
  }*/

  /**
   * Will update the state of the widget's current notebook panel.
   * This serves other functions that base their action on the notebook's current state
   */
  async updateNotebookState(): Promise<void> {
    try {
      // Check whether there is a notebook opened
      if (this.notebookTracker.size > 0) {
        // Check if notebook is active widget
        if (this.notebookPanel instanceof NotebookPanel) {
          // Ensure notebook session is ready before checking for metadata
          await this._notebookPanel.session.ready;
          // Check if there is a kernel listed as vcsReady
          if (
            this._readyKernels.length > 0 &&
            this._readyKernels.indexOf(this.notebookPanel.session.kernel.id) >=
              0
          ) {
            // Ready kernel identified, so the notebook is ready for injection
            this.state = NOTEBOOK_STATE.VCS_Ready;
          } else {
            // Search for a cell containing the imports key
            let find: number = CellUtilities.findCellWithMetaKey(
              this.notebookPanel.content,
              IMPORT_CELL_KEY
            )[0];
            // Search for a cell containing the data variables key
            find += CellUtilities.findCellWithMetaKey(
              this.notebookPanel.content,
              READER_CELL_KEY
            )[0];
            // Search for a cell containing the canvas variables key
            find += CellUtilities.findCellWithMetaKey(
              this.notebookPanel.content,
              CANVAS_CELL_KEY
            )[0];

            if (find >= 3) {
              // The imports, data and canvas cells were found, but not run yet
              this.state = NOTEBOOK_STATE.InitialCellsReady;
            } else {
              // No import cell was found, but the notebook is active
              this.state = NOTEBOOK_STATE.ActiveNotebook;
            }
          }
        } else {
          // No notebook is currently open
          this.state = NOTEBOOK_STATE.InactiveNotebook;
        }
      } else {
        // No notebook is open (tracker was empty)
        this.state = NOTEBOOK_STATE.NoOpenNotebook;
      }
    } catch (error) {
      this.state = NOTEBOOK_STATE.Unknown;
    }
  }

  /**
   * This will construct an import string for the notebook based on the modules passed to it.
   * @param modules An array of strings representing the modules to include in the import command.
   * @param lazy Whether to use lazy imports syntax when making the command. Will include lazy_imports
   * if it is needed.
   */
  buildImportCommand(modules: string[], lazy: boolean): string {
    let cmd: string = "";
    //Check for lazy_imports modules first
    let tmpModules = modules;
    let idx = modules.indexOf("lazy_import");

    if (lazy) {
      // Import lazy_imports if it's missing, before doing other imports
      if (idx >= 0) {
        tmpModules.splice(idx, 1);
        cmd = "import lazy_import";
      }
      // Import other modules using lazy import syntax
      tmpModules.forEach(module => {
        cmd += `\n${module} = lazy_import.lazy_module("${module}")`;
      });
    } else {
      // Remove lazy_imports from required modules if it is there
      if (idx >= 0) {
        tmpModules.splice(idx, 1);
      }
      // Import modules
      tmpModules.forEach(module => {
        cmd += `\nimport ${module}`;
      });
    }
    return cmd;
  }

  /**
   * This will inject the required modules into the current notebook (if a module was not already imported)
   * @param index The index of where the imports cell should be. Default is -1, which will insert at the top.
   * @param skip Default false. If set to true, a check of the kernel will be made to see if the modules are already
   * imported and any that are will be skipped (not added) in the import statements of the required code.
   * @returns The index of where the cell was inserted
   */
  async injectImportsCode(
    index: number = -1,
    skip: boolean = false
  ): Promise<number> {
    // Check if required modules are imported in notebook
    try {
      let cmd =
        "#These imports are required for vcdat. To avoid issues, do not delete or modify.\n";

      if (skip) {
        // Check if necessary modules are loaded
        this.usingKernel = true;
        let output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          CHECK_MODULES_CMD
        );
        this.usingKernel = false;

        // Create import string based on missing dependencies
        let missingModules: string[] = eval(output);
        cmd += this.buildImportCommand(missingModules, true);
      } else {
        cmd += this.buildImportCommand(eval(`[${REQUIRED_MODULES}]`), true);
      }

      // Find the index where the imports code is injected
      let idx: number = CellUtilities.findCellWithMetaKey(
        this.notebookPanel.content,
        IMPORT_CELL_KEY
      )[0];

      console.log(`Index of import: ${idx}`);

      if (idx < 0) {
        // Inject imports in a new cell and run
        let result: [number, string] = await CellUtilities.insertRunShow(
          this.notebookPanel,
          this.commands,
          index,
          cmd,
          true
        );
        idx = result[0];
      } else {
        // Inject code into existing imports cell and run
        CellUtilities.injectCodeAtIndex(this.notebookPanel.content, idx, cmd);
        await CellUtilities.runCellAtIndex(
          this.commands,
          this.notebookPanel,
          idx
        );
      }

      // Update kernel list to identify this kernel is ready
      this._readyKernels.push(this.notebookPanel.session.kernel.id);

      // Save the notebook to preserve the cell metadata, update state
      this.state = NOTEBOOK_STATE.VCS_Ready;

      // Set cell meta data to identify it as containing imports
      await CellUtilities.setCellMetaData(
        this.notebookPanel,
        idx,
        IMPORT_CELL_KEY,
        "saved",
        true
      );

      return idx;
    } catch (error) {
      if (error.status == "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message != null) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when importing dependencies."
        );
      }
    }
  }

  /**
   * Gets the name for a data reader object to read data from a file. Creates a new name if one doesn't exist.
   * @param filePath The file path of the new file added
   */
  getDataReaderName(filePath: string): string {
    let dataName: string = "";

    // Check whether that file path is already open, return the data name if so
    let found: boolean = Object.keys(this.dataReaderList).some(
      (dataVar: string) => {
        dataName = dataVar;
        return this.dataReaderList[dataVar] == filePath;
      }
    );
    if (found) {
      return dataName;
    }

    // Filepath hasn't been added before, create the name for data variable based on file path
    dataName = filePath
      .substring(0, filePath.length - 3)
      .replace(/.*\/.*\//, "") // Remove path characters
      .replace(/^[0-9]*|[^a-z0-9]/gi, ""); // Remove non-alphanumeric characters
    dataName += "_data";

    // If the name already exist but the path is different, add a count to the end until it's unique
    let count: number = 1;
    while (Object.keys(this.dataReaderList).indexOf(dataName) >= 0) {
      dataName = `${dataName}${count}`;
      console.log(this.dataReaderList);
      count++;
    }

    return dataName;
  }

  /**
   * This will load data from a file so it can be used by vcdat
   * @param filePath The filepath of the new file to open
   * @param index The index to use for the cell containing the data variables
   */
  async injectDataReaders(filePath: string, index: number): Promise<number> {
    try {
      // If the data file doesn't have correct extension, exit
      if (!EXTENSIONS_REGEX.test(filePath)) {
        throw new Error("The file has the wrong extension type.");
      }

      // Find the index where the file data code is injected
      let idx: number = CellUtilities.findCellWithMetaKey(
        this.notebookPanel.content,
        READER_CELL_KEY
      )[0];

      console.log(`Index of readers: ${idx}`);

      // Get number of existing data files to open
      let dataVarNames: string[] = Object.keys(this.dataReaderList);

      // Build command that opens any existing data file(s)
      let cmd: string = `#Open the file${
        dataVarNames.length > 0 ? "s" : ""
      } for reading\n`;
      dataVarNames.forEach(existingDataName => {
        if (this.dataReaderList[existingDataName] == filePath) {
          console.log("Meta data not saved, injection wasn't performed");
          // Exit early if the filepath has already been opened
          if (idx < 0) {
            return index;
          }
          return idx;
        }
        cmd += `${existingDataName} = cdms2.open('${
          this.dataReaderList[existingDataName]
        }')\n`;
      });

      // Add a new file
      let newName: string = this.getDataReaderName(filePath);
      cmd += `${newName} = cdms2.open('${filePath}')`;

      // Update data reader list
      this.dataReaderList[newName] = filePath;

      if (idx < 0) {
        // Insert a new cell with given command and run
        let result: [number, string] = await CellUtilities.insertRunShow(
          this.notebookPanel,
          this.commands,
          index,
          cmd,
          true
        );
        idx = result[0];
        console.log("New reader cell inserted.");
      } else {
        // Inject code into existing data variables cell and run
        CellUtilities.injectCodeAtIndex(this.notebookPanel.content, idx, cmd);
        await CellUtilities.runCellAtIndex(
          this.commands,
          this.notebookPanel,
          idx
        );
        console.log("Current code replaced.");
      }

      // Set cell meta data to identify it as containing data variables
      await CellUtilities.setCellMetaData(
        this.notebookPanel,
        idx,
        READER_CELL_KEY,
        "saved",
        true
      );
      console.log("Reader meta data saved");

      return idx;
    } catch (error) {
      showErrorMessage(
        "Error",
        "An error occured when opening the data files."
      );
      console.log(error);
    }
  }

  /**
   * Looks for a cell containing the canvas declarations and updates its code
   * to contain the specified number of canvases.
   * If no cell containing canvas code is found a whole new one is inserted.
   * @param title The base title to use for the sidecars of this notebook
   * @param index The index of the cell to replace or insert the canvas code
   * @param canvasCount The number of canvases that the canvas cell should contain
   */
  async injectCanvasCode(
    title: string,
    index: number,
    canvasCount: number
  ): Promise<number> {
    try {
      // Build command that creates canvas(es)
      /*let cmd: string = `#Create ${
        this.canvasCount > 0
          ? "canvases and their associated sidecar"
          : "canvas and a sidecar"
      }`;
      for (let i: number = 0; i < canvasCount; i++) {
        cmd += `\nsidecar${i + 1} = sidecar.Sidecar(title='${title}_${i + 1}')\
        \ncanvas${i + 1} = vcs.init(display_target=sidecar${i + 1})`;
      }*/
      let cmd: string = `#Create canvas and sidecar\nsidecar = sidecar.Sidecar(title='${title}')\
      \ncanvas = vcs.init(display_target=sidecar)`;

      // Find the index where the canvas code is injected
      let idx: number = CellUtilities.findCellWithMetaKey(
        this.notebookPanel.content,
        CANVAS_CELL_KEY
      )[0];

      console.log(`Index of canvases: ${idx}`);

      if (idx < 0) {
        // Inject the code for starting the canvases
        let result: [number, string] = await CellUtilities.insertRunShow(
          this.notebookPanel,
          this.commands,
          index,
          cmd,
          true
        );
        idx = result[0];
        console.log("New cell inserted.");
      } else {
        // Replace code in canvas cell and run
        CellUtilities.injectCodeAtIndex(this.notebookPanel.content, idx, cmd);
        await CellUtilities.runCellAtIndex(
          this.commands,
          this.notebookPanel,
          idx
        );
        console.log("Current code replaced.");
      }

      // Set cell meta data to identify it as containing canvases
      await CellUtilities.setCellMetaData(
        this.notebookPanel,
        idx,
        CANVAS_CELL_KEY,
        "saved",
        true
      );

      // Update the current canvas count
      this.canvasCount = canvasCount;

      return idx;
    } catch (error) {
      showErrorMessage("Error", error);
    }
  }

  /**
   * Prepares the current widget notebook to be a vcsReady notebook. Will create a new one if none exists.
   * @param currentFile The file path to set for the variable loading. If left blank, an error will occur.
   */
  async prepareNotebookPanel(currentFile: string): Promise<void> {
    try {
      if (currentFile == "") {
        this.state = NOTEBOOK_STATE.Unknown;
        // Reject initilization if no file has been selected
        throw new Error("No file has been set for obtaining variables.");
      }

      // If state isn't VCS_Ready, make it ready
      if (
        this.state != NOTEBOOK_STATE.VCS_Ready
      ) {
        let currentIdx: number = 0;
        // Inject the imports
        currentIdx = await this.injectImportsCode();
        console.log(`Imports injected inedx: ${currentIdx}`);

        // Inject the data file(s)
        currentIdx = await this.injectDataReaders(currentFile, currentIdx + 1);
        console.log(`Readers injected inedx: ${currentIdx}`);
        this.dataReaderList[this.getDataReaderName(currentFile)] = currentFile;

        // Inject canvas(es)
        let sidecarTitle: string = MiscUtilities.removeExtension(
          this.notebookPanel.title.label
        );
        currentIdx = await this.injectCanvasCode(
          sidecarTitle,
          currentIdx + 1,
          1
        );
        console.log(`Canvases injected inedx: ${currentIdx}`);
        this.notebookPanel.content.activeCellIndex = currentIdx + 1;
      } else {
        // Grab a notebook panel
        let newNotebookPanel = await this.getNotebookPanel();
        // Set as current notebook (if not already)
        await this.setNotebookPanel(newNotebookPanel);
      }

      // Check if the file has already been loaded
      let fileLoaded: boolean = Object.keys(this.dataReaderList).some(value => {
        return this.dataReaderList[value] == currentFile;
      });

      // Check if variable data is already loaded
      let result = NotebookUtilities.getMetaDataNow(
        this.notebookPanel,
        VARIABLES_LOADED_KEY
      );

      // If the file is already loaded, and variable data exists, just update variables
      if (fileLoaded && result) {
        this.VCSMenuRef.updateVariables(result);
      } else {
        // Set the current file and save the meta data
        await this.setCurrentFile(currentFile, true);

        if (!fileLoaded) {
          let idx: number = CellUtilities.findCellWithMetaKey(
            this.notebookPanel.content,
            READER_CELL_KEY
          )[0];
          console.log(`Injecting just reader: ${idx}`);
          await this.injectDataReaders(currentFile, idx);
          this.dataReaderList[
            this.getDataReaderName(currentFile)
          ] = currentFile;
        }

        let fileVars: Array<Variable> = await this.getFileVariables(
          currentFile
        );
        if (fileVars.length > 0) {
          await this.VCSMenuRef.launchVarSelect(fileVars);
        } else {
          this._currentFile = "";
        }
      }

      // Update the metadata
      await NotebookUtilities.setMetaData(
        this.notebookPanel,
        DATA_LIST_KEY,
        this.dataReaderList
      );

      // Save the notebook
      this.notebookPanel.context.save();

      // Activate current notebook
      this.application.shell.activateById(this.notebookPanel.id);

      // Connect the handler specific to current notebook
      this._notebookPanel.content.stateChanged.connect(this.handleStateChanged);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @returns Promise<NotebookPanel> - The widget's current notebookPanel or a new one if none exists.
   */
  async getNotebookPanel(): Promise<NotebookPanel> {
    let prom: Promise<NotebookPanel> = new Promise(async (resolve, reject) => {
      try {
        if (this.notebookPanel) {
          resolve(this.notebookPanel);
        } else {
          // Create new notebook if one doesn't exist
          resolve(NotebookUtilities.createNewNotebook(this.commands));
        }
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }
}

// An error boundary to catch errors without killing the UI
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any): void {
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  render() {
    return this.props.children;
  }
}

export class NCViewerWidget extends Widget {
  constructor(context: DocumentRegistry.Context) {
    super();
    this.context = context;
  }
  readonly context: DocumentRegistry.Context;
  readonly ready = Promise.resolve(void 0);
}

export default {
  NotebookState: NOTEBOOK_STATE,
  LeftSideBarWidget,
  NCViewerWidget
};
