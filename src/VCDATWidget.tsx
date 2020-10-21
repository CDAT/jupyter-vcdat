// Dependencies
import { Widget } from "@lumino/widgets";
import React from "react";
import * as ReactDOM from "react-dom";

// Project Components
import ErrorBoundary from "./components/ErrorBoundary";
import { MainMenu, IMainMenuProps } from "./components/menus/NEW_MainMenu";
import AboutPopup from "./components/modals/NEW_AboutPopup";
import { MainProvider, IAppProviderRef } from "./modules/contexts/MainContext";
import LabControl from "./modules/LabControl";
import AppControl from "./modules/AppControl";
import ExportPlotModal from "./components/modals/NEW_ExportPlotModal";
import PopUpModal from "./components/modals/NEW_PopUpModal";

/**
 * This lists out the modal dialogs used by vcdat with their unique IDs.
 * Use the ids to open and close the appropriate modal.
 */
export enum VCDAT_MODALS {
  About = "about-modal-vcdat",
  ExportPlot = "export-plot-modal-vcdat",
  FilePathInput = "file-path-input-modal-vcdat",
  VarLoader = "var-loader-modal-vcdat",
  LoadingModulesNotice = "loading-modules-notice-vcdat",
}

/**
 * This is the main component for the vcdat extension.
 */
export default class VCDATWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public appRef: React.RefObject<IAppProviderRef>;

  constructor(rootID: string) {
    super();
    this.div = document.createElement("div");
    this.div.id = rootID;
    this.node.appendChild(this.div);
    this.id = /* @tag<left-side-bar>*/ "left-side-bar-vcdat";
    this.title.iconClass = "jp-SideBar-tabIcon jp-icon-vcdat";
    this.title.closable = true;
    this.appRef = React.createRef();
  }

  public initialize(): void {
    const app = AppControl.getInstance();

    const mainMenuProps: IMainMenuProps = {
      syncNotebook: (): boolean => {
        return false;
      },
      updateNotebookPanel: async (): Promise<void> => {
        console.log("Update the notebook!");
      },
    };

    const exportPlotModalProps = {
      app,
      modalID: VCDAT_MODALS.ExportPlot,
      getCanvasDimensions: async (): Promise<{
        height: string;
        width: string;
      }> => {
        return { height: "345px", width: "700px" };
      },
    };

    ReactDOM.render(
      <ErrorBoundary>
        <MainProvider ref={this.appRef}>
          <MainMenu {...mainMenuProps} />
          <ExportPlotModal {...exportPlotModalProps} />
          <PopUpModal
            title="Notice"
            message="Loading CDAT core modules. Please wait..."
            btnText="OK"
            modalID={VCDAT_MODALS.LoadingModulesNotice}
          />
          <AboutPopup
            modalID={VCDAT_MODALS.About}
            version={LabControl.getInstance().settings.getVersion()}
          />
        </MainProvider>
      </ErrorBoundary>,
      this.div
    );
  }
}
