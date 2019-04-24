// Dependencies
import { JupyterLab } from "@jupyterlab/application";
import { IChangedArgs } from "@jupyterlab/coreutils";
import { Notebook, NotebookPanel, NotebookTracker } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { Widget } from "@phosphor/widgets";
import * as React from "react";
import * as ReactDOM from "react-dom";

// Project Components
import { CellUtilities } from "./CellUtilities";
import { CodeInjector } from "./CodeInjector";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AxisInfo } from "./components/AxisInfo";
import { Variable } from "./components/Variable";
import { VCSMenu } from "./components/VCSMenu";
import {
  BASE_GRAPHICS,
  BASE_TEMPLATES,
  CANVAS_CELL_KEY,
  CHECK_VCS_CMD,
  DATA_LIST_KEY,
  FILE_PATH_KEY,
  GET_AXIS_INFO_CMD,
  GET_VARIABLES_CMD,
  IMPORT_CELL_KEY,
  NOTEBOOK_STATE,
  OUTPUT_RESULT_NAME,
  READER_CELL_KEY,
  REFRESH_GRAPHICS_CMD,
  REFRESH_TEMPLATES_CMD,
  REFRESH_VAR_CMD,
  VARIABLE_SOURCES_KEY,
  VARIABLES_LOADED_KEY
} from "./constants";
import { NotebookUtilities } from "./NotebookUtilities";
import { Utilities } from "./Utilities";

/**
 * This is the main component for the vcdat extension.
 */
