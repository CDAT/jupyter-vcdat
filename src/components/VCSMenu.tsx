// Dependencies
import * as React from "react";
import { Alert, Button, ButtonGroup, Card, CardBody, Collapse, CustomInput, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Input, Label } from "reactstrap";
import { Spinner } from "reactstrap";
// Project Components
import { notebook_utils } from "../notebook_utils";
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
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";

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
  notebook_panel: NotebookPanel;
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
  selected_gm: string;
  selected_gm_group: string;
  selected_template: string;
  notebook_panel: any;
  modal: boolean;
  plotName: string;
  plotFileFormat: string;
  alertVisible: boolean;
  savePlotAlert: boolean;
  validateExportName: boolean;
  validateFileFormat: boolean;
  captureProvenance: boolean;
  displayDimensions: boolean;
  width: string;
  height: string;
  plotUnits: string;
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
      selected_gm: "",
      selected_gm_group: "",
      selected_template: "",
      notebook_panel: this.props.notebook_panel,
      modal: false,
      plotName: "",
      plotFileFormat: "",
      alertVisible: false,
      savePlotAlert: false,
      validateExportName: false,
      validateFileFormat: false,
      captureProvenance: false,
      displayDimensions: false,
      width: "",
      height: "",
      plotUnits: "pixels",

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
    this.toggleModal = this.toggleModal.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.dismissExportValidation = this.dismissExportValidation.bind(this);
    this.dismissFileFormatValidation = this.dismissFileFormatValidation.bind(this);
    this.toggleCaptureProvenance = this.toggleCaptureProvenance.bind(this);
    this.toggleDimensionsDisplay = this.toggleDimensionsDisplay.bind(this);
  }

  async toggleDimensionsDisplay(){
    console.log("state before toggle:", this.state.displayDimensions)
    if(!this.state.displayDimensions){
      console.log("dimensions currently hidden so will need to get dimensions")
      let width = await this.props.inject(`canvas.width`);
      let height = await this.props.inject(`canvas.height`);
      // let canvasInfoObject = JSON.parse(canvasInfo[1])
      this.setState({ width : width[1] })
      this.setState({ height: height[1] })
    }
    this.setState(prevState => ({ displayDimensions: !prevState.displayDimensions }));
  }

  toggleCaptureProvenance(){
    this.setState(prevState => ({
      captureProvenance: !prevState.captureProvenance
    }));
  }

  dismissFileFormatValidation(){
    this.setState({ validateFileFormat: false });
  }

  dismissExportValidation(){
    this.setState({ validateExportName: false });
  }

  onDismiss() {
   this.setState({ alertVisible: false });
 }

 dismissSavePlotAlert(){
   this.setState({ savePlotAlert: false });
 }

  toggleModal() {
    this.setState({ validateExportName : false })
    this.setState({ validateFileFormat : false })
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
    this.setState({ plotName : "" })
  }

  onFormSubmit() {
    // alert(JSON.stringify(this.state, null, '  '));
    console.log(this.state.plotName)
  }

  onRadioBtnClick(rSelected: string) {
   this.setState({ plotFileFormat: rSelected });
 }

 onUnitRadioBtnClick(rSelected: string) {
  this.setState({ plotUnits: rSelected });
}

  update(vars: Array<string>, gms: Array<any>, templates: Array<any>) {
    console.log(vars, gms, templates);
    this.updateTemplateOptions = this.updateTemplateOptions.bind(this);
  }

  async resetState() {
    this.varMenuRef.resetVarMenuState();
    this.graphicsMenuRef.resetGraphicsState();
    this.templateMenuRef.resetTemplateMenuState();
    this.setState({
      plotReady: false,
      variables: new Array<Variable>(),
      selectedVariables: new Array<string>(),
      selected_gm: "",
      selected_gm_group: "",
      selected_template: ""
    });
  }

  getVariableSelections(): void {
    // Load the selected graphics method from meta data (if exists)
    let selection: Array<string> = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
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
    let gm_data: [string, string] = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
      GRAPHICS_METHOD_KEY
    );

    if (gm_data == null) {
      // No meta data means fresh notebook, reset the graphics
      this.graphicsMenuRef.resetGraphicsState();
      this.setState({
        selected_gm: "",
        selected_gm_group: ""
      });
      return;
    }

    // Set state based on meta data from notebook
    this.setState({
      selected_gm: gm_data[0],
      selected_gm_group: gm_data[1]
    });
    this.graphicsMenuRef.setState({
      selectedGroup: gm_data[0],
      selectedMethod: gm_data[1],
      tempGroup: gm_data[0]
    });
  }

  getTemplateSelection(): void {
    // Load the selected template from meta data (if exists)
    let template: string = notebook_utils.getMetaDataNow(
      this.state.notebook_panel,
      TEMPLATE_KEY
    );

    // If the data is not null, set the selected graphic method and group
    if (template == null) {
      // No meta data means fresh notebook, reset the graphics
      this.templateMenuRef.resetTemplateMenuState();
      return;
    }
    this.setState({
      selected_template: template
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
      notebook_utils.showMessage(
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
        selected_gm_group: groupName,
        selected_gm: newName
      });
      // Save selected graphics method to meta data
      notebook_utils.setMetaData(
        this.state.notebook_panel,
        GRAPHICS_METHOD_KEY,
        [this.state.selected_gm_group, this.state.selected_gm]
      );
    });
  }

  /**
   * @description inject code into the notebook loading the graphics method selected by the user
   * @param group the group name that the selected GM came from
   * @param name the specific GM from the group
   */
  async updateGraphicsOptions(group: string, name: string): Promise<void> {
    let gm_string: string = "";
    if (name.indexOf(group) < 0) {
      gm_string = `${name}_${group} = vcs.get${group}('${name}')`;
    } else {
      gm_string = `${name} = vcs.get${group}('${name}')`;
    }

    // Attempt code injection
    await this.props.inject(gm_string).then(() => {
      // If successful, update the state
      this.setState({
        selected_gm_group: group,
        selected_gm: name
      });
      // Save selected graphics method to meta data
      notebook_utils.setMetaData(
        this.state.notebook_panel,
        GRAPHICS_METHOD_KEY,
        [this.state.selected_gm_group, this.state.selected_gm]
      );
    });
  }

  async updateTemplateOptions(templateName: string): Promise<void> {
    let cmd_string: string = `${templateName} = vcs.gettemplate('${templateName}')`;

    // Attempt code injection
    await this.props.inject(cmd_string).then(() => {
      // If successful, update the state
      this.setState({
        selected_template: templateName
      });
      // Save selected graphics method to meta data
      notebook_utils.setMetaData(
        this.state.notebook_panel,
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
    let var_string = `${variable.name} = data("${variable.cdmsID}"`;
    variable.axisInfo.forEach((axis: AxisInfo) => {
      var_string += `, ${axis.name}=(${axis.min}, ${axis.max})`;
    });
    var_string += ")";
    this.props.inject(var_string);
    // Get variables from meta data
    let res: any = await notebook_utils.getMetaData(
      this.state.notebook_panel,
      VARIABLES_LOADED_KEY
    );

    // If no variables are stored in the metadata, save the new one
    if (res == null) {
      let varArray = new Array<Variable>();
      varArray.push(variable);
      await notebook_utils.setMetaData(
        this.state.notebook_panel,
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
      await notebook_utils.setMetaData(
        this.state.notebook_panel,
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
      notebook_utils.showMessage(
        "Notice",
        "Please select a variable from the left panel"
      );
    } else {
      let gm: string = this.state.selected_gm;
      if (gm.indexOf(this.state.selected_gm_group) < 0) {
        gm += `_${this.state.selected_gm_group}`;
      }

      let temp = this.state.selected_template;
      if (!gm) {
        // Paste fix here
        gm = '"default"';
      }
      if (!temp) {
        temp = '"default"';
      }
      let plotString = "canvas.clear()\ncanvas.plot(";
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

  async save() {
    let plotName = this.state.plotName
    if(plotName == null || plotName == ""){
      this.setState({ validateExportName : true })
      return
    }
    else{
      this.setState({ validateExportName : false })
    }
    let fileFormat = this.state.plotFileFormat
    console.log("fileFormat: ", fileFormat)
    if(fileFormat == null || fileFormat == ""){
      this.setState({ validateFileFormat : true })
      return
    }
    else {
      this.setState({ validateFileFormat : false })
    }

    let capture = null
    if(this.state.captureProvenance){
      capture = 1
    }
    else{
      capture = 0
    }
    console.log("capture:", capture)

    console.log("height in save:", this.state.height)
    console.log("width in save:", this.state.width)
    console.log("plotUnits in save:", this.state.plotUnits)

    if(fileFormat === "png"){
      if(this.state.width && this.state.height){
        console.log("exporting png with custom dimensions")
        // TODO:  Wrap in try/catch
        try {
            await this.props.inject(`canvas.png('${plotName}', height=float('${this.state.height}'), width=float('${this.state.width}'), units='${this.state.plotUnits}')`);
        }
        catch(error){
          console.log("Failed to export with custom dimensions")
          return
        }
      } else {
          await this.props.inject(`canvas.png('${plotName}')`);
      }
    } else if (fileFormat == "pdf") {
      await this.props.inject(`canvas.pdf('${plotName}')`);
    } else if (fileFormat == "svg") {
      await this.props.inject(`canvas.svg('${plotName}')`);
    }

    this.setState({ savePlotAlert : true }, () => {
      window.setTimeout(() => {
        this.setState({ savePlotAlert : false })
        this.setState({ alertVisible : true }, () => {
          window.setTimeout(() => {
            this.setState({ alertVisible : false })
          }, 5000)
        })
      }, 5000)
    });
    this.setState({ modal: false });
  }

  clear(): void {
    this.props.inject("canvas.clear()");
  }

  /**
   * @description Launch the file browser, and then load variables from a file after its been selected
   * @param file_path the path of the file to load variables from
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
    await notebook_utils.setMetaData(
      this.state.notebook_panel,
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
                onClick={this.toggleModal}
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
        <Modal isOpen={this.state.modal} toggle={this.toggleModal} >
          <ModalHeader toggle={this.toggleModal}>Save Plot</ModalHeader>
          <ModalBody>
             <Label>Name:</Label>
             <Input
               type="text"
               name="text"
               placeholder="Name"
               value={this.state.plotName}
               onChange={e => this.setState({ plotName: e.target.value })}
             />
             <br />
             <Alert color="danger" isOpen={this.state.validateExportName} toggle={this.dismissExportValidation}>The export name can not be blank</Alert>
             <div>
               <ButtonGroup>
                 <Button color="primary" onClick={() => this.onRadioBtnClick("png")} active={this.state.plotFileFormat === "png"}>PNG</Button>
                 <Button color="primary" onClick={() => this.onRadioBtnClick("svg")} active={this.state.plotFileFormat === "svg"}>SVG</Button>
                 <Button color="primary" onClick={() => this.onRadioBtnClick("pdf")} active={this.state.plotFileFormat === "pdf"}>PDF</Button>
               </ButtonGroup>
               <Alert color="danger" isOpen={this.state.validateFileFormat} toggle={this.dismissFileFormatValidation}>You must choose a file format</Alert>
               <br />
               <CustomInput type="switch" id="dimensionsSwitch" name="dimensionsSwitch" label="Custom dimensions" checked={this.state.displayDimensions} onChange={this.toggleDimensionsDisplay} />
               <br />
               <div>
                 <Collapse isOpen={this.state.displayDimensions}>
                   <ButtonGroup>
                     <Button color="primary" onClick={() => this.onUnitRadioBtnClick("pixels")} active={this.state.plotUnits === "pixels"}>px</Button>
                     <Button color="primary" onClick={() => this.onUnitRadioBtnClick("in")} active={this.state.plotUnits === "in"}>in</Button>
                     <Button color="primary" onClick={() => this.onUnitRadioBtnClick("cm")} active={this.state.plotUnits === "cm"}>cm</Button>
                     <Button color="primary" onClick={() => this.onUnitRadioBtnClick("mm")} active={this.state.plotUnits === "mm"}>mm</Button>
                     <Button color="primary" onClick={() => this.onUnitRadioBtnClick("dot")} active={this.state.plotUnits === "dot"}>dot</Button>
                   </ButtonGroup>
                   <br />
                   <Label for="width">Width</Label>
                   <Input
                     type="text"
                     name="width"
                     placeholder="Width"
                     value={this.state.width}
                     onChange={e => this.setState({ width: e.target.value })}
                   />
                   <Label for="height">Height</Label>
                   <Input
                     type="text"
                     name="height"
                     placeholder="Height"
                     value={this.state.height}
                     onChange={e => this.setState({ height: e.target.value })}
                   />
                 </Collapse>
               </div>
             </div>
             <br />
             {/* <CustomInput type="switch" id="exampleCustomSwitch" name="customSwitch" label="Capture Provenance" checked={this.state.captureProvenance} onChange={this.toggleCaptureProvenance} /> */}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.save}>Export</Button>{' '}
            <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
          </ModalFooter>
        </Modal>
        <div>
        <Alert color="info" isOpen={this.state.savePlotAlert} toggle={this.dismissSavePlotAlert}>
          {"Saving " + this.state.plotName + "." + this.state.plotFileFormat + "  "}
          {"  "}<Spinner color="info" />
        </Alert>
          <Alert color="primary" isOpen={this.state.alertVisible} toggle={this.onDismiss}>
          {"Exported " + this.state.plotName + "." + this.state.plotFileFormat}
          </Alert>
      </div>
      </div>
    );
  }
}

export default VCSMenu;
