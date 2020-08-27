// Dependencies
import React, { useRef } from "react";
import AppControl from "../../modules/AppControl";

// Components
import TopButtons from "./NEW_TopButtons";
import { Alert, Spinner, Card, Button } from "reactstrap";
import VarMenu from "./NEW_VarMenu";
import GraphicsMenu from "./NEW_GraphicsMenu";
import TemplateMenu from "./NEW_TemplateMenu";
import { PLOT_OPTIONS_KEY } from "../../modules/constants";
import NotebookUtilities from "../../modules/Utilities/NotebookUtilities";
import {
  ModalProvider,
  IModalProviderRef,
  ModalAction,
  useModal,
} from "../../modules/contexts/ModalContext";
import PopUpModal from "../modals/NEW_PopUpModal";
import { VCDAT_MODALS } from "../../VCDATWidget";

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

export interface IMainMenuProps {
  showInputModal: () => void;
  updateNotebookPanel: () => Promise<void>; // Function passed to the var menu
  syncNotebook: () => boolean; // Function passed to the var menu
}

const MainMenu = (props: IMainMenuProps): JSX.Element => {
  const app: AppControl = AppControl.getInstance();

  const [state, dispatch] = useModal();

  const varMenuProps = {
    codeInjector: app.codeInjector,
    commands: app.labControl.commands,
    dismissSavePlotSpinnerAlert: (): void => {
      console.log("dismiss spinner");
    },
    exportAlerts: (): void => {
      console.log("export alerts");
    },
    notebookPanel: app.labControl.notebookPanel,
    saveNotebook: (): void => {
      // Save plot options to meta data
      app.labControl.setMetaData(PLOT_OPTIONS_KEY, [
        app.state.overlayPlot,
        app.state.currentDisplayMode,
        app.state.shouldAnimate,
      ]);
      NotebookUtilities.saveNotebook(app.labControl.notebookPanel);
    },
    setPlotInfo: (plotname: string, plotFormat: string) => {
      console.log(`Plot name: ${plotname}`, `Plot format: ${plotFormat}`);
    },
    showExportSuccessAlert: (): void => {
      console.log("Export success!");
    },
    showInputModal: props.showInputModal,
    syncNotebook: props.syncNotebook,
    updateNotebook: props.updateNotebookPanel,
    varTracker: app.varTracker,
  };

  const testClick = (): void => {
    dispatch(ModalAction.show("TestPopup"));
  };

  const testOpenAbout = (): void => {
    dispatch(ModalAction.show(VCDAT_MODALS.About));
  };

  return (
    <Card style={{ ...centered, ...sidebarOverflow }}>
      <TopButtons app={app} />
      <Button onClick={testClick}>Testit</Button>
      <Button onClick={testOpenAbout}>Open About</Button>
      <VarMenu {...varMenuProps} />
      {/* <GraphicsMenu {...graphicsMenuProps} />*/}
      {/* <TemplateMenu {...templateMenuProps} />*/}
      <div>
        <Alert color="info" isOpen={null} toggle={null}>
          {
            // `Saving ${this.state.plotName}.${this.state.plotFormat} ...`
          }
          <Spinner color="info" />
        </Alert>
        <Alert color="primary" isOpen={null} toggle={null}>
          {
            // `Exported ${this.state.plotName}.${this.state.plotFormat}`
          }
        </Alert>
      </div>
      <PopUpModal
        modalID="TestPopup"
        title="Test"
        message="Testing..."
        btnText="OK"
      />
    </Card>
  );
};

export default MainMenu;
