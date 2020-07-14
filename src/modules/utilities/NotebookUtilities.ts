// Dependencies
import { Dialog, showDialog } from "@jupyterlab/apputils";
import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@lumino/commands";

/** Contains utility functions for manipulating/handling notebooks in the application. */
export default class NotebookUtilities {
  /**
   * Opens a pop-up dialog in JupyterLab to display a simple message.
   * @param title The title for the message popup
   * @param msg The message
   * @param buttonLabel The label to use for the button. Default is 'OK'
   * @param buttonClassName The classname to give to the 'ok' button
   * @returns Promise<void> - A promise once the message is closed.
   */
  public static async showMessage(
    title: string,
    msg: string,
    buttonLabel = "OK",
    buttonClassName = ""
  ): Promise<void> {
    const buttons: readonly Dialog.IButton[] = [
      Dialog.okButton({ label: buttonLabel, className: buttonClassName }),
    ];
    await showDialog({ title, buttons, body: msg });
  }

  /**
   * Opens a pop-up dialog in JupyterLab to display a yes/no dialog.
   * @param title The title for the message popup
   * @param msg The message
   * @param acceptLabel The label to use for the accept button. Default is 'YES'
   * @param rejectLabel The label to use for the reject button. Default is 'NO'
   * @param yesButtonClassName The classname to give to the accept button.
   * @param noButtonClassName The  classname to give to the cancel button.
   * @returns Promise<void> - A promise once the message is closed.
   */
  public static async showYesNoDialog(
    title: string,
    msg: string,
    acceptLabel = "YES",
    rejectLabel = "NO",
    yesButtonClassName = "",
    noButtonClassName = ""
  ): Promise<boolean> {
    const buttons: readonly Dialog.IButton[] = [
      Dialog.okButton({ label: acceptLabel, className: yesButtonClassName }),
      Dialog.cancelButton({ label: rejectLabel, className: noButtonClassName }),
    ];
    const result = await showDialog({ title, buttons, body: msg });
    if (result.button.label === acceptLabel) {
      return true;
    }
    return false;
  }

  /**
   * @description Creates a new JupyterLab notebook for use by the application
   * @param command The command registry
   * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
   */
  public static async createNewNotebook(
    command: CommandRegistry
  ): Promise<NotebookPanel> {
    const notebook: NotebookPanel = await command.execute(
      "notebook:create-new",
      {
        activate: true,
        path: "",
        preferredLanguage: "",
      }
    );
    await notebook.sessionContext.ready;
    return notebook;
  }

  /**
   * Safely saves the Jupyter notebook document contents to disk
   * @param notebookPanel The notebook panel containing the notebook to save
   */
  public static async saveNotebook(
    notebookPanel: NotebookPanel
  ): Promise<boolean> {
    if (notebookPanel) {
      await notebookPanel.context.ready;
      notebookPanel.context.save();
      return true;
    }
    return false;
  }

  /**
   * @description Gets the value of a key from specified notebook's metadata.
   * This asynchronous version checks the notebook session is ready before getting metadata.
   * If the notebook is null, an error will occur.
   * @param notebookPanel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns Promise<any> - The value of the metadata. Returns null if the key doesn't exist.
   */
  public static async getMetaData(
    notebookPanel: NotebookPanel,
    key: string
  ): Promise<any> {
    if (!notebookPanel) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    await notebookPanel.sessionContext.ready; // Wait for session to load in notebook
    if (notebookPanel.model && notebookPanel.model.metadata.has(key)) {
      return notebookPanel.model.metadata.get(key);
    }
    return null;
  }

  /**
   * @description Gets the value of a key from specified notebook's metadata.
   * @param notebookPanel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns any -The value of the metadata. Returns null if the key doesn't exist.
   */
  public static getMetaDataNow(notebookPanel: NotebookPanel, key: string): any {
    if (!notebookPanel) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    if (notebookPanel.model && notebookPanel.model.metadata.has(key)) {
      return notebookPanel.model.metadata.get(key);
    }
    return null;
  }

  /**
   * @description Sets the key value pair in the notebook's metadata. If the key doesn't exists it will add one.
   * This asynchronous version checks the notebook session is ready before setting the metadata.
   * @param notebookPanel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @param save Default is false. Whether the notebook should be saved after the meta data is set.
   * @returns The old value for the key, or undefined if it did not exist.
   */
  public static async setMetaData(
    notebookPanel: NotebookPanel,
    key: string,
    value: any,
    save = false
  ): Promise<any> {
    if (!notebookPanel) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    await notebookPanel.sessionContext.ready;
    const oldVal: any = notebookPanel.model.metadata.set(key, value);
    if (save) {
      this.saveNotebook(notebookPanel);
    }
    return oldVal;
  }

  /**
   * @description Sets the key value pair in the notebook's metadata.
   * If the key doesn't exists it will add one.
   * @param notebookPanel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @param save Default is false. Whether the notebook should be saved after the meta data is set.
   * Note: This function will not wait for the save to complete, it only sends a save request.
   * @returns The old value for the key, or undefined if it did not exist.
   */
  public static setMetaDataNow(
    notebookPanel: NotebookPanel,
    key: string,
    value: any,
    save = false
  ): any {
    if (!notebookPanel) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    const oldVal = notebookPanel.model.metadata.set(key, value);
    if (save) {
      this.saveNotebook(notebookPanel);
    }
    return oldVal;
  }
}
