// Dependencies
import * as React from "react";
import { NotebookPanel } from "@jupyterlab/notebook";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Col,
  ListGroup,
  ListGroupItem,
  Row,
} from "reactstrap";

// Project Components
import CodeInjector from "../CodeInjector";
import ColorFunctions from "../ColorFunctions";
import Variable from "../Variable";
import VarLoader from "./VarLoader";
import VarMini from "./VarMini";
import VariableTracker from "../VariableTracker";
import { boundMethod } from "autobind-decorator";

const varButtonStyle: React.CSSProperties = {
  marginBottom: "1em",
};

const formOverflow: React.CSSProperties = {
  maxHeight: "250px",
  overflowY: "auto",
};

interface IVarMenuProps {
  codeInjector: CodeInjector;
  varTracker: VariableTracker;
  commands?: any; // the command executer
  updateNotebook: () => Promise<void>; // Updates the current notebook to check if it is vcdat ready
  syncNotebook: () => boolean; // Function that check if the Notebook should be synced/prepared
  setPlotInfo: (plotName: string, plotFormat: string) => void;
  exportAlerts: () => void;
  dismissSavePlotSpinnerAlert: () => void;
  showExportSuccessAlert: () => void;
  showInputModal: () => void;
  notebookPanel: NotebookPanel;
}

