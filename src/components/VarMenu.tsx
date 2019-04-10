// Dependencies
import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Col,
  ListGroup,
  ListGroupItem,
  Row
} from "reactstrap";
import { ColorFunctions } from "../Utilities";

// Project Components
import AxisInfo from "./AxisInfo";
import Variable from "./Variable";
import VarLoader from "./VarLoader";
import VarMini from "./VarMini";

const varButtonStyle: React.CSSProperties = {
  marginBottom: "1em"
};

const formOverflow: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};

interface VarMenuProps {
  loadVariable: Function; // a method to call when loading the variable
  commands?: any; // the command executer
  variables: Variable[]; // an array of all current variables
  selectedVariables: string[]; // array of names for variables that have been selected
  updateSelectedVariables: Function; // update the list of selected variables
  updateVariables: Function; // update the list of all variables
  saveNotebook: Function; // function that saves the current notebook
  updateNotebook: Function; // Updates the current notebook to check if it is vcdat ready
  syncNotebook: Function; // Function that check if the Notebook should be synced/prepared
}

interface VarMenuState {
  variables: Variable[]; // all variables for list (derived and loaded)
  selectedVariables: string[]; // the names of the variables the user has selected
}

export default class VarMenu extends React.Component<
  VarMenuProps,
  VarMenuState
