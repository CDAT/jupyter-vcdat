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
import { CodeInjector } from "../CodeInjector";
import { AxisInfo } from "./AxisInfo";
import { ColorFunctions } from "../ColorFunctions";
import { Variable } from "./Variable";
import { VarLoader } from "./VarLoader";
import { VarMini } from "./VarMini";
import { VariableTracker } from "../VariableTracker";
import { CodeInjector } from "../CodeInjector";

const varButtonStyle: React.CSSProperties = {
  marginBottom: "1em"
};

const formOverflow: React.CSSProperties = {
  maxHeight: "250px",
  overflowY: "auto"
};

interface IVarMenuProps {
  codeInjector: CodeInjector;
  varTracker: VariableTracker;
  codeInjector: CodeInjector;
  commands?: any; // the command executer
  updateNotebook: () => Promise<void>; // Updates the current notebook to check if it is vcdat ready
  syncNotebook: () => boolean; // Function that check if the Notebook should be synced/prepared
  setPlotInfo: (plotName: string, plotFormat: string) => void;
  exportAlerts: () => void;
}

interface IVarMenuState {
  modalOpen: boolean; // Whether a modal is currently open
  variables: Variable[]; // all variables for list (derived and loaded)
  selectedVariables: Variable[]; // the names of the variables the user has selected
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
      variables: this.props.varTracker.variables
    };
    this.varLoaderRef = (React as any).createRef();
    this.launchFilebrowser = this.launchFilebrowser.bind(this);
    this.launchVarLoader = this.launchVarLoader.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.reloadVariable = this.reloadVariable.bind(this);
    this.copyVariable = this.copyVariable.bind(this);
    this.getOrder = this.getOrder.bind(this);
    this.setModalState = this.setModalState.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
    this.handleVariablesChanged = this.handleVariablesChanged.bind(this);
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

  public isSelected(variable: Variable): boolean {
    return (
      this.props.varTracker.findVarByID(
        variable.varID,
        this.state.selectedVariables
      )[0] >= 0
    );
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
    // Update state to show launcher with variables
    this.varLoaderRef.setState({
      fileVariables,
      show: true
    });
  }

  public async copyVariable(variable: Variable, newName: string) {
    const copy: Variable = this.props.varTracker.copyVariable(
      variable,
      newName
    );
    if (copy) {
      this.props.varTracker.selectedVariables = [variable];
      await this.props.codeInjector.loadVariable(copy);
    }
  }

  public async reloadVariable(variable: Variable): Promise<void> {
    await this.props.codeInjector.loadVariable(variable);
    this.props.varTracker.selectedVariables = [variable];
    await this.props.varTracker.saveMetaData();
  }

  public getOrder(varID: string): number {
    if (this.state.selectedVariables.length === 0) {
      return -1;
    }
    return (
      this.props.varTracker.findVarByID(
        varID,
        this.state.selectedVariables
      )[0] + 1
    );
  }

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
          <CardBody className={/*@tag<varmenu-main>*/ "varmenu-main-vcdat"}>
            <CardTitle>Variable Options</CardTitle>
            <CardSubtitle>
              <Row>
                <Col>
                  <Button
                    className={
                      /*@tag<varmenu-load-variables-btn>*/ "varmenu-load-variables-btn-vcdat"
                    }
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
                      className={
                        /*@tag<varmenu-sync-btn>*/ "varmenu-sync-btn-vcdat"
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
                className={/*@tag<varmenu-varlist>*/ "varmenu-varlist-vcdat"}
                style={formOverflow}
              >
                {this.state.variables.map((item: Variable, idx: number) => {
                  const reloadItem = () => {
                    this.reloadVariable(item);
                  };
                  const toggleSelection = () => {
                    if (this.state.modalOpen) {
                      return;
                    }
                    if (this.isSelected(item)) {
                      this.props.varTracker.deselectVariable(item);
                    } else {
                      this.props.varTracker.selectVariable(item);
                    }
                  };
                  return (
                    <ListGroupItem
                      key={`${item.varID}${idx}`}
                      onClick={toggleSelection}
                    >
                      <VarMini
                        modalOpen={this.setModalState}
                        reload={reloadItem}
                        copyVariable={this.copyVariable}
                        deleteVariable={this.props.codeInjector.deleteVariable}
                        buttonColor={colors[this.getOrder(item.varID) - 1]}
                        allowReload={true}
                        isSelected={this.isSelected}
                        selectOrder={this.getOrder(item.varID)}
                        updateDimInfo={this.props.varTracker.updateDimInfo}
                        variable={item}
                        codeInjector={this.props.codeInjector}
                        setPlotInfo={this.props.setPlotInfo}
                        exportAlerts={this.props.exportAlerts}
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
          ref={(loader: VarLoader) => (this.varLoaderRef = loader)}
        />
      </div>
    );
  }

  private handleSelectionChanged(
    varTracker: VariableTracker,
    newVariables: Variable[]
  ): void {
    this.setState({ selectedVariables: newVariables });
  }

  private handleVariablesChanged(
    varTracker: VariableTracker,
    variables: Variable[]
  ): void {
    this.setState({ variables });
  }
}
