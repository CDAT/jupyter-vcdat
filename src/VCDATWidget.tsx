// Dependencies
import { Widget } from "@lumino/widgets";
import React from "react";
import * as ReactDOM from "react-dom";

// Project Components
import ErrorBoundary from "./components/ErrorBoundary";
import { MainMenu, IMainMenuProps } from "./components/menus/NEW_MainMenu";
import AboutPopup from "./components/modals/NEW_AboutPopup";
import { AppProvider, IAppProviderRef } from "./modules/contexts/AppContext";
import LabControl from "./modules/LabControl";
import AppControl from "./modules/AppControl";
import Utilities from "./modules/Utilities/Utilities";
import { EXTENSIONS } from "./modules/constants";
import InputModal from "./components/modals/NEW_InputModal";
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
  public app: AppControl;
  public div: HTMLDivElement; // The div container for this widget
  public appRef: React.RefObject<IAppProviderRef>;

  constructor(rootID: string, app: AppControl) {
    super();
    this.app = app;
    this.div = document.createElement("div");
    this.div.id = rootID;
    this.node.appendChild(this.div);
    this.id = /* @tag<left-side-bar>*/ "left-side-bar-vcdat";
    this.title.iconClass = "jp-SideBar-tabIcon jp-icon-vcdat";
    this.title.closable = true;
    this.appRef = React.createRef();

    this.createCommands();

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
      setPlotInfo: (plotname: string, plotFormat: string) => {
        console.log(`Plot name: ${plotname}`, `Plot format: ${plotFormat}`);
      },
    };

    const inputModalProps = {
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
      },
      onSavedOptionsChanged: async (savedPaths: string[]): Promise<void> => {
        await LabControl.getInstance().settings.setSavedPaths(savedPaths);
      },
      placeHolder: "file_path/file.ext",
      title: "Load Variables from Path",
    };

    ReactDOM.render(
      <ErrorBoundary>
        <AppProvider ref={this.appRef}>
          <MainMenu {...mainMenuProps} />
          <ExportPlotModal {...exportPlotModalProps} />
          <InputModal {...inputModalProps} />
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
        </AppProvider>
      </ErrorBoundary>,
      this.div
    );
  }

  private createCommands(): void {
    const labControl: LabControl = this.app.labControl;
    labControl.addCommand("vcdat:refresh-browser", (): void => {
      labControl.commands.execute("filebrowser:go-to-path", {
        path: ".",
      });
    });

    // Add 'About' page access in help menu
    labControl.addCommand(
      "vcdat-show-about",
      () => {
        this.appRef.current.showModal(VCDAT_MODALS.About);
      },
      "About VCDAT",
      "See the VCDAT about page."
    );
    labControl.helpMenuItem("vcdat-show-about");

    // Test commands
    labControl.addCommand(
      "show-file-input",
      () => {
        this.appRef.current.showModal(VCDAT_MODALS.FilePathInput);
      },
      "File Input"
    );
    labControl.helpMenuItem("show-file-input");

    labControl.addCommand(
      "show-message-popup",
      () => {
        this.appRef.current.showModal(VCDAT_MODALS.LoadingModulesNotice);
      },
      "Loading Message"
    );
    labControl.helpMenuItem("show-message-popup");

    labControl.addCommand(
      "show-export-plot-popup",
      () => {
        this.appRef.current.showModal(VCDAT_MODALS.ExportPlot);
      },
      "Export Plot"
    );
    labControl.helpMenuItem("show-export-plot-popup");

    labControl.addCommand(
      "show-var-loader",
      () => {
        this.appRef.current.showModal(VCDAT_MODALS.VarLoader);
      },
      "Var Loader"
    );
    labControl.helpMenuItem("show-var-loader");
  }
}
