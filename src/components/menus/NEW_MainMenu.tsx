// Dependencies
import React, { useState } from "react";
import AppControl from "../../modules/AppControl";

// Components
import TopButtons from "./NEW_TopButtons";
import { Alert, Spinner, Card } from "reactstrap";
import { VarMenu } from "./NEW_VarMenu";
import TemplateMenu from "./NEW_TemplateMenu";
import { VCDAT_MODALS } from "../../VCDATWidget";
import VarLoader from "../modals/NEW_VarLoader";
import { usePlot } from "../../modules/contexts/PlotContext";
import { useApp, AppAction } from "../../modules/contexts/AppContext";
import {
  useVariable,
  VariableAction,
} from "../../modules/contexts/VariableContext";
import { ModalAction, useModal } from "../../modules/contexts/ModalContext";
import Variable from "../../modules/types/Variable";
import { EXTENSIONS } from "../../modules/constants";
import LabControl from "../../modules/LabControl";
import Utilities from "../../modules/Utilities/Utilities";
import InputModal from "../modals/InputModal";
import NotebookUtilities from "../../modules/Utilities/NotebookUtilities";

export enum MAIN_ALERTS {
  exportSuccess = "showExportSuccessAlert",
  savePlot = "savePlotAlert",
}

const btnStyle: React.CSSProperties = {
  width: "100%",
};
const centered: React.CSSProperties = {
  margin: "auto",
};

const sidebarOverflow: React.CSSProperties = {
  height: "calc(100vh - 52px)",
  maxHeight: "100vh",
  minWidth: "370px",
  overflow: "auto",
};

interface IMainMenuProps {
  // showInputModal: () => void;
  updateNotebookPanel: () => Promise<void>; // Function passed to the var menu
  syncNotebook: () => boolean; // Function passed to the var menu
}

interface IMainMenuState {
  showTemplateDropdown: boolean;
}

const MainMenu = (props: IMainMenuProps): JSX.Element => {
  const app: AppControl = AppControl.getInstance();
  const [varState, varDispatch] = useVariable();
  const [plotState, plotDispatch] = usePlot();
  const [appState, appDispatch] = useApp();
  const [modalState, modalDispatch] = useModal();

  const [state, setState] = useState<IMainMenuState>({
    showTemplateDropdown: false,
  });

  /**
   * @description toggles the varLoaders menu
   */
  const launchVarLoader = async (filePath: string): Promise<void> => {
    // Open the variable launcher modal
    const fileVars: Variable[] = await app.varTracker.getFileVariables(
      filePath
    );
    if (fileVars.length > 0) {
      console.log(fileVars);
      varDispatch(VariableAction.setFileVariables(fileVars));
      modalDispatch(ModalAction.show(VCDAT_MODALS.VarLoader));
    } else {
      NotebookUtilities.showMessage(
        "Notice",
        "No variables could be loaded from the file."
      );
      app.varTracker.currentFile = "";
      return;
    }
  };

  const toggleSavePlotAlert = (): void => {
    appDispatch(AppAction.setSavePlotAlert(false));
    app.labControl.commands.execute("vcdat:refresh-browser");
  };

  const hideExportSuccessAlert = (): void => {
    appDispatch(AppAction.setExportSuccessAlert(false));
  };

  const varMenuProps = {
    syncNotebook: props.syncNotebook,
    updateNotebook: props.updateNotebookPanel,
    varTracker: app.varTracker,
  };

  const filePathModalProps = {
    acceptText: "Open File",
    cancelText: "Cancel",
    modalID: VCDAT_MODALS.FilePathInput,
    inputListHeader: "Saved File Paths",
    inputOptions: app.labControl.settings.getSavedPaths(),
    invalidInputMessage:
      "The path entered is not valid. Make sure it contains an appropriate filename.",
    isValid: (input: string): boolean => {
      const ext: string = Utilities.getExtension(input);
      return input.length > 0 && EXTENSIONS.indexOf(`.${ext}`) >= 0;
    },
    message: "Enter the path and name of the file you wish to open.",
    onModalClose: (input: string, savedInput: string[]): void => {
      console.log(
        "Input modal closed:",
        `Input: ${input}`,
        `Saved Paths: ${savedInput}`
      );
      launchVarLoader(input);
    },
    onSavedOptionsChanged: async (savedPaths: string[]): Promise<void> => {
      await LabControl.getInstance().settings.setSavedPaths(savedPaths);
    },
    placeHolder: "file_path/file.ext",
    title: "Load Variables from Path",
  };

  return (
    <Card style={{ ...centered, ...sidebarOverflow }}>
      <TopButtons app={app} />
      <VarMenu {...varMenuProps} />
      {/* <GraphicsMenu {...graphicsMenuProps} />*/}
      <TemplateMenu
        showDropdown={state.showTemplateDropdown}
        setDropdown={(show: boolean): void => {
          setState({ showTemplateDropdown: show });
        }}
      />
      <div>
        <Alert
          color="info"
          isOpen={appState.savePlotAlert}
          toggle={toggleSavePlotAlert}
        >
          {`Saving ${plotState.plotName}.${plotState.plotFormat} ...`}
          <Spinner color="info" />
        </Alert>
        <Alert
          color="primary"
          isOpen={appState.exportSuccessAlert}
          toggle={hideExportSuccessAlert}
        >
          {`Exported ${plotState.plotName}.${plotState.plotFormat}`}
        </Alert>
      </div>
      <InputModal {...filePathModalProps} />
      <VarLoader
        modalID={VCDAT_MODALS.VarLoader}
        varTracker={app.varTracker}
        loadSelectedVariables={app.codeInjector.loadMultipleVariables}
      />
    </Card>
  );
};

export { MainMenu, IMainMenuProps };
