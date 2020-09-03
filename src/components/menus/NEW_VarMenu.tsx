// Dependencies
import React, { useState } from "react";
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
import VarLoader from "../modals/NEW_VarLoader";
import { VarMini } from "../NEW_VarMini";
import AppControl from "../../modules/AppControl";
import {
  useVariable,
  VariableAction,
} from "../../modules/contexts/VariableContext";
import { useModal, ModalAction } from "../../modules/contexts/ModalContext";
import { VCDAT_MODALS } from "../../VCDATWidget";
import { useApp } from "../../modules/contexts/AppContext";

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
}

interface IVarMenuState {
  modalOpen: boolean; // Whether a modal is currently open
}

const VarMenu = (props: IVarMenuProps) => {
  const app: AppControl = AppControl.getInstance();

  const [varState, varDispatch] = useVariable();
  const [modalState, modalDispatch] = useModal();

  const [state, setState] = useState<IVarMenuState>({
    modalOpen: false,
  });

  const isSelected = (varID: string): boolean => {
    return varState.selectedVariables.indexOf(varID) >= 0;
  };

  /**
   * @description launches the notebooks filebrowser so the user can select a data file
   */
  const launchFilepathModal = async (): Promise<void> => {
    modalDispatch(ModalAction.show(VCDAT_MODALS.FilePathInput));
  };

  /**
   * @description launches the notebooks filebrowser so the user can select a data file
   */
  const launchFilebrowser = async (): Promise<void> => {
    await app.labControl.commands.execute("filebrowser:activate");
  };

  /**
   * @description toggles the varLoaders menu
   */
  const launchVarLoader = async (fileVariables: Variable[]): Promise<void> => {
    varDispatch(VariableAction.setFileVariables(fileVariables));
    modalDispatch(ModalAction.show(VCDAT_MODALS.VarLoader));
  };

  const reloadVariable = async (
    variable: Variable,
    newAlias?: string
  ): Promise<void> => {
    await app.codeInjector.loadVariable(variable, newAlias);
    app.varTracker.addVariable(variable);
    app.varTracker.selectedVariables = newAlias ? [newAlias] : [variable.varID];
    await app.varTracker.saveMetaData();
  };

  const varAliasExists = (alias: string): boolean => {
    return app.varTracker.findVariableByAlias(alias)[0] >= 0;
  };

  const getOrder = (varID: string): number => {
    if (varState.selectedVariables.length === 0) {
      return -1;
    }
    return varState.selectedVariables.indexOf(varID) + 1;
  };

  const setModalState = (newState: boolean): void => {
    setState({ ...state, modalOpen: newState });
  };

  const colors: string[] = ColorFunctions.createGradient(
    varState.selectedVariables.length,
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
                    onClick={launchFilebrowser}
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
                    onClick={launchFilepathModal}
                    style={varButtonStyle}
                    title="Load variables using from a file specified by path."
                  >
                    Path
                  </Button>
                </ButtonGroup>
              </Col>
              {props.syncNotebook() && (
                <Col>
                  <Button
                    className={
                      /* @tag<varmenu-sync-btn>*/ "varmenu-sync-btn-vcdat"
                    }
                    color="info"
                    onClick={props.updateNotebook}
                    style={varButtonStyle}
                    title="Prepare and synchronize the currently open notebook for use with vCDAT 2.0"
                  >
                    Sync Notebook
                  </Button>
                </Col>
              )}
            </Row>
          </CardSubtitle>
          {varState.variables.length > 0 && (
            <ListGroup
              className={/* @tag<varmenu-varlist>*/ "varmenu-varlist-vcdat"}
              style={formOverflow}
            >
              {varState.variables.map((item: Variable, idx: number) => {
                const toggleSelection = (): void => {
                  if (state.modalOpen) {
                    return;
                  }
                  if (isSelected(item.varID)) {
                    varDispatch(VariableAction.deselectVariable(item.varID));
                    // app.varTracker.deselectVariable(item.varID);
                  } else {
                    varDispatch(VariableAction.selectVariable(item.varID));
                    // app.varTracker.selectVariable(item.varID);
                  }
                };
                return (
                  <ListGroupItem
                    key={`${item.varID}${idx}`}
                    onClick={toggleSelection}
                  >
                    <VarMini
                      modalOpen={setModalState}
                      varAliasExists={varAliasExists}
                      reload={reloadVariable}
                      buttonColor={colors[getOrder(item.varID) - 1]}
                      allowReload={true}
                      selected={isSelected(item.varID)}
                      isSelected={isSelected}
                      selectOrder={getOrder(item.varID)}
                      variable={item}
                      setPlotInfo={props.setPlotInfo}
                    />
                  </ListGroupItem>
                );
              })}
            </ListGroup>
          )}
        </CardBody>
      </Card>
      <VarLoader
        modalID={VCDAT_MODALS.VarLoader}
        varTracker={app.varTracker}
        loadSelectedVariables={app.codeInjector.loadMultipleVariables}
      />
    </div>
  );
};

export { VarMenu };