export class LeftSideBarWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public commands: CommandRegistry; // Jupyter app CommandRegistry
  public notebookTracker: NotebookTracker; // This is to track current notebooks
  public application: JupyterLab; // The JupyterLab application object
  public vcsMenuRef: VCSMenu; // the LeftSidebar component
  public variableList: Variable[]; // An array of variable objects
  public graphicsMethods: any; // The current available graphics methods
  public templatesList: string[]; // The list of current templates
  public usingKernel: boolean; // The widgets is running a ker nel command
  public canvasCount: number; // The number of canvases currently in use (just 1 for now)
  public refreshExt: boolean; // Will be false if the app was refreshed
  public codeInjector: CodeInjector; // The code injector object which is responsible for injecting code into notebooks

  private pltExists: boolean; // True if there exists a plot that can be exported, false if not.
  private kernels: string[]; // A list containing kernel id's indicating the kernel is vcs_ready
  private lastFile: string; // The current filepath of the data file being used for variables and data
  private nbPanel: NotebookPanel; // The notebook this widget is interacting with
  private nbState: NOTEBOOK_STATE; // Keeps track of the current state of the notebook in the sidebar widget
  private preparing: boolean; // Whether the notebook is currently being prepared

  constructor(app: JupyterLab, tracker: NotebookTracker) {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.application = app;
    this.commands = app.commands;
    this.codeInjector = new CodeInjector(app.commands);
    this.notebookTracker = tracker;
    this.nbState = NOTEBOOK_STATE.Unknown;
    this.usingKernel = false;
    this.refreshExt = true;
    this.canvasCount = 0;
    this.lastFile = "";
    this.nbPanel = null;
    this.variableList = Array<Variable>();
    this.graphicsMethods = BASE_GRAPHICS;
    this.templatesList = BASE_TEMPLATES;
    this.kernels = [];
    this.pltExists = false;
    this.initialize = this.initialize.bind(this);
    this.refreshVarList = this.refreshVarList.bind(this);
    this.setCurrentFile = this.setCurrentFile.bind(this);
    this.setNotebookPanel = this.setNotebookPanel.bind(this);
    this.updateNotebookState = this.updateNotebookState.bind(this);
    this.handleStateChanged = this.handleStateChanged.bind(this);
    this.refreshGraphicsList = this.refreshGraphicsList.bind(this);
    this.getFileVariables = this.getFileVariables.bind(this);
    this.handleNotebooksChanged = this.handleNotebooksChanged.bind(this);
    this.checkVCS = this.checkVCS.bind(this);
    this.checkPlotExists = this.checkPlotExists.bind(this);
    this.getNotebookPanel = this.getNotebookPanel.bind(this);
    this.prepareNotebookPanel = this.prepareNotebookPanel.bind(this);
    this.recognizeNotebookPanel = this.recognizeNotebookPanel.bind(this);
    this.vcsMenuRef = (React as any).createRef();
    ReactDOM.render(
      <ErrorBoundary>
        <VCSMenu
          ref={loader => (this.vcsMenuRef = loader)}
          commands={this.commands}
          codeInjector={this.codeInjector}
          plotReady={this.state === NOTEBOOK_STATE.VCS_Ready}
          plotExists={this.plotExists}
          plotExistTrue={this.plotExistTrue}
          syncNotebook={this.syncNotebook}
          getFileVariables={this.getFileVariables}
          getGraphicsList={this.getGraphics}
          getTemplatesList={this.getTemplates}
          updateVariables={(variables: Variable[]) => {
            this.variableList = variables;
          }}
          refreshGraphicsList={this.refreshGraphicsList}
          notebookPanel={this.nbPanel}
          updateNotebookPanel={this.recognizeNotebookPanel}
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

  // =======PROPS FUNCTIONS=======
  public plotExistTrue = () => {
    this.plotExists = true;
  };

  public syncNotebook = () => {
    return (
      !this.preparing &&
      (this.state === NOTEBOOK_STATE.ActiveNotebook ||
        this.state === NOTEBOOK_STATE.InitialCellsReady)
    );
  };

  public getGraphics = () => {
    return this.graphicsMethods;
  };

  public getTemplates = () => {
    return this.templatesList;
  };

  // =======GETTERS AND SETTERS=======
  public get state(): NOTEBOOK_STATE {
    return this.nbState;
  }

  public set state(notebookState: NOTEBOOK_STATE) {
    this.nbState = notebookState;

    if (notebookState === NOTEBOOK_STATE.VCS_Ready) {
      this.vcsMenuRef.updatePlotReady(true);
    } else {
      this.vcsMenuRef.updatePlotReady(false);
    }
  }

  public get currentFile(): string {
    return this.lastFile;
  }

  public get notebookPanel(): NotebookPanel {
    return this.nbPanel;
  }

  public set plotExists(value: boolean) {
    this.pltExists = value;
    this.vcsMenuRef.setState({ plotExists: value });
  }

  public get plotExists(): boolean {
    return this.pltExists;
  }

  // =======ASYNC SETTER FUNCTIONS=======

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  public async setNotebookPanel(notebookPanel: NotebookPanel): Promise<void> {
    try {
      // Exit early if no change needed
      if (this.nbPanel === notebookPanel) {
        // Update current state
        await this.updateNotebookState();
        return;
      }

      // Disconnect handlers from previous notebook_panel (if exists)
      if (this.nbPanel) {
        this.nbPanel.content.stateChanged.disconnect(this.handleStateChanged);
      }

      // Update current notebook
      this.nbPanel = notebookPanel;

      await this.vcsMenuRef.setState({
        notebookPanel
      });

      // Update notebook state
      await this.updateNotebookState();

      // Update notebook in code injection manager
      this.codeInjector.notebookPanel = notebookPanel;

      // Reset the UI components
      await this.vcsMenuRef.resetState();

      // Reset notebook information
      this.codeInjector.dataReaderList = {};

      // Check if notebook is ready for vcs, and prepare it if so
      if (
        this.state === NOTEBOOK_STATE.VCS_Ready ||
        this.state === NOTEBOOK_STATE.InitialCellsReady
      ) {
        // Update current file
        const lastFileOpened:
          | string
          | null = await NotebookUtilities.getMetaData(
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
          await this.vcsMenuRef.updateVariables(result);
        } else {
          await this.vcsMenuRef.updateVariables(Array<Variable>());
        }

        // Update the variable sources in the VCSMenu widget from meta data
        result = NotebookUtilities.getMetaDataNow(
          this.notebookPanel,
          VARIABLE_SOURCES_KEY
        );
        if (result) {
          // Update the variables list
          await this.vcsMenuRef.setState({ variableSources: result });
        } else {
          // Update the variables list
          await this.vcsMenuRef.setState({ variableSources: {} });
        }

        // Update the list of data variables and associated filepath
        const readers: {
          [dataName: string]: string;
        } = NotebookUtilities.getMetaDataNow(this.notebookPanel, DATA_LIST_KEY);
        this.codeInjector.dataReaderList = readers ? readers : {};

        // Run cells to make notebook vcs ready
        if (this.state === NOTEBOOK_STATE.InitialCellsReady) {
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
          this.kernels.push(this.notebookPanel.session.kernel.id);
          // Update state
          this.state = NOTEBOOK_STATE.VCS_Ready;
        }

        // Update the selected graphics method, variable list, templates and loaded variables
        await this.refreshGraphicsList();
        await this.refreshTemplatesList();
        await this.refreshVarList();

        this.vcsMenuRef.getVariableSelections();
        this.vcsMenuRef.getGraphicsSelections();
        this.vcsMenuRef.getTemplateSelection();

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
      if (error.status === "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message) {
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
    this.lastFile = filePath;
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
    await this.setNotebookPanel(notebookPanel);
  }

  /**
   * This handles when the state of the notebook changes, like when a cell is modified, or run etc.
   * Using this handler, the variable list is refreshed whenever a cell's code is run in a vcs ready
   * notebook.
   */
  public async handleStateChanged(
    notebook: Notebook,
    stateChange: IChangedArgs<any>
  ): Promise<void> {
    // Perform actions when the notebook state has a command run and the notebook is vcs ready
    if (
      !this.codeInjector.isBusy &&
      this.state === NOTEBOOK_STATE.VCS_Ready &&
      stateChange.newValue !== "edit"
    ) {
      try {
        this.refreshVarList();
        this.refreshGraphicsList();
        await this.refreshTemplatesList();
        this.plotExists = await this.checkPlotExists();
      } catch (error) {
        console.error(error);
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

  /**
   * Set's the widget's current notebook and updates needed widget variables.
   */
  /**
   * Prepares the current widget notebook to be a vcsReady notebook. Will create a new one if none exists.
   * @param currentFile The file path to set for the variable loading. If left blank, an error will occur.
   */
  public async recognizeNotebookPanel(): Promise<void> {
    try {
      this.preparing = true;

      // Check the active widget is a notebook panel
      if (this.application.shell.currentWidget instanceof NotebookPanel) {
        await this.setNotebookPanel(this.application.shell.currentWidget);
      } else {
        // There is no active notebook widget
        await this.setNotebookPanel(null);
      }

      // Get notebook state
      await this.updateNotebookState();

      if (
        this.state === NOTEBOOK_STATE.Unknown ||
        this.state === NOTEBOOK_STATE.NoOpenNotebook ||
        this.state === NOTEBOOK_STATE.InactiveNotebook
      ) {
        return;
      }

      // Check the active widget is a notebook panel
      if (this.application.shell.currentWidget instanceof NotebookPanel) {
        await this.setNotebookPanel(this.application.shell.currentWidget);
      } else {
        return;
      }

      // Inject the imports
      let currentIdx: number =
        this.notebookPanel.content.model.cells.length - 1;
      await this.codeInjector.injectImportsCode(currentIdx, true);

      // Inject canvas if needed
      const canvasExists: boolean = await this.checkCanvasExists();
      if (!canvasExists) {
        currentIdx = this.notebookPanel.content.model.cells.length - 1;
        await this.codeInjector.injectCanvasCode(currentIdx);
      }

      // Update the selected graphics method, variable list, templates and loaded variables
      await this.refreshGraphicsList();
      await this.refreshTemplatesList();
      await this.refreshVarList();

      // Select last cell in notebook
      this.notebookPanel.content.activeCellIndex =
        this.notebookPanel.content.model.cells.length - 1;

      // Update kernel list to identify this kernel is ready
      this.kernels.push(this.notebookPanel.session.kernel.id);

      // Save the notebook
      this.notebookPanel.context.save();

      // Activate current notebook
      this.application.shell.activateById(this.notebookPanel.id);

      // Connect the handler specific to current notebook
      this.nbPanel.content.stateChanged.connect(this.handleStateChanged);

      this.state = NOTEBOOK_STATE.VCS_Ready;

      this.preparing = false;
    } catch (error) {
      this.preparing = false;
      throw error;
    }
  }

  public async checkVCS(): Promise<boolean> {
    if (!this.notebookPanel) {
      return false;
    }

    // Try to initialize a vcs instant, if error then it's not vcs ready
    this.usingKernel = true;
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      CHECK_VCS_CMD
    );
    this.usingKernel = false;
    if (result === "True") {
      return true;
    }
    return false;
  }

  public async checkCanvasExists(): Promise<boolean> {
    try {
      // Get the list of display elements in the canvas
      this.usingKernel = true;
      const output: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        `${OUTPUT_RESULT_NAME} = canvas.listelements('display')`
      );
      this.usingKernel = false;
      return true;
    } catch (error) {
      return false;
    }
  }

  public async checkPlotExists(): Promise<boolean> {
    try {
      if (this.state === NOTEBOOK_STATE.VCS_Ready) {
        // Get the list of display elements in the canvas
        this.usingKernel = true;
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          `import json\n${OUTPUT_RESULT_NAME} = json.dumps(canvas.listelements('display'))`
        );
        this.usingKernel = false;
        return Utilities.strArray(output).length > 1;
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
    if (this.state === NOTEBOOK_STATE.VCS_Ready) {
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
      if (this.state === NOTEBOOK_STATE.VCS_Ready) {
        // Refresh the graphic methods
        this.usingKernel = true;
        const output: string = await NotebookUtilities.sendSimpleKernelRequest(
          this.notebookPanel,
          REFRESH_TEMPLATES_CMD
        );
        // Update the list of latest variables and data
        this.templatesList = Utilities.strArray(output);
        this.usingKernel = false;
      } else {
        this.templatesList = BASE_TEMPLATES;
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * This updates the current variable list by sending a command to the kernel directly.
   */
  public async refreshVarList(): Promise<void> {
    // Don't refresh if not VCS_Ready
    if (
      this.state !== NOTEBOOK_STATE.VCS_Ready &&
      this.state !== NOTEBOOK_STATE.InitialCellsReady
    ) {
      await this.vcsMenuRef.updateVariables(Array<Variable>());
      return;
    }

    if (this.refreshExt) {
      this.refreshExt = false;
    }

    this.usingKernel = true;
    // Get the variables info
    const result: string = await NotebookUtilities.sendSimpleKernelRequest(
      this.notebookPanel,
      REFRESH_VAR_CMD
    );
    this.usingKernel = false;
    // A grouping object so that variables from each data source are updated
    const varGroups: { [sourceName: string]: Variable[] } = {};
    // Parse the resulting output into a list of variables with basic data
    const variableInfo: any = JSON.parse(result.slice(1, result.length - 1));

    // Exit early if no variables exist
    if (Object.keys(variableInfo).length < 1) {
      await this.vcsMenuRef.updateVariables(Array<Variable>());
      return;
    }

    const newVars = Array<Variable>();
    let srcName: string;
    Object.keys(variableInfo).map(async (item: string) => {
      const v: Variable = new Variable();
      v.name = item;
      v.pythonID = variableInfo[item].pythonID;
      v.longName = variableInfo[item].name;
      v.axisList = variableInfo[item].axisList;
      v.axisInfo = Array<AxisInfo>();
      v.units = variableInfo[item].units;

      // Update the parent data source
      srcName = this.vcsMenuRef.state.variableSources[v.name];
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
      }

      newVars.push(v);
    });

    // Update axis info for each variable
    if (varGroups) {
      Object.keys(varGroups).forEach(async (sourceName: string) => {
        await this.updateAxesInfo(varGroups[sourceName]);
      });
    }

    await this.vcsMenuRef.updateVariables(newVars);
  }

  // Updates the axes information for each variable based on what source it came from
  public async updateAxesInfo(varGroup: Variable[]): Promise<void> {
    // Get the filepath from the data readerlist
    const sourceFile: string = this.codeInjector.dataReaderList[
      varGroup[0].sourceName
    ];

    // Exit early if no source filepath exists
    if (!sourceFile) {
      return;
    }

    // Get relative path for the file
    const nbPath: string = `${this.notebookPanel.session.path}`;
    const relativePath: string = Utilities.getRelativePath(nbPath, sourceFile);

    let cmd: string = `import cdms2\nimport json\nreader = cdms2.open('${relativePath}')`;
    cmd += `\n${GET_AXIS_INFO_CMD}\nreader.close()\n`;

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
        if (axesInfo[item].data) {
          axesInfo[item].min = axesInfo[item].data[0];
          axesInfo[item].max =
            axesInfo[item].data[axesInfo[item].data.length - 1];
          variable.axisInfo.push(axesInfo[item]);
        }
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
    if (!filePath) {
      return Array<Variable>();
    }

    try {
      // Get relative path for the file
      const nbPath: string = `${this.notebookPanel.session.path}`;
      const relativePath: string = Utilities.getRelativePath(nbPath, filePath);

      this.usingKernel = true;

      const result: string = await NotebookUtilities.sendSimpleKernelRequest(
        this.notebookPanel,
        `import json\nimport cdms2\nreader = cdms2.open('${relativePath}')\n${GET_VARIABLES_CMD}`
      );
      this.usingKernel = false;

      // Parse the resulting output into an object
      const variableAxes: any = JSON.parse(result.slice(1, result.length - 1));
      const newVars = Array<Variable>();
      Object.keys(variableAxes.vars).map((varName: string) => {
        const v = new Variable();
        v.name = varName;
        v.pythonID = variableAxes.vars[varName].pythonID;
        v.longName = variableAxes.vars[varName].name;
        v.axisList = variableAxes.vars[varName].axisList;
        v.axisInfo = Array<AxisInfo>();
        variableAxes.vars[varName].axisList.map((item: any) => {
          v.axisInfo.push(variableAxes.axes[item]);
        });
        v.units = variableAxes.vars[varName].units;
        v.sourceName = this.codeInjector.getDataReaderName(filePath);
        newVars.push(v);
      });
      return newVars;
    } catch (error) {
      if (error.status === "error") {
        NotebookUtilities.showMessage(error.ename, error.evalue);
      } else if (error.message) {
        NotebookUtilities.showMessage("Error", error.message);
      } else {
        NotebookUtilities.showMessage(
          "Error",
          "An error occurred when getting variables from the file."
        );
      }
      return Array<Variable>();
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
          await this.nbPanel.session.ready;
          // Check if there is a kernel listed as vcsReady
          if (
            this.kernels.length > 0 &&
            this.kernels.indexOf(this.notebookPanel.session.kernel.id) >= 0
          ) {
            // Ready kernel identified, so the notebook is ready for injection
            this.state = NOTEBOOK_STATE.VCS_Ready;
          } else {
            // Search for a cell containing the imports key
            const importKeyFound: boolean =
              CellUtilities.findCellWithMetaKey(
                this.notebookPanel,
                IMPORT_CELL_KEY
              )[0] >= 0;

            // Search for a cell containing the canvas variables key
            const canvasKeyFound =
              CellUtilities.findCellWithMetaKey(
                this.notebookPanel,
                CANVAS_CELL_KEY
              )[0] >= 0;

            this.state =
              importKeyFound && canvasKeyFound
                ? NOTEBOOK_STATE.InitialCellsReady
                : NOTEBOOK_STATE.ActiveNotebook;
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
   * Prepares the current widget notebook to be a vcsReady notebook. Will create a new one if none exists.
   * @param currentFile The file path to set for the variable loading. If left blank, an error will occur.
   */
  public async prepareNotebookPanel(currentFile: string): Promise<void> {
    if (!currentFile) {
      this.state = NOTEBOOK_STATE.Unknown;
      // Reject initilization if no file has been selected
      throw new Error("No file has been set for obtaining variables.");
    }

    this.preparing = true;

    try {
      // Set the current file and save the meta data
      await this.setCurrentFile(currentFile, true);

      // Grab a notebook panel
      const newNotebookPanel = await this.getNotebookPanel();

      // Set as current notebook (if not already)
      await this.setNotebookPanel(newNotebookPanel);

      // Inject the imports
      let currentIdx: number = 0;
      currentIdx = await this.codeInjector.injectImportsCode();

      // Inject the data file(s)
      currentIdx = await this.codeInjector.injectDataReaders(
        currentIdx + 1,
        currentFile
      );

      // Inject canvas(es)
      currentIdx = await this.codeInjector.injectCanvasCode(currentIdx + 1);

      // Select last cell in notebook
      this.notebookPanel.content.activeCellIndex =
        this.notebookPanel.content.model.cells.length - 1;

      // Update kernel list to identify this kernel is ready
      this.kernels.push(this.notebookPanel.session.kernel.id);

      // Save the notebook to preserve the cell metadata, update state
      this.state = NOTEBOOK_STATE.VCS_Ready;

      // Check if the file has already been loaded
      const fileLoaded: boolean = Object.keys(
        this.codeInjector.dataReaderList
      ).some(value => {
        return this.codeInjector.dataReaderList[value] === currentFile;
      });

      // If file hasn't been loaded, inject it
      if (!fileLoaded) {
        const idx: number = CellUtilities.findCellWithMetaKey(
          this.notebookPanel,
          READER_CELL_KEY
        )[0];

        await this.codeInjector.injectDataReaders(idx, currentFile);
      }

      // Launch file variable loader if file has variables
      const fileVars: Variable[] = await this.getFileVariables(currentFile);
      if (fileVars.length > 0) {
        await this.vcsMenuRef.launchVarSelect(fileVars);
      } else {
        this.lastFile = "";
      }

      // Save the notebook
      this.notebookPanel.context.save();

      // Activate current notebook
      this.application.shell.activateById(this.notebookPanel.id);

      // Connect the handler specific to current notebook
      this.nbPanel.content.stateChanged.connect(this.handleStateChanged);

      this.preparing = false;
    } catch (error) {
      this.preparing = false;
      throw error;
    }
  }

  /**
   * @returns Promise<NotebookPanel> - The widget's current notebookPanel or a new one if none exists.
   */
  public async getNotebookPanel(): Promise<NotebookPanel> {
    const prom: Promise<NotebookPanel> = new Promise(
      async (resolve, reject) => {
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
      }
    );
    return prom;
  }
}
