// tslint:disable-next-line
import "bootstrap/dist/css/bootstrap.min.css";

// Dependencies
import * as React from "react";
import * as _ from 'lodash';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

// Project Components
import { AxisInfo } from "./AxisInfo";
import { VarCard } from "./VarCard";
import { Variable } from "./Variable";

const modalOverflow: React.CSSProperties = {
  maxHeight: "70vh",
  overflow: "auto"
};
const noScroll: React.CSSProperties = {
  overflow: "hidden"
};

interface IVarLoaderProps {
  variables: Variable[]; // list of all currently available variables
  loadFileVariable: (variable: Variable) => Promise<void>; // function to call when user hits load
  updateSelectedVariables: (selection: string[]) => void; // update the list of selected variables
  saveMetaData: () => void; // function that saves the current notebook's meta data
}
interface IVarLoaderState {
  show: boolean; // should the modal be shown
  variables: Variable[]; // list of already loaded variables
  fileVariables: Variable[]; // the list of variables from within the file
  unloadedVariables: string[]; // the list of variables that haven't been loaded from the file
  selectedVariables: string[]; // the variables the user has selected to be loaded
  variablesToShow: Variable[]
}

export class VarLoader extends React.Component<
  IVarLoaderProps,
  IVarLoaderState
> {
  constructor(props: IVarLoaderProps) {
    super(props);

    this.state = {
      fileVariables: Array<Variable>(),
      selectedVariables: Array<string>(),
      show: false,
      unloadedVariables: Array<string>(),
      variables: this.props.variables,
      variablesToShow: Array<Variable>()
    };

    

    this.toggle = this.toggle.bind(this);
    this.isLoaded = this.isLoaded.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.loadSelectedVariables = this.loadSelectedVariables.bind(this);
    this.selectVariableForLoad = this.selectVariableForLoad.bind(this);
    this.deselectVariableForLoad = this.deselectVariableForLoad.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.handleLoadClick = this.handleLoadClick.bind(this);
    this.handlerResultSelect = this.handlerResultSelect.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.updateFileVars = this.updateFileVars.bind(this);
  }

  /**
   * @description Toggles the variable loader modal
   */
  public toggle(): void {
    this.setState({
      show: !this.state.show
    });
  }

  public isSelected(varName: string): boolean {
    return this.state.selectedVariables.indexOf(varName) >= 0;
  }

  // Loads all the selected variables into the notebook, returns the number loaded
  public async loadSelectedVariables(): Promise<void> {
    // Exit early if no variable selected for loading
    if (this.state.selectedVariables.length === 0) {
      this.setState({ selectedVariables: Array<string>() });
      return;
    }
    // Once the load button is clicked, load only the variables that were selected
    const loaders = Array<Promise<void>>();

    this.state.fileVariables.forEach((variable: Variable) => {
      const idx = this.state.selectedVariables.indexOf(variable.name);
      if (idx >= 0) {
        // Add the variable
        loaders.push(this.props.loadFileVariable(variable));
      }
    });
    await Promise.all(loaders);

    // Update the main widget's current selected variables
    this.props.updateSelectedVariables(this.state.selectedVariables);

    // Reset the state of the var loader when done
    this.setState({
      fileVariables: Array<Variable>(),
      selectedVariables: Array<string>(),
      unloadedVariables: Array<string>(),
      variables: Array<Variable>()
    });

    // Save the notebook after variables have been added
    await this.props.saveMetaData();
  }

  /**
   *
   * @param variable The Variable the user has selected to get loaded
   */
  public selectVariableForLoad(varName: string): void {
    // Update the state
    this.setState({
      selectedVariables: this.state.selectedVariables.concat([varName])
    });
  }

  /**
   *
   * @param variable Remove a variable from the list to be loaded
   */
  public deselectVariableForLoad(varName: string): void {
    const idx: number = this.state.selectedVariables.indexOf(varName);
    const selectedVars: string[] = this.state.selectedVariables;
    if (idx >= 0) {
      selectedVars.splice(idx, 1);
    }
    this.setState({
      selectedVariables: selectedVars
    });
  }

  // Returns true if the variable name has already been loaded into vcdat
  public isLoaded(varName: string): boolean {
    return this.state.unloadedVariables.indexOf(varName) < 0;
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varName the name of the variable to update
   */
  public updateDimInfo(newInfo: any, varName: string): void {
    this.state.fileVariables.forEach(
      (fileVariable: Variable, varIndex: number) => {
        if (fileVariable.name !== varName) {
          return;
        }
        fileVariable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
          if (axis.name !== newInfo.name) {
            return;
          }
          const fileVariables = this.state.fileVariables;
          fileVariables[varIndex].axisInfo[axisIndex].min = newInfo.min;
          fileVariables[varIndex].axisInfo[axisIndex].max = newInfo.max;
          this.setState({
            fileVariables
          });
        });
      }
    );
  }

  public handlerResultSelect(e: any, result: any){
    // this.setState({
    //   searchResults: result.name
    // });
  }

  public updateFileVars(vars: Array<Variable>){
    debugger;
    this.setState({
      fileVariables: vars,
      variablesToShow: vars
    });
  }

  public resetSearch(){
    this.setState({
      variablesToShow: this.state.fileVariables
    });
  }

  public handleSearchChange(e: any){
    debugger;
    let value = e.target.value;

    if(value.length < 1){
      this.setState({
        variablesToShow: this.state.fileVariables
      });
    }

    let targets = Array<string>();
    this.state.fileVariables.forEach((variable: Variable) => {
      targets.push(variable.name);
    });

    const re = new RegExp(value, 'i');
    const isMatch = (result: string) => re.test(result);

    let searchResults = _.filter(targets, isMatch);
    let newVarsToShow = Array<Variable>();
    searchResults.forEach((searchName: string) => {
      this.state.fileVariables.forEach((v: Variable) => {
        if(v.name == searchName){
          newVarsToShow.push(v);
        }
      });
    });
    this.setState({
      variablesToShow: newVarsToShow
    })
  } 

  public render(): JSX.Element {
    return (
      <div>
        <Modal
          id="var-loader-modal"
          isOpen={this.state.show}
          toggle={this.toggle}
          size="lg"
        >
          <ModalHeader toggle={this.toggle}>
            Load Variable
          </ModalHeader>
          <ModalBody>
          <div style={noScroll} className="var-loader-search">
              <form>
                <label>
                  Search:
                  <input 
                    type="text" 
                    name="name"
                    className="var-loader-search-input"
                    onChange={this.handleSearchChange} 
                    onKeyDown={(e) => {
                      if(e.keyCode == 13){
                        e.preventDefault() 
                      }}}>
                  </input>
                </label>
              </form>
            </div>
            <div style={modalOverflow} className="var-loader-items">
              {this.state.variablesToShow.length !== 0 &&
                this.state.variablesToShow.map((item: Variable) => {
                  return (
                    <VarCard
                      allowReload={false}
                      updateDimInfo={this.updateDimInfo}
                      isSelected={this.isSelected}
                      hidden={true}
                      key={item.name}
                      variable={item}
                      isLoaded={this.isLoaded(item.name)}
                      selectVariable={this.selectVariableForLoad}
                      deselectVariable={this.deselectVariableForLoad}
                    />
                  );
                })}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              outline={true}
              active={this.state.selectedVariables.length > 0}
              color="primary"
              onClick={this.handleLoadClick}
            >
              Load
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }

  private handleLoadClick(): void {
    this.setState({ show: false });
    this.loadSelectedVariables();
  }
}
