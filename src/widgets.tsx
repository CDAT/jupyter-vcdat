// Dependencies
import { JupyterLab } from "@jupyterlab/application";
import { IChangedArgs } from "@jupyterlab/coreutils";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { Notebook, NotebookPanel, NotebookTracker } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { Widget } from "@phosphor/widgets";
import * as React from "react";
import * as ReactDOM from "react-dom";

// Project Components
import { CellUtilities } from "./CellUtilities";
import AxisInfo from "./components/AxisInfo";
import Variable from "./components/Variable";
import { VCSMenu } from "./components/VCSMenu";
import {
  BASE_GRAPHICS,
  BASE_TEMPLATES,
  CANVAS_CELL_KEY,
  CHECK_MODULES_CMD,
  DATA_LIST_KEY,
  EXTENSIONS_REGEX,
  FILE_PATH_KEY,
  GET_AXIS_INFO,
  GET_FILE_VARIABLES,
  IMPORT_CELL_KEY,
  NOTEBOOK_STATE,
  READER_CELL_KEY,
  REFRESH_GRAPHICS_CMD,
  REFRESH_TEMPLATES_CMD,
  REFRESH_VAR_INFO,
  REQUIRED_MODULES,
  VARIABLE_SOURCES_KEY,
  VARIABLES_LOADED_KEY
} from "./constants";
import { NotebookUtilities } from "./NotebookUtilities";
import { MiscUtilities } from "./Utilities";

/**
 * This is the main component for the vcdat extension.
 */
