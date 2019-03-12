// Dependencies
import * as React from "react";
import { Button, Card, CardBody, CustomInput } from "reactstrap";
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";

// Project Components
import { NotebookUtilities } from "../NotebookUtilities";
import {
  VARIABLES_LOADED_KEY,
  GRAPHICS_METHOD_KEY,
  MAX_SLABS,
  TEMPLATE_KEY,
  VARIABLES_KEY
} from "../constants";
import VarMenu from "./VarMenu";
import GraphicsMenu from "./GraphicsMenu";
import TemplateMenu from "./TemplateMenu";
import Variable from "./Variable";
import AxisInfo from "./AxisInfo";

const btnStyle: React.CSSProperties = {
  margin: "5px"
};
const centered: React.CSSProperties = {
  margin: "auto"
};

const sidebarOverflow: React.CSSProperties = {
  maxHeight: "100vh",
  minWidth: "375px",
  overflow: "auto"
};

export type VCSMenuProps = {
  inject: Function; // a method to inject code into the controllers notebook
  commands: CommandRegistry; // the command executor
  notebookPanel: NotebookPanel;
  plotReady: boolean;
  getGraphicsList: Function; // function that reads the current graphics list
  refreshGraphicsList: Function; // function that refreshes the graphics method list
  getTemplatesList: Function; // function that reads the widget's current template list
  getFileVariables: Function; // Function that reads the current notebook file and retrieves variable data
  updateVariables: Function; // function that updates the variables list in the main widget
};
type VCSMenuState = {
  plotReady: boolean; // are we ready to plot
  variables: Array<Variable>; // All the variables, loaded from files and derived by users
  selectedVariables: Array<string>; // Unique names of all the variables that are currently selected
  selectedGM: string;
  selectedGMgroup: string;
  selectedTemplate: string;
  notebookPanel: NotebookPanel;
  overlayMode: boolean;
};

export class VCSMenu extends React.Component<VCSMenuProps, VCSMenuState> {
  varMenuRef: VarMenu;
  graphicsMenuRef: GraphicsMenu;
  templateMenuRef: TemplateMenu;
  constructor(props: VCSMenuProps) {
    super(props);
    this.state = {
      plotReady: this.props.plotReady,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: "",
      notebookPanel: this.props.notebookPanel,
      overlayMode: false
    };
    this.varMenuRef = (React as any).createRef();
    this.graphicsMenuRef = (React as any).createRef();
    this.plot = this.plot.bind(this);
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.resetState = this.resetState.bind(this);
    this.copyGraphicsMethod = this.copyGraphicsMethod.bind(this);
    this.getGraphicsSelections = this.getGraphicsSelections.bind(this);
    this.getTemplateSelection = this.getTemplateSelection.bind(this);
    this.updateGraphicsOptions = this.updateGraphicsOptions.bind(this);
    this.loadVariable = this.loadVariable.bind(this);
    this.updatePlotReady = this.updatePlotReady.bind(this);
    this.updateVariables = this.updateVariables.bind(this);
    this.updateSelectedVariables = this.updateSelectedVariables.bind(this);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
    this.toggleOverlayMode = this.toggleOverlayMode.bind(this);
  }

  async resetState() {
    this.varMenuRef.resetVarMenuState();
    this.graphicsMenuRef.resetGraphicsState();
    this.templateMenuRef.resetTemplateMenuState();
    this.setState({
      plotReady: false,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selectedGM: "",
      selectedGMgroup: "",
      selectedTemplate: ""
    });
  }

  getVariableSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    let selection: Array<string> = NotebookUtilities.getMetaDataNow(
      this.state.notebookPanel,
      VARIABLES_KEY
    );

    // No meta data means fresh notebook with no selections
    if (selection == null) {
      this.varMenuRef.resetVarMenuState();
      this.setState({
        selectedVariables: new Array<string>()
      });
      return;
    }