interface IVarMenuState {
  modalOpen: boolean; // Whether a modal is currently open
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
      modalOpen: false,
      selectedVariables: this.props.varTracker.selectedVariables,
      variables: this.props.varTracker.variables,
    };
    this.varLoaderRef = (React as any).createRef();
  }

  public componentDidMount(): void {
    this.props.varTracker.selectedVariablesChanged.connect(
      this.handleSelectionChanged
    );
    this.props.varTracker.variablesChanged.connect(this.handleVariablesChanged);
  }

  public componentWillUnmount(): void {
    this.props.varTracker.selectedVariablesChanged.disconnect(
      this.handleSelectionChanged
    );
    this.props.varTracker.variablesChanged.disconnect(
      this.handleVariablesChanged
    );
  }

  @boundMethod
  public isSelected(varID: string): boolean {
    return this.state.selectedVariables.indexOf(varID) >= 0;
  }

  /**
   * @description launches the notebooks filebrowser so the user can select a data file
   */
  @boundMethod
  public async launchFilepathModal(): Promise<void> {
    this.props.showInputModal();
  }

  /**
   * @description launches the notebooks filebrowser so the user can select a data file
   */
  @boundMethod
  public async launchFilebrowser(): Promise<void> {
    await this.props.commands.execute("filebrowser:activate");
  }

  /**
   * @description toggles the varLoaders menu
   */
  @boundMethod
  public async launchVarLoader(fileVariables: Variable[]): Promise<void> {
    // Reset the varloader
    await this.varLoaderRef.reset();
    // Update state to show launcher with variables
    this.varLoaderRef.setState({
      show: true,
    });
    this.varLoaderRef.updateFileVars(fileVariables);
  }

  @boundMethod
  public async reloadVariable(
    variable: Variable,
    newAlias?: string
  ): Promise<void> {
    await this.props.codeInjector.loadVariable(variable, newAlias);
    this.props.varTracker.addVariable(variable);
    this.props.varTracker.selectedVariables = newAlias
      ? [newAlias]
      : [variable.varID];
    await this.props.varTracker.saveMetaData();
  }

  @boundMethod
  public varAliasExists(alias: string): boolean {
    return this.props.varTracker.findVariableByAlias(alias)[0] >= 0;
  }

  @boundMethod
  public getOrder(varID: string): number {
    if (this.state.selectedVariables.length === 0) {
      return -1;
    }
    return this.state.selectedVariables.indexOf(varID) + 1;
  }

  @boundMethod
  public setModalState(newState: boolean): void {
    this.setState({ modalOpen: newState });
  }

  public render(): JSX.Element {
    const colors: string[] = ColorFunctions.createGradient(
      this.state.selectedVariables.length,
      "#28a745",
      "#17a2b8"
    );

    return (
      <div>
        <Card>
          <CardBody className={/* @tag<varmenu-main>*/ "varmenu-main-vcdat"}>
            <CardTitle>Load Variable Options</CardTitle>
            <CardSubtitle>
              <Row>
                <Col>
                  <ButtonGroup style={{ minWidth: "155px" }}>
                    <Button
                      className={
                        /* @tag<varmenu-load-variables-file-btn>*/ "varmenu-load-variables-file-btn-vcdat"
                      }
                      color="info"
                      onClick={this.launchFilebrowser}
                      style={varButtonStyle}
                      title="Load variables from a file in the file browser."
                    >
                      File
                    </Button>
                    <Button
                      className={
                        /* @tag<varmenu-load-variables-path-btn>*/ "varmenu-load-variables-path-btn-vcdat"
                      }
                      color="info"
                      onClick={this.launchFilepathModal}
                      style={varButtonStyle}
                      title="Load variables using from a file specified by path."
                    >
                      Path
                    </Button>
                  </ButtonGroup>
                </Col>
                {this.props.syncNotebook() && (
                  <Col>
                    <Button
                      className={
                        /* @tag<varmenu-sync-btn>*/ "varmenu-sync-btn-vcdat"
                      }
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
              <ListGroup
                className={/* @tag<varmenu-varlist>*/ "varmenu-varlist-vcdat"}
                style={formOverflow}
              >
                {this.state.variables.map((item: Variable, idx: number) => {
                  const toggleSelection = (): void => {
                    if (this.state.modalOpen) {
                      return;
                    }
                    if (this.isSelected(item.varID)) {
                      this.props.varTracker.deselectVariable(item.varID);
                    } else {
                      this.props.varTracker.selectVariable(item.varID);
                    }
                  };
                  return (
                    <ListGroupItem
                      key={`${item.varID}${idx}`}
                      onClick={toggleSelection}
                    >
                      <VarMini
                        modalOpen={this.setModalState}
                        varAliasExists={this.varAliasExists}
                        varSelectionChanged={
                          this.props.varTracker.selectedVariablesChanged
                        }
                        reload={this.reloadVariable}
                        copyVariable={this.props.varTracker.copyVariable}
                        selectVariable={this.props.varTracker.selectVariable}
                        deleteVariable={this.props.codeInjector.deleteVariable}
                        buttonColor={colors[this.getOrder(item.varID) - 1]}
                        allowReload={true}
                        selected={this.isSelected(item.varID)}
                        isSelected={this.isSelected}
                        selectOrder={this.getOrder(item.varID)}
                        variable={item}
                        codeInjector={this.props.codeInjector}
                        setPlotInfo={this.props.setPlotInfo}
                        exportAlerts={this.props.exportAlerts}
                        dismissSavePlotSpinnerAlert={
                          this.props.dismissSavePlotSpinnerAlert
                        }
                        showExportSuccessAlert={
                          this.props.showExportSuccessAlert
                        }
                        notebookPanel={this.props.notebookPanel}
                      />
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
            )}
          </CardBody>
        </Card>
        <VarLoader
          varTracker={this.props.varTracker}
          loadSelectedVariables={this.props.codeInjector.loadMultipleVariables}
          ref={(loader: VarLoader): VarLoader => (this.varLoaderRef = loader)}
        />
      </div>
    );
  }

  @boundMethod
  private handleSelectionChanged(
    varTracker: VariableTracker,
    newSelection: string[]
  ): void {
    this.setState({ selectedVariables: newSelection });
  }

  @boundMethod
  private handleVariablesChanged(
    varTracker: VariableTracker,
    variables: Variable[]
  ): void {
    this.setState({ variables });
  }
}