> {
  public varLoaderRef: VarLoader;
  constructor(props: VarMenuProps) {
    super(props);
    this.state = {
      selectedVariables: this.props.selectedVariables,
      variables: this.props.variables
    };
    this.varLoaderRef = (React as any).createRef();
    this.launchFilebrowser = this.launchFilebrowser.bind(this);
    this.launchVarLoader = this.launchVarLoader.bind(this);
    this.loadFileVariable = this.loadFileVariable.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.deselectVariable = this.deselectVariable.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.reloadVariable = this.reloadVariable.bind(this);
    this.resetVarMenuState = this.resetVarMenuState.bind(this);
  }

  // Resets the graphics menu to initial, (for when a new notebook is selected)
  public async resetVarMenuState(): Promise<void> {
    this.setState({
      selectedVariables: this.props.selectedVariables,
      variables: this.props.variables
    });
  }

  public isSelected(varName: string): boolean {
    return this.state.selectedVariables.indexOf(varName) >= 0;
  }

  /**
   * @description launches the notebooks filebrowser so the user can select a data file
   */
  public async launchFilebrowser(): Promise<void> {
    await this.props.commands.execute("vcs:load-data");
  }

  /**
   * @description toggles the varLoaders menu
   */
  public async launchVarLoader(fileVariables: Variable[]): Promise<void> {
    // Look through current loaded variable names to see if any haven't been loaded
    const unloaded: string[] = new Array<string>();
    const loadedVars: string[] = this.state.variables.map(
      (variable: Variable) => {
        return variable.name;
      }
    );
    fileVariables.forEach((fileVar: Variable) => {
      if (loadedVars.indexOf(fileVar.name) < 0) {
        unloaded.push(fileVar.name);
      }
    });
    // Update state to show launcher with variables
    this.varLoaderRef.setState({
      fileVariables,
      unloadedVariables: unloaded,
      show: true
    });
  }

  /**
   *
   * @param variable the variable to load
   */
  public async loadFileVariable(variable: Variable): Promise<void> {
    // if the variable ISNT already loaded, add it to the loaded list
    const newVariables: Variable[] = this.state.variables;
    let replaced: boolean = false;
    await this.state.variables.forEach(
      async (loadedVar: Variable, idx: number) => {
        if (variable.name == loadedVar.name) {
          newVariables[idx] = variable;
          await this.props.updateVariables(newVariables);
          replaced = true;
          return;
        }
      }
    );
    if (!replaced) {
      newVariables.push(variable);
      await this.props.updateVariables(newVariables);
    }

    await this.props.loadVariable(variable);
  }

  public async selectVariable(variableName: string): Promise<void> {
    const idx: number = this.state.selectedVariables.indexOf(variableName);

    if (idx < 0) {
      // Limit number of variables selected by deselecting last element
      const selection = this.state.selectedVariables;
      selection.push(variableName);

      await this.props.updateSelectedVariables(selection);
    }
  }

  /**
   * @description removes a variable from the state.selectedVariables list
   * @param variable the variable to remove from the selected list
   */
  public async deselectVariable(variableName: string): Promise<void> {
    const idx: number = this.state.selectedVariables.indexOf(variableName);

    if (idx >= 0) {
      const newSelection = this.state.selectedVariables;
      newSelection.splice(idx, 1);
      await this.setState(
        {
          selectedVariables: newSelection
        },
        () => {
          this.props.updateSelectedVariables(this.state.selectedVariables);
        }
      );
    }
  }

  /**
   * @description this is just a placeholder for now
   * @param newInfo new dimension info for the variables axis
   * @param varName the name of the variable to update
   */
  public async updateDimInfo(newInfo: any, varName: string): Promise<void> {
    this.state.variables.forEach((variable: Variable, varIndex: number) => {
      if (variable.name != varName) {
        return;
      }
      variable.axisInfo.forEach((axis: AxisInfo, axisIndex: number) => {
        if (axis.name != newInfo.name) {
          return;
        }
        this.state.variables[varIndex].axisInfo[axisIndex].min = newInfo.min;
        this.state.variables[varIndex].axisInfo[axisIndex].max = newInfo.max;
      });
    });
  }

  public async reloadVariable(variable: Variable): Promise<void> {
    await this.props.loadVariable(variable);
    await this.props.saveNotebook();
  }

  public getOrder(varName: string): number {
    if (this.state.selectedVariables.length == 0) {
      return -1;
    }
    return this.state.selectedVariables.indexOf(varName) + 1;
  }

  public render(): JSX.Element {
    const Colors: string[] = ColorFunctions.createGradient(
      this.state.selectedVariables.length,
      "#28a745",
      "#17a2b8"
    );
    const syncNotebook: boolean = this.props.syncNotebook();

    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>Variable Options</CardTitle>
            <CardSubtitle>
              <Row>
                <Col sm={6}>
                  <Button
                    color="info"
                    onClick={this.launchFilebrowser}
                    style={varButtonStyle}
                    title="Load variables from a data file."
                  >
                    Load Variable(s)
                  </Button>
                </Col>
                <Col sm={6}>
                  <Button
                    color="info"
                    onClick={async () => {
                      this.props.updateNotebook();
                    }}
                    hidden={!syncNotebook}
                    style={varButtonStyle}
                    title="Prepare and synchronize the currently open notebook for use with vCDAT 2.0"
                  >
                    Sync Notebook
                  </Button>
                </Col>
              </Row>
            </CardSubtitle>
            {this.state.variables.length > 0 && (
              <ListGroup style={formOverflow}>
                {this.state.variables.map(item => {
                  return (
                    <ListGroupItem
                      key={item.name}
                      onClick={() => {
                        if (this.isSelected(item.name)) {
                          this.deselectVariable(item.name);
                        } else {
                          this.selectVariable(item.name);
                        }
                      }}
                    >
                      <VarMini
                        reload={() => {
                          this.reloadVariable(item);
                        }}
                        buttonColor={Colors[this.getOrder(item.name) - 1]}
                        allowReload={true}
                        isSelected={this.isSelected}
                        selectOrder={this.getOrder(item.name)}
                        updateDimInfo={this.updateDimInfo}
                        variable={item}
                      />
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
            )}
          </CardBody>
        </Card>
        <VarLoader
          updateSelectedVariables={this.props.updateSelectedVariables}
          loadFileVariable={this.loadFileVariable}
          variables={this.state.variables}
          saveNotebook={this.props.saveNotebook}
          ref={(loader: VarLoader) => (this.varLoaderRef = loader)}
        />
      </div>
    );
  }
}