    // Set state based on meta data from notebook
    this.setState({ selectedVariables: selection });
    this.varMenuRef.setState({ selectedVariables: selection });
  }

  getGraphicsSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    let gmData: [string, string] = NotebookUtilities.getMetaDataNow(
      this.state.notebookPanel,
      GRAPHICS_METHOD_KEY
    );

    if (gmData == null) {
      // No meta data means fresh notebook, reset the graphics
      this.graphicsMenuRef.resetGraphicsState();
      this.setState({
        selectedGM: "",
        selectedGMgroup: ""
      });
      return;
    }

    // Set state based on meta data from notebook
    this.setState({
      selectedGMgroup: gmData[0],
      selectedGM: gmData[1]
    });
    this.graphicsMenuRef.setState({
      selectedGroup: gmData[0],
      selectedMethod: gmData[1],
      tempGroup: gmData[0]
    });
  }

  getTemplateSelection(): void {
    // Load the selected template from meta data (if exists)
    let template: string = NotebookUtilities.getMetaDataNow(
      this.state.notebookPanel,
      TEMPLATE_KEY
    );

    // If the data is not null, set the selected graphic method and group
    if (template == null) {
      // No meta data means fresh notebook, reset the graphics
      this.templateMenuRef.resetTemplateMenuState();
      return;
    }
    this.setState({
      selectedTemplate: template
    });
    this.templateMenuRef.setState({
      selectedTemplate: template
    });
  }

  async copyGraphicsMethod(
    groupName: string,
    methodName: string,
    newName: string
  ): Promise<void> {
    //Check that the method doesn't already exist in the selected group
    if (this.props.getGraphicsList()[groupName].indexOf(newName) >= 0) {
      NotebookUtilities.showMessage(
        "Notice",
        "There is already a graphic method with that name."
      );
    }

    // If no duplicates, create command injection string
    let command: string = `${newName}_${groupName} = `;
    command += `vcs.create${groupName}('${newName}',source='${methodName}')`;
    // Attempt code injection
    await this.props.inject(command).then(async () => {
      this.props.refreshGraphicsList();
      // If successful, update the current state
      await this.setState({
        selectedGMgroup: groupName,
        selectedGM: newName
      });
      // Save selected graphics method to meta data
      NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        GRAPHICS_METHOD_KEY,
        [this.state.selectedGMgroup, this.state.selectedGM]
      );
    });
  }

  /**
   * @description inject code into the notebook loading the graphics method selected by the user
   * @param group the group name that the selected GM came from
   * @param name the specific GM from the group
   */
  async updateGraphicsOptions(group: string, name: string): Promise<void> {
    let cmdString: string = "";
    if (name.indexOf(group) < 0) {
      cmdString = `${name}_${group} = vcs.get${group}('${name}')`;
    } else {
      cmdString = `${name} = vcs.get${group}('${name}')`;
    }

    // Attempt code injection
    await this.props.inject(cmdString).then(() => {
      // If successful, update the state
      this.setState({
        selectedGMgroup: group,
        selectedGM: name
      });
      // Save selected graphics method to meta data
      NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        GRAPHICS_METHOD_KEY,
        [this.state.selectedGMgroup, this.state.selectedGM]
      );
    });
  }

  async updateTemplateOptions(templateName: string): Promise<void> {
    let cmdString: string = `${templateName} = vcs.gettemplate('${templateName}')`;

    // Attempt code injection
    await this.props.inject(cmdString).then(() => {
      // If successful, update the state
      this.setState({
        selectedTemplate: templateName
      });
      // Save selected graphics method to meta data
      NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        TEMPLATE_KEY,
        templateName
      );
    });
  }

  /**
   * @description take a variable and load it into the notebook
   * @param variable The variable to load into the notebook
   */
  async loadVariable(variable: Variable): Promise<any> {
    // inject the code to load the variable into the notebook
    let cmdString = `${variable.name} = data("${variable.cdmsID}"`;
    variable.axisInfo.forEach((axis: AxisInfo) => {
      cmdString += `, ${axis.name}=(${axis.min}, ${axis.max})`;
    });
    cmdString += ")";
    this.props.inject(cmdString);
    // Get variables from meta data
    let res: any = await NotebookUtilities.getMetaData(
      this.state.notebookPanel,
      VARIABLES_LOADED_KEY
    );

    // If no variables are stored in the metadata, save the new one
    if (res == null) {
      let varArray = new Array<Variable>();
      varArray.push(variable);
      await NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        VARIABLES_LOADED_KEY,
        varArray
      );
    } else {
      // If there are already variables stored but this one isn't present then save it
      let newVariableArray = res.slice();
      let found: boolean = false;
      res.forEach((storedVar: Variable, varIndex: number) => {
        if (storedVar.name == variable.name) {
          newVariableArray[varIndex] = variable;
          found = true;
        }
      });
      if (!found) {
        newVariableArray.push(variable);
      }
      // Update meta data
      await NotebookUtilities.setMetaData(
        this.state.notebookPanel,
        VARIABLES_LOADED_KEY,
        newVariableArray
      );
    }
  }

  updatePlotReady(value: boolean): void {
    this.setState({ plotReady: value });
    this.graphicsMenuRef.setState({ plotReady: value });
    this.templateMenuRef.setState({ plotReady: value });
  }

  /**
   * @description given the variable, graphics method, and template selected by the user, run the plot method
   */
  plot(): void {
    if (this.state.selectedVariables.length == 0) {
      NotebookUtilities.showMessage(
        "Notice",
        "Please select a variable from the left panel"
      );
    } else {
      let gm: string = this.state.selectedGM;
      if (gm.indexOf(this.state.selectedGMgroup) < 0) {
        gm += `_${this.state.selectedGMgroup}`;
      }

      let temp = this.state.selectedTemplate;
      if (gm == null) {
        gm = '"default"';
      }
      if (temp == null) {
        temp = '"default"';
      }
      let plotString: string = "";
      if (this.state.overlayMode) {
        plotString = "canvas.plot(";
      } else {
        plotString = "canvas.clear()\ncanvas.plot(";
      }

      console.log("plotString:", plotString);
      let selection: Array<string> = this.state.selectedVariables;

      if (selection.length > MAX_SLABS) {
        selection = selection.slice(0, MAX_SLABS);
        this.updateSelectedVariables(selection);
      }
      selection.forEach(variableName => {
        plotString += variableName + ", ";
      });
      plotString += `${gm}, ${temp})`;
      this.props.inject(plotString);
    }
  }

  save(): void {
    let response: string | null = prompt(
      "Please enter the name to save the plot as."
    );
    if (response == null || response == "") {
      NotebookUtilities.showMessage("Notice", "Injection cancelled.");
    } else {
      this.props.inject(`canvas.png('${response}')`);
    }
  }

  clear(): void {
    this.props.inject("canvas.clear()");
  }

  toggleOverlayMode() {
    console.log("toggling overlayMode");
    this.setState(prevState => ({
      overlayMode: !prevState.overlayMode
    }));
  }

  /**
   * @description Launch the file browser, and then load variables from a file after its been selected
   * @param variables An array of variables to display in the launcher (loaded from a file)
   */
  async launchVarSelect(variables: Array<Variable>): Promise<void> {
    await this.varMenuRef.launchVarLoader(variables);
  }

  updateVariables(variables: Array<Variable>) {
    this.setState({ variables: variables });
    this.varMenuRef.setState({ variables: variables });
    this.varMenuRef.varLoaderRef.setState({ variables: variables });
    this.props.updateVariables(variables);
  }

  /**
   * @description Adds a list of variables to the selectedVariables list after checking that they're not already there
   * @param selection the list of variables to add to the selectedVariables list
   */
  async updateSelectedVariables(selection: Array<string>): Promise<any> {
    // Update meta data
    await NotebookUtilities.setMetaData(
      this.state.notebookPanel,
      VARIABLES_KEY,
      selection
    );
    await Promise.all([
      this.setState({ selectedVariables: selection }),
      this.varMenuRef.setState({ selectedVariables: selection })
    ]);
  }

  render(): JSX.Element {
    let GraphicsMenuProps = {
      getGraphicsList: this.props.getGraphicsList,
      updateGraphicsOptions: this.updateGraphicsOptions,
      copyGraphicsMethod: this.copyGraphicsMethod,
      varInfo: new Variable(),
      plotReady: this.state.plotReady
    };
    let VarMenuProps = {
      commands: this.props.commands,
      loadVariable: this.loadVariable,
      variables: this.state.variables,
      selectedVariables: this.state.selectedVariables,
      updateVariables: this.updateVariables,
      updateSelectedVariables: this.updateSelectedVariables
    };
    let TemplateMenuProps = {
      plotReady: this.state.plotReady,
      getTemplatesList: this.props.getTemplatesList,
      updateTemplateOptions: this.updateTemplateOptions
    };

    return (
      <div style={{ ...centered, ...sidebarOverflow }}>
        <Card>
          <CardBody>
            <div style={centered}>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.plot}
                disabled={!this.state.plotReady}
              >
                Plot
              </Button>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.save}
                disabled={!this.state.plotReady}
              >
                Save
              </Button>
              <Button
                type="button"
                color="primary"
                className="col-sm-3"
                style={btnStyle}
                onClick={this.clear}
                disabled={!this.state.plotReady}
              >
                Clear
              </Button>
              <br />
              <CustomInput
                type="switch"
                id="overlayModeSwitch"
                name="overlayModeSwitch"
                label="Overlay Mode"
                checked={this.state.overlayMode}
                onChange={this.toggleOverlayMode}
              />
            </div>
          </CardBody>
        </Card>
        <VarMenu {...VarMenuProps} ref={loader => (this.varMenuRef = loader)} />
        <GraphicsMenu
          {...GraphicsMenuProps}
          ref={loader => (this.graphicsMenuRef = loader)}
        />
        <TemplateMenu
          {...TemplateMenuProps}
          ref={loader => (this.templateMenuRef = loader)}
        />
      </div>
    );
  }
}

export default VCSMenu;