export class LeftSideBarWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public commands: CommandRegistry; // Jupyter app CommandRegistry
  public notebookTracker: NotebookTracker; // This is to track current notebooks
  public application: JupyterLab; // The JupyterLab application object
  public VCSMenuRef: VCSMenu; // the LeftSidebar component
  public variableList: Variable[]; // An array of variable objects
  public dataReaderList: { [dataName: string]: string }; // A dictionary containing data variable names and associated file path
  public graphicsMethods: any; // The current available graphics methods
  public templatesList: string[]; // The list of current templates
  public usingKernel: boolean; // The widgets is running a ker nel command
  public canvasCount: number; // The number of canvases currently in use (just 1 for now)

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
          updateVariables={(variables: Variable[]) => {
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

  // =======GETTERS AND SETTERS=======
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

  // =======ASYNC SETTER FUNCTIONS=======

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  public async setNotebookPanel(notebookPanel: NotebookPanel): Promise<void> {
    try {
      await this.VCSMenuRef.setState({
        notebookPanel
      });

      // Exit early if no change needed
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
        const lastFileOpened: string | null = await NotebookUtilities.getMetaData(
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
          await this.VCSMenuRef.updateVariables(result);
        } else {
          await this.VCSMenuRef.updateVariables(new Array<Variable>());
        }

        // Update the variable sources in the VCSMenu widget from meta data
        result = NotebookUtilities.getMetaDataNow(
          this.notebookPanel,
          VARIABLE_SOURCES_KEY
        );
        if (result) {
          // Update the variables list
          await this.VCSMenuRef.setState({ variableSources: result });
        } else {
          // Update the variables list
          await this.VCSMenuRef.setState({ variableSources: {} });
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
          const importsCell = CellUtilities.findCellWithMetaKey(
            this.notebookPanel,
            IMPORT_CELL_KEY
          );
          // Get cell containing the data key
          const dataCell = CellUtilities.findCellWithMetaKey(
            this.notebookPanel,
            READER_CELL_KEY
          );
          // Get cell containing the canvas key
          const canvasCell = CellUtilities.findCellWithMetaKey(
            this.notebookPanel,
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
  public async setCurrentFile(filePath: string, save: boolean): Promise<void> {
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

  // =======WIDGET SIGNAL HANDLERS=======

  /**
   * This handles when a notebook is switched to another notebook.
   * The parameters are automatically passed from the signal when a switch occurs.
   */
  public async handleNotebooksChanged(
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
  public async handleStateChanged(
    notebook: Notebook,
    stateChange: IChangedArgs<any>
  ): Promise<void> {
    // Perform actions when the notebook state has a command run and the notebook is vcs ready
    console.log("State changed more frequently");
    if (
      this.state == NOTEBOOK_STATE.VCS_Ready &&
      stateChange.newValue == "command"
    ) {
      console.log("State changed");
      this.refreshVarList();
      this.refreshGraphicsList();
      await this.refreshTemplatesList();
      this.plotExists = await this.checkPlotExists();
    }
  }

  // =======WIDGET COMPONENT METHODS (FOR PROPS)=======

  /**
   * Injects code into the bottom cell of the notebook, doesn't display results (output or error)
   * @param code A string that has the code to inject into the notebook cell.
   * @returns Promise<[number, string]> - A promise for when the cell code has executed containing
   * the cell's index and output result
   */
  public async inject(code: string): Promise<[number, string]> {
    try {
      const result = await CellUtilities.insertRunShow(
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
  public async injectAndDisplay(code: string): Promise<any> {
    try {
      const result: any = await CellUtilities.insertRunShow(
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

  // =======WIDGET MAIN FUNCTIONS=======

  /**
   * This initializes the left side bar widget and checks for any open notebooks.
   * The status of the notebook is set and the notebook switching handler is connected.
   */
  public async initialize(): Promise<void> {
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

  public async checkPlotExists(): Promise<boolean> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready) {
        // Get the list of display elements in the canvas
        this.usingKernel = true;
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          "output = canvas.listelements('display')"
        );
        this.usingKernel = false;
        return eval(output).length > 1;
      } 
        return false;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * This updates the current graphics methods list by sending a command to the kernel directly.
   */
  public async refreshGraphicsList(): Promise<void> {
    if (this.state == NOTEBOOK_STATE.VCS_Ready) {
      // Refresh the graphic methods
      this.usingKernel = true;
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        REFRESH_GRAPHICS_CMD
      );
      this.usingKernel = false;

      // Update the list of latest variables and data
      this.graphicsMethods = JSON.parse(output.slice(1, output.length - 1));
    } else {
      this.graphicsMethods = BASE_GRAPHICS;
    }
  }

  /**
   * This updates the current templates methods list by sending a command to the kernel directly.
   */
  public async refreshTemplatesList(): Promise<void> {
    try {
      if (this.state == NOTEBOOK_STATE.VCS_Ready) {
        // Refresh the graphic methods
        this.usingKernel = true;
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          REFRESH_TEMPLATES_CMD
        );
        // Update the list of latest variables and data
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
  public async refreshVarList(): Promise<void> {
    // Don't refresh if not VCS_Ready
    if (this.state != NOTEBOOK_STATE.VCS_Ready) {
      this.VCSMenuRef.updateVariables(new Array<Variable>());
      return;
    }

    this.usingKernel = true;
    // Get the variables info
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      REFRESH_VAR_INFO
    );
    this.usingKernel = false;
    // A grouping object so that variables from each data source are updated
    const varGroups: { [sourceName: string]: Variable[] } = {};
    // Parse the resulting output into a list of variables with basic data
    const variableInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Exit early if no variables exist
    if (Object.keys(variableInfo).length < 1) {
      this.VCSMenuRef.updateVariables(new Array<Variable>());
      return;
    }

    const newVars = new Array<Variable>();
    let sourceName: string;
    Object.keys(variableInfo).map(async (item: string) => {
      const v: Variable = new Variable();
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
  public async updateAxesInfo(varGroup: Variable[]): Promise<void> {
    // Get the filepath from the data readerlist
    const sourceFile: string = this.dataReaderList[varGroup[0].sourceName];

    // Exit early if no source filepath exists
    if (sourceFile == undefined) {
      return;
    }

    let cmd: string = `import cdms2\nimport json\nreader = cdms2.open('${sourceFile}')`;
    cmd += `\n${GET_AXIS_INFO}\nreader.close()\n`;

    this.usingKernel = true;
    // Get the variables info
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      cmd
    );
    this.usingKernel = false;

    // Parse the resulting output as file specific axes
    const axesInfo: any = JSON.parse(result.slice(1, result.length - 1));

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
  public async getFileVariables(filePath: string): Promise<Variable[]> {
    if (filePath == "") {
      return new Array<Variable>();
    }
    try {
      this.usingKernel = true;

      const result: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        `import json\nimport cdms2\nreader = cdms2.open('${filePath}')\n${GET_FILE_VARIABLES}`
      );
      this.usingKernel = false;

      // Parse the resulting output into an object
      const variableAxes: any = JSON.parse(result.slice(1, result.length - 1));
      const newVars = new Array<Variable>();
      Object.keys(variableAxes.vars).map((item: string) => {
        const v = new Variable();
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

  /**
   * Will update the state of the widget's current notebook panel.
   * This serves other functions that base their action on the notebook's current state
   */
  public async updateNotebookState(): Promise<void> {
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
              this.notebookPanel,
              IMPORT_CELL_KEY
            )[0];
            // Search for a cell containing the data variables key
            find += CellUtilities.findCellWithMetaKey(
              this.notebookPanel,
              READER_CELL_KEY
            )[0];
            // Search for a cell containing the canvas variables key
            find += CellUtilities.findCellWithMetaKey(
              this.notebookPanel,
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
  public buildImportCommand(modules: string[], lazy: boolean): string {
    let cmd: string = "";
    // Check for lazy_imports modules first
    const tmpModules = modules;
    const idx = modules.indexOf("lazy_import");

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
  public async injectImportsCode(
    index: number = -1,
    skip: boolean = false
  ): Promise<number> {
    // Check if required modules are imported in notebook
    let cmd =
      "#These imports are required for vcdat. To avoid issues, do not delete or modify.\n";

    if (skip) {
      // Check if necessary modules are loaded
      this.usingKernel = true;
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        CHECK_MODULES_CMD
      );
      this.usingKernel = false;

      // Create import string based on missing dependencies
      const missingModules: string[] = eval(output);
      cmd += this.buildImportCommand(missingModules, true);
    } else {
      cmd += this.buildImportCommand(eval(`[${REQUIRED_MODULES}]`), true);
    }

    // Find the index where the imports code is injected
    let idx: number = CellUtilities.findCellWithMetaKey(
      this.notebookPanel,
      IMPORT_CELL_KEY
    )[0];

    console.log(`Index of import: ${idx}`);

    if (idx < 0) {
      // Inject imports in a new cell and run
      const result: [number, string] = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        index,
        cmd,
        true
      );
      idx = result[0];
      console.log("Added new import cell");
    } else {
      // Inject code into existing imports cell and run
      CellUtilities.injectCodeAtIndex(this.notebookPanel.content, idx, cmd);
      await CellUtilities.runCellAtIndex(
        this.commands,
        this.notebookPanel,
        idx
      );
      console.log("Updated import cell");
    }

    // Set cell meta data to identify it as containing imports
    await CellUtilities.setCellMetaData(
      this.notebookPanel,
      idx,
      IMPORT_CELL_KEY,
      "saved",
      true
    );

    return idx;
  }

  /**
   * Gets the name for a data reader object to read data from a file. Creates a new name if one doesn't exist.
   * @param filePath The file path of the new file added
   */
  public getDataReaderName(filePath: string): string {
    // Check whether that file path is already open, return the data name if so
    let dataName: string = "";
    const found: boolean = Object.keys(this.dataReaderList).some(
      (dataVar: string) => {
        dataName = dataVar;
        return this.dataReaderList[dataVar] == filePath;
      }
    );
    if (found) {
      return dataName;
    }

    // Filepath hasn't been added before, create the name for data variable based on file path
    dataName = MiscUtilities.createVariableName(filePath) + "_data";

    // If the reader name already exist but the path is different (like for two files with
    // similar names but different paths) add a count to the end until it's unique
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
  public async injectDataReaders(filePath: string, index: number): Promise<number> {
    // If the data file doesn't have correct extension, exit
    if (filePath == "") {
      throw new Error("The file path was empty.");
    }

    // If the data file doesn't have correct extension, exit
    if (!EXTENSIONS_REGEX.test(filePath)) {
      throw new Error("The file has the wrong extension type.");
    }

    // Find the index where the file data code is injected
    let idx: number = CellUtilities.findCellWithMetaKey(
      this.notebookPanel,
      READER_CELL_KEY
    )[0];

    console.log(`Index of readers: ${idx}`);

    // Get list of data files to open
    const dataVarNames: string[] = Object.keys(this.dataReaderList);

    // Build command that opens any existing data file(s)
    let cmd: string = `#Open the file${
      dataVarNames.length > 0 ? "s" : ""
    } for reading\n`;

    if (dataVarNames.length > 0) {
      cmd = "#Open the files for reading\n";
      dataVarNames.forEach(existingDataName => {
        if (this.dataReaderList[existingDataName] == filePath) {
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
    } else {
      cmd = "#Open the file for reading\n";
    }

    // Add a new reader to command
    const newName: string = this.getDataReaderName(filePath);
    cmd += `${newName} = cdms2.open('${filePath}')`;

    // Update data reader list
    this.dataReaderList[newName] = filePath;

    if (idx < 0) {
      // Insert a new cell with given command and run
      const result: [number, string] = await CellUtilities.insertRunShow(
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
      console.log("Reader cell updated");
    }

    // Update or add the file path to the data readers list
    this.dataReaderList[this.getDataReaderName(filePath)] = filePath;

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
  }

  /**
   * Looks for a cell containing the canvas declarations and updates its code
   * to contain the specified number of canvases.
   * If no cell containing canvas code is found a whole new one is inserted.
   * @param title The base title to use for the sidecars of this notebook
   * @param index The index of the cell to replace or insert the canvas code
   * @param canvasCount The number of canvases that the canvas cell should contain
   */
  public async injectCanvasCode(
    // title: string,
    index: number,
    canvasCount: number
  ): Promise<number> {
    // Build command that creates canvas(es)
    /*let cmd: string = `#Create ${
      this.canvasCount > 0
        ? "canvases and their associated sidecar"
        : "canvas and a sidecar"
    }`;
    for (let i: number = 0; i < canvasCount; i++) {
      cmd += `\nsc${i + 1} = sidecar.Sidecar(title='${title}_${i + 1}')\
      \ncanvas${i + 1} = vcs.init(display_target=sidecar${i + 1})`;
    }*/
    const cmd: string = `#Create canvas and sidecar\ncanvas = vcs.init()`;

    // Find the index where the canvas code is injected
    let idx: number = CellUtilities.findCellWithMetaKey(
      this.notebookPanel,
      CANVAS_CELL_KEY
    )[0];

    console.log(`Index of canvases: ${idx}`);

    if (idx < 0) {
      // Inject the code for starting the canvases
      const result: [number, string] = await CellUtilities.insertRunShow(
        this.notebookPanel,
        this.commands,
        index,
        cmd,
        true
      );
      idx = result[0];
      console.log("New canvas cell inserted.");
    } else {
      // Replace code in canvas cell and run
      CellUtilities.injectCodeAtIndex(this.notebookPanel.content, idx, cmd);
      await CellUtilities.runCellAtIndex(
        this.commands,
        this.notebookPanel,
        idx
      );
      console.log("Canvas cell updated.");
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
  }

  /**
   * Prepares the current widget notebook to be a vcsReady notebook. Will create a new one if none exists.
   * @param currentFile The file path to set for the variable loading. If left blank, an error will occur.
   */
  public async prepareNotebookPanel(currentFile: string): Promise<void> {
    if (currentFile == "") {
      this.state = NOTEBOOK_STATE.Unknown;
      // Reject initilization if no file has been selected
      throw new Error("No file has been set for obtaining variables.");
    }

    // Set the current file and save the meta data
    await this.setCurrentFile(currentFile, true);

    // Grab a notebook panel
    const newNotebookPanel = await this.getNotebookPanel();

    // Set as current notebook (if not already)
    await this.setNotebookPanel(newNotebookPanel);

    // Inject the imports
    let currentIdx: number = 0;
    currentIdx = await this.injectImportsCode();
    console.log("Imports injected");

    // Inject the data file(s)
    currentIdx = await this.injectDataReaders(currentFile, currentIdx + 1);
    console.log("Readers injected");

    // Inject canvas(es)
    /*let sidecarTitle: string = MiscUtilities.removeExtension(
      this.notebookPanel.title.label
    );*/
    currentIdx = await this.injectCanvasCode(currentIdx + 1, 1);
    console.log("Canvases injected");

    // Select last cell in notebook
    this.notebookPanel.content.activeCellIndex =
      this.notebookPanel.content.model.cells.length - 1;

    // Update kernel list to identify this kernel is ready
    this._readyKernels.push(this.notebookPanel.session.kernel.id);

    // Save the notebook to preserve the cell metadata, update state
    this.state = NOTEBOOK_STATE.VCS_Ready;

    // Check if the file has already been loaded
    const fileLoaded: boolean = Object.keys(this.dataReaderList).some(value => {
      return this.dataReaderList[value] == currentFile;
    });

    // If file hasn't been loaded, inject it
    if (!fileLoaded) {
      const idx: number = CellUtilities.findCellWithMetaKey(
        this.notebookPanel,
        READER_CELL_KEY
      )[0];
      console.log(`Injecting just reader: ${idx}`);
      await this.injectDataReaders(currentFile, idx);
    }

    // Launch file variable loader if file has variables
    const fileVars: Variable[] = await this.getFileVariables(currentFile);
    if (fileVars.length > 0) {
      await this.VCSMenuRef.launchVarSelect(fileVars);
    } else {
      this._currentFile = "";
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
  }

  /**
   * @returns Promise<NotebookPanel> - The widget's current notebookPanel or a new one if none exists.
   */
  public async getNotebookPanel(): Promise<NotebookPanel> {
    const prom: Promise<NotebookPanel> = new Promise(async (resolve, reject) => {
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

  public static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  public componentDidCatch(error: any, info: any): void {
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  public render() {
    return this.props.children;
  }
}

export class NCViewerWidget extends Widget {
  public readonly context: DocumentRegistry.Context;
  public readonly ready = Promise.resolve(void 0);
  constructor(context: DocumentRegistry.Context) {
    super();
    this.context = context;
  }
}

export default {
  NotebookState: NOTEBOOK_STATE,
  LeftSideBarWidget,
  NCViewerWidget
};
