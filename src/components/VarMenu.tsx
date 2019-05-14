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

// Project Components
import { ColorFunctions } from "../ColorFunctions";
import { Variable } from "./Variable";
import { VarLoader } from "./VarLoader";
import { VarMini } from "./VarMini";
import { VariableTracker } from "../VariableTracker";

const varButtonStyle: React.CSSProperties = {
  marginBottom: "1em"
};

const formOverflow: React.CSSProperties = {
  maxHeight: "250px",
  overflow: "auto"
};

interface IVarMenuProps {
  loadVariable: (variable: Variable) => Promise<any>; // a method to call when loading the variable
  varTracker: VariableTracker;
  commands?: any; // the command executer
  saveNotebook: () => void; // function that saves the current notebook
  updateNotebook: () => Promise<void>; // Updates the current notebook to check if it is vcdat ready
  syncNotebook: () => boolean; // Function that check if the Notebook should be synced/prepared
}

interface IVarMenuState {
  variables: Variable[]; // all variables for list (derived and loaded)
  selectedVariables: string[]; // the names of the variables the user has selected
}

export default class VarMenu extends React.Component<
  IVarMenuProps,
  IVarMenuState
> {
  public varLoaderRef: VarLoader;
  constructor(props: IVarMenuProps) {
    super(props);
    this.state = {
      selectedVariables: this.props.varTracker.selectedVariables,
      variables: this.props.varTracker.variables
    };
    this.varLoaderRef = (React as any).createRef();
    this.launchFilebrowser = this.launchFilebrowser.bind(this);
    this.launchVarLoader = this.launchVarLoader.bind(this);
    this.loadFileVariable = this.loadFileVariable.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.selectVariable = this.selectVariable.bind(this);
    this.deselectVariable = this.deselectVariable.bind(this);
    this.reloadVariable = this.reloadVariable.bind(this);
    this.updateSelectedVariables = this.updateSelectedVariables.bind(this);
    this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
    this.handleVariablesChanged = this.handleVariablesChanged.bind(this);

    this.props.varTracker.selectedVariablesChanged.connect(
      this.handleSelectionChanged
    );
    this.props.varTracker.variablesChanged.connect(this.handleVariablesChanged);
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
    const unloaded: string[] = Array<string>();
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
      show: true,
      unloadedVariables: unloaded
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
        if (variable.name === loadedVar.name) {
          newVariables[idx] = variable;
          replaced = true;
          return;
        }
      }
    );
    if (!replaced) {
      newVariables.push(variable);
    }

    await this.props.loadVariable(variable);
  }

  public async selectVariable(variableName: string): Promise<void> {
    const idx: number = this.state.selectedVariables.indexOf(variableName);

    if (idx < 0) {
      // Limit number of variables selected by deselecting last element
      const newSelection = this.state.selectedVariables;
      newSelection.push(variableName);

      this.props.varTracker.selectedVariables = newSelection;
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
      this.props.varTracker.selectedVariables = newSelection;
    }
  }

  public async reloadVariable(variable: Variable): Promise<void> {
    await this.props.loadVariable(variable);
    await this.props.saveNotebook();
  }

  public getOrder(varName: string): number {
    if (this.state.selectedVariables.length === 0) {
      return -1;
    }
    return this.state.selectedVariables.indexOf(varName) + 1;
  }

  public updateSelectedVariables = (newSelection: string[]) => {
    this.props.varTracker.selectedVariables = newSelection;
  };

  public render(): JSX.Element {
    const colors: string[] = ColorFunctions.createGradient(
      this.state.selectedVariables.length,
      "#28a745",
      "#17a2b8"
    );

    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>Variable Options</CardTitle>
            <CardSubtitle>
              <Row>
                <Col>
                  <Button
                    color="info"
                    onClick={this.launchFilebrowser}
                    style={varButtonStyle}
                    title="Load variables from a data file."
                  >
                    Load Variable(s)
                  </Button>
                </Col>
                {this.props.syncNotebook() && (
                  <Col>
                    <Button
                      color="info"
                      onClick={this.props.updateNotebook}
                      style={varButtonStyle}
                      title="Prepare and synchronize the currently open notebook for use with vCDAT 2.0"
                    >
                      Sync Notebook
                    </Button>
                  </Col>
                )}
              </Row>
            </CardSubtitle>
            {this.state.variables.length > 0 && (
              <ListGroup style={formOverflow}>
                {this.state.variables.map((item: Variable, idx: number) => {
                  const reloadItem = () => {
                    this.reloadVariable(item);
                  };
                  const toggleSelection = () => {
                    if (this.isSelected(item.name)) {
                      this.deselectVariable(item.name);
                    } else {
                      this.selectVariable(item.name);
                    }
                  };
                  return (
                    <ListGroupItem
                      key={`${item.name}${idx}`}
                      onClick={toggleSelection}
                    >
                      <VarMini
                        reload={reloadItem}
                        buttonColor={colors[this.getOrder(item.name) - 1]}
                        allowReload={true}
                        isSelected={this.isSelected}
                        selectOrder={this.getOrder(item.name)}
                        updateDimInfo={this.props.varTracker.updateDimInfo}
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
          updateSelectedVariables={this.updateSelectedVariables}
          loadFileVariable={this.loadFileVariable}
          variables={this.state.variables}
          saveNotebook={this.props.saveNotebook}
          ref={(loader: VarLoader) => (this.varLoaderRef = loader)}
        />
      </div>
    );
  }

  private handleSelectionChanged(
    varTracker: VariableTracker,
    selectedVariables: string[]
  ): void {
    this.setState({ selectedVariables });
  }

  private handleVariablesChanged(
    varTracker: VariableTracker,
    variables: Variable[]
  ): void {
    this.setState({ variables });
  }
}
