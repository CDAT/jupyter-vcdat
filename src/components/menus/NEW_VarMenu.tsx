// Dependencies
import * as React from "react";
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
import ColorFunctions from "../../modules/utilities/ColorFunctions";
import Variable from "../../modules/types/Variable";
import VarLoader from "../modals/VarLoader";
import VarMini from "../VarMini";
import { boundMethod } from "autobind-decorator";
import AppControl from "../../modules/AppControl";
import VariableTracker from "../../modules/VariableTracker";

const varButtonStyle: React.CSSProperties = {
  marginBottom: "1em",
};

const formOverflow: React.CSSProperties = {
  maxHeight: "250px",
  overflowY: "auto",
};

interface IVarMenuProps {
  updateNotebook: () => Promise<void>; // Updates the current notebook to check if it is vcdat ready
  syncNotebook: () => boolean; // Function that check if the Notebook should be synced/prepared
  setPlotInfo: (plotName: string, plotFormat: string) => void;
  exportAlerts: () => void;
  dismissSavePlotSpinnerAlert: () => void;
  showExportSuccessAlert: () => void;
  showInputModal: () => void;
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
  private _app: AppControl;
  constructor(props: IVarMenuProps) {
    super(props);
    this._app = AppControl.getInstance();
    this.varLoaderRef = (React as any).createRef();
    this.state = {
      modalOpen: false,
      selectedVariables: this._app.varTracker.selectedVariables,
      variables: this._app.varTracker.variables,
    };
  }

  public componentDidMount(): void {
    this._app.varTracker.selectedVariablesChanged.connect(
      this.handleSelectionChanged
    );
    this._app.varTracker.variablesChanged.connect(this.handleVariablesChanged);
  }

  public componentWillUnmount(): void {
    this._app.varTracker.selectedVariablesChanged.disconnect(
      this.handleSelectionChanged
    );
    this._app.varTracker.variablesChanged.disconnect(
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
    await this._app.labControl.commands.execute("filebrowser:activate");
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
    await this._app.codeInjector.loadVariable(variable, newAlias);
    this._app.varTracker.addVariable(variable);
    this._app.varTracker.selectedVariables = newAlias
      ? [newAlias]
      : [variable.varID];
    await this._app.varTracker.saveMetaData();
  }

  @boundMethod
  public varAliasExists(alias: string): boolean {
    return this._app.varTracker.findVariableByAlias(alias)[0] >= 0;
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
                      this._app.varTracker.deselectVariable(item.varID);
                    } else {
                      this._app.varTracker.selectVariable(item.varID);
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
                          this._app.varTracker.selectedVariablesChanged
                        }
                        reload={this.reloadVariable}
                        copyVariable={this._app.varTracker.copyVariable}
                        selectVariable={this._app.varTracker.selectVariable}
                        deleteVariable={this._app.codeInjector.deleteVariable}
                        buttonColor={colors[this.getOrder(item.varID) - 1]}
                        allowReload={true}
                        selected={this.isSelected(item.varID)}
                        isSelected={this.isSelected}
                        selectOrder={this.getOrder(item.varID)}
                        variable={item}
                        codeInjector={this._app.codeInjector}
                        setPlotInfo={this.props.setPlotInfo}
                        exportAlerts={this.props.exportAlerts}
                        dismissSavePlotSpinnerAlert={
                          this.props.dismissSavePlotSpinnerAlert
                        }
                        showExportSuccessAlert={
                          this.props.showExportSuccessAlert
                        }
                        notebookPanel={this._app.labControl.notebookPanel}
                      />
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
            )}
          </CardBody>
        </Card>
        <VarLoader
          varTracker={this._app.varTracker}
          loadSelectedVariables={this._app.codeInjector.loadMultipleVariables}
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
