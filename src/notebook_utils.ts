import { Notebook, NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";

/** Contains utility functions for manipulating/handling notebooks in the application. */
namespace notebook_utils {
  /**
   * Creates a new JupyterLab notebook for use by the application
   * @param command The command registry
   * @returns A promise containing the notebook panel object that was created (if successful).
   */
  export function createNewNotebook(
    command: CommandRegistry
  ): Promise<NotebookPanel> {
    let prom: Promise<NotebookPanel> = new Promise((resolve, reject) => {
      command
        .execute("notebook:create-new", {
          activate: true,
          path: "",
          preferredLanguage: ""
        })
        .then(notebook => {
          notebook.session.ready.then(() => {
            resolve(notebook);
          });
        })
        .catch(error => {
          reject(error);
        });
    });
    return prom;
  }

  /**
   * Gets the value of a key from specified notebook's metadata. Returns null if the key doesn't exist.
   * Checks the notebook session is ready before getting the metadata.
   * @param notebook_panel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns The value of the metadata.
   */
  export function getMetaData(
    notebook_panel: NotebookPanel,
    key: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      notebook_panel.session.ready
        .then(() => {
          if (notebook_panel.content.model.metadata.has(key)) {
            resolve(notebook_panel.content.model.metadata.get(key));
          } else {
            return resolve(null);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Sets the key value pair in the notebook's metadata. If the key doesn't exists it will add one.
   * Checks the notebook session is ready before getting the metadata.
   * @param notebook_panel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @returns The old value for the key, or undefined if it did not exist.
   */
  export function setMetaData(
    notebook_panel: NotebookPanel,
    key: string,
    value: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      notebook_panel.session.ready
        .then(() => {
          resolve(notebook_panel.content.model.metadata.set(key, value));
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

export { notebook_utils };
