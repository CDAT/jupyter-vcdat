// Dependencies
import React, { useState } from "react";
import AppControl from "../../modules/AppControl";

// Components
import TopButtons from "./NEW_TopButtons";
import { Alert, Spinner, Card, Button } from "reactstrap";
import { VarMenu } from "./NEW_VarMenu";
import GraphicsMenu from "./NEW_GraphicsMenu";
import TemplateMenu from "./NEW_TemplateMenu";
import { PLOT_OPTIONS_KEY } from "../../modules/constants";
import NotebookUtilities from "../../modules/Utilities/NotebookUtilities";
import { VCDAT_MODALS } from "../../VCDATWidget";
import VarLoader from "../modals/NEW_VarLoader";
import { usePlot, PlotAction } from "../../modules/contexts/PlotContext";
import { useApp, AppAction } from "../../modules/contexts/AppContext";
import { useModal } from "../../modules/contexts/ModalContext";

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
  const [plotState, plotDispatch] = usePlot();
  const [appState, appDispatch] = useApp();

  const [state, setState] = useState<IMainMenuState>({
    showTemplateDropdown: false,
  });

  const toggleSavePlotAlert = (): void => {
    appDispatch(AppAction.setSavePlotAlert(false));
    app.labControl.commands.execute("vcdat:refresh-browser");
  };

  const hideExportSuccessAlert = (): void => {
    appDispatch(AppAction.setExportSuccessAlert(false));
  };

  const varMenuProps = {
    // codeInjector: app.codeInjector,
    // commands: app.labControl.commands,
    // notebookPanel: app.labControl.notebookPanel,
    /* saveNotebook: (): void => {
      // Save plot options to meta data
      app.labControl.setMetaData(PLOT_OPTIONS_KEY, [
        app.state.overlayPlot,
        app.state.currentDisplayMode,
        app.state.shouldAnimate,
      ]);
      NotebookUtilities.saveNotebook(app.labControl.notebookPanel);
    }, */
    setPlotInfo: (plotname: string, plotFormat: string) => {
      console.log(`Plot name: ${plotname}`, `Plot format: ${plotFormat}`);
    },
    syncNotebook: props.syncNotebook,
    updateNotebook: props.updateNotebookPanel,
    varTracker: app.varTracker,
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
      <VarLoader
        modalID={VCDAT_MODALS.VarLoader}
        varTracker={app.varTracker}
        loadSelectedVariables={app.codeInjector.loadMultipleVariables}
      />
    </Card>
  );
};

export { MainMenu, IMainMenuProps };
