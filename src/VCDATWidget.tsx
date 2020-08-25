// Dependencies
import { Widget } from "@lumino/widgets";
import React, { Ref } from "react";
import * as ReactDOM from "react-dom";

// Project Components
import ErrorBoundary from "./components/ErrorBoundary";
import MainMenu, { IMainMenuProps } from "./components/menus/NEW_MainMenu";
import AboutPopup from "./components/modals/NEW_AboutPopup";
import { AppProvider } from "./modules/contexts/AppContext";
import LabControl from "./modules/LabControl";
import AppControl from "./modules/AppControl";
import Utilities from "./modules/Utilities/Utilities";
import { EXTENSIONS } from "./modules/constants";
import InputModal from "./components/modals/NEW_InputModal";
import ExportPlotModal from "./components/modals/ExportPlotModal";
import {
  ModalProvider,
  IModalProviderRef,
} from "./modules/contexts/ModalContext";
import PopUpModal from "./components/modals/NEW_PopUpModal";

/**
 * This is the main component for the vcdat extension.
 */
export default class VCDATWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public showAbout: () => void;
  public showFilePathInput: () => void;
  public showMessagePopup: () => void;

  constructor(rootID: string) {
    super();
    this.div = document.createElement("div");
    this.div.id = rootID;
    this.node.appendChild(this.div);
    const modalProviderRef: Ref<IModalProviderRef> = React.createRef();
    const app: AppControl = AppControl.getInstance();

    this.showFilePathInput = (): void => {
      modalProviderRef.current.dispatch({
        type: "showModal",
        modalID: "filePathInput",
      });
    };

    this.showAbout = (): void => {
      modalProviderRef.current.dispatch({
        type: "showModal",
        modalID: "AboutModal",
      });
    };

    this.showMessagePopup = (): void => {
      modalProviderRef.current.dispatch({
        type: "showModal",
        modalID: "loadingCoreModules",
      });
    };

    const mainMenuProps: IMainMenuProps = {
      showInputModal: this.showFilePathInput,
      syncNotebook: (): boolean => {
        return false;
      },
      updateNotebookPanel: async (): Promise<void> => {
        console.log("Update the notebook!");
      },
    };

    const exportPlotModalProps = {
      codeInjector: app.codeInjector,
      dismissSavePlotSpinnerAlert: (): void => {
        console.log("dismiss spinner");
      },
      exportAlerts: (): void => {
        console.log("export alerts");
      },
      getCanvasDimensions: async (): Promise<{
        height: string;
        width: string;
      }> => {
        return { height: "345px", width: "700px" };
      },
      isOpen: false,
      notebookPanel: app.labControl.notebookPanel,
      setPlotInfo: (plotname: string, plotFormat: string) => {
        console.log(`Plot name: ${plotname}`, `Plot format: ${plotFormat}`);
      },
      showExportSuccessAlert: (): void => {
        console.log("Export success!");
      },
      toggle: () => {
        console.log("Toggle the export modal");
      },
    };

    const inputModalProps = {
      acceptText: "Open File",
      cancelText: "Cancel",
      modalID: "filePathInput",
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
        <AppProvider>
          <MainMenu {...mainMenuProps} />
          <ModalProvider ref={modalProviderRef}>
            <ExportPlotModal {...exportPlotModalProps} />
            <InputModal {...inputModalProps} />
            <PopUpModal
              title="Notice"
              message="Loading CDAT core modules. Please wait..."
              btnText="OK"
              modalID="loadingCoreModules"
            />
            <AboutPopup
              version={LabControl.getInstance().settings.getVersion()}
              modalID="AboutModal"
            />
          </ModalProvider>
        </AppProvider>
      </ErrorBoundary>,
      this.div
    );
  }
}
