import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { KernelMessage } from "@jupyterlab/services";

/** Contains utility functions for manipulating/handling notebooks in the application. */
namespace notebook_utils {
  /**
   * @description Creates a new JupyterLab notebook for use by the application
   * @param command The command registry
   * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
   */
  export async function createNewNotebook(
    command: CommandRegistry
  ): Promise<NotebookPanel> {
    let prom: Promise<NotebookPanel> = new Promise(async (resolve, reject) => {
      try {
        let notebook: any = await command.execute("notebook:create-new", {
          activate: true,
          path: "",
          preferredLanguage: ""
        });
        await notebook.session.ready;
        resolve(notebook);
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  /**
   * @description Gets the value of a key from specified notebook's metadata.
   * This asynchronous version checks the notebook session is ready before getting metadata.
   * If the notebook is null, an error will occur.
   * @param notebook_panel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns any - The value of the metadata. Returns null if the key doesn't exist.
   */
  export async function getMetaData(
    notebook_panel: NotebookPanel,
    key: string
  ): Promise<any> {
    let prom: Promise<any> = new Promise(async (resolve, reject) => {
      try {
        if (notebook_panel) {
          await notebook_panel.activated;
          await notebook_panel.session.ready;
          if (notebook_panel.content.model.metadata.has(key)) {
            resolve(notebook_panel.content.model.metadata.get(key));
          } else {
            resolve(null);
          }
        } else {
          reject(
            new Error(
              "The notebook is null or undefined. No meta data available."
            )
          );
        }
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  /**
   * @description Gets the value of a key from specified notebook's metadata.
   * @param notebook_panel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns any -The value of the metadata. Returns null if the key doesn't exist.
   */
  export function getMetaDataNow(
    notebook_panel: NotebookPanel,
    key: string
  ): any {
    try {
      if (notebook_panel.content.model.metadata.has(key)) {
        return notebook_panel.content.model.metadata.get(key);
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Sets the key value pair in the notebook's metadata. If the key doesn't exists it will add one.
   * This asynchronous version checks the notebook session is ready before setting the metadata.
   * @param notebook_panel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @param save Default is false. Whether the notebook should be saved after the meta data is set.
   * @returns The old value for the key, or undefined if it did not exist.
   */
  export function setMetaData(
    notebook_panel: NotebookPanel,
    key: string,
    value: any,
    save: boolean = false
  ): Promise<any> {
    let prom: Promise<any> = new Promise(async (resolve, reject) => {
      try {
        await notebook_panel.session.ready;
        let old_val: any = notebook_panel.content.model.metadata.set(
          key,
          value
        );
        if (save) {
          await notebook_panel.context.save().catch(error => {
            reject(error);
          });
        }
        resolve(old_val);
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  /**
   * @description Sets the key value pair in the notebook's metadata.
   * If the key doesn't exists it will add one.
   * @param notebook_panel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @param save Default is false. Whether the notebook should be saved after the meta data is set.
   * Note: This function will not wait for the save to complete, it only sends a save request.
   * @returns The old value for the key, or undefined if it did not exist.
   */
  export function setMetaDataNow(
    notebook_panel: NotebookPanel,
    key: string,
    value: any,
    save: boolean = false
  ): any {
    try {
      let old_val = notebook_panel.content.model.metadata.set(key, value);
      if (save) {
        notebook_panel.context.save().catch(error => {
          throw error;
        });
      }
      return old_val;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param notebook_panel The notebook to run the code in
   * @param code The code to run in the kernel, this code needs to evaluate to a variable named 'output'
   * Examples of valid code:
   *  Single line: "output=123+456"
   *  Multilines: "a = [1,2,3]\nb = [4,5,6]\nfor idx, val in enumerate(a):\n\tb[idx]+=val\noutput = b"
   * @param store_history Default is false. If true, the code executed will be stored in the kernel's history
   * and the counter which is shown in the cells will be incremented to reflect code was run.
   * @returns Promise<string> - A promise containing the execution results of the code as a string.
   * Or an empty string if there were no results.
   */
  export async function sendSimpleKernelRequest(
    notebook_panel: NotebookPanel,
    code: string,
    store_history: boolean = false
  ): Promise<string> {
    let prom: Promise<string> = new Promise(async (resolve, reject) => {
      // Check notebook panel is ready
      if (notebook_panel) {
        try {
          // Wait for kernel to be ready before sending request
          await notebook_panel.session.ready;
          await notebook_panel.session.kernel.ready;
          let message: KernelMessage.IShellMessage = await notebook_panel.session.kernel.requestExecute(
            {
              code: code,
              silent: false,
              store_history: store_history,
              user_expressions: { result: "output" },
              allow_stdin: false,
              stop_on_error: false
            }
          ).done;
          
          let content: any = message.content;
          if (content["status"] == "ok") {
            let output = content["user_expressions"]["result"];
            if (output && output.data !== undefined) {
              //Output has data
              let execResult: string = output["data"]["text/plain"];
              resolve(execResult);
            } else {
              //Output was empty
              resolve("");
            }
          } else {
            reject(content);
          }
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error("The notebook panel is null or undefined."));
      }
    });
    return prom;
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param notebook_panel The notebook to run the code in.
   * @param code The code to run in the kernel.
   * @param user_expressions The expressions used to capture the desired info from the executed code.
   * @param silent Default is false. If true, kernel will execute as quietly as possible.
   * store_history will be set to false, and no broadcast on IOPUB channel will be made.
   * @param store_history Default is false. If true, the code executed will be stored in the kernel's history
   * and the counter which is shown in the cells will be incremented to reflect code was run.
   * @param allow_stdin Default is false. If true, code running in kernel can prompt user for input using
   * an input_request message.
   * @param stop_on_error Default is false. If True, does not abort the execution queue, if an exception is encountered.
   * This allows the queued execution of multiple execute_requests, even if they generate exceptions.
   * @returns Promise<any> - A promise containing the execution results of the code as an object with
   * keys based on the user_expressions.
   * @example
   * //The code
   * const code = "a=123\nb=456\nsum=a+b";
   * //The user expressions
   * const expr = {sum: "sum",prod: "a*b",args:"[a,b,sum]"};
   * //Async function call (returns a promise)
   * sendKernelRequest(notebook_panel, code, expr,false);
   * //Result when promise resolves:
   * {
   *  sum:{status:"ok",data:{"text/plain":"579"},metadata:{}},
   *  prod:{status:"ok",data:{"text/plain":"56088"},metadata:{}},
   *  args:{status:"ok",data:{"text/plain":"[123, 456, 579]"}}
   * }
   * @see For more information on JupyterLab messages:
   * https://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results
   */
  export async function sendKernelRequest(
    notebook_panel: NotebookPanel,
    code: string,
    user_expressions: any,
    silent: boolean = false,
    store_history: boolean = false,
    allow_stdin: boolean = false,
    stop_on_error: boolean = false
  ): Promise<any> {
    let prom: Promise<any> = new Promise(async (resolve, reject) => {
      // Check notebook panel is ready
      if (notebook_panel) {
        try {
          // Wait for kernel to be ready before sending request
          await notebook_panel.activated;
          await notebook_panel.session.ready;
          await notebook_panel.session.kernel.ready;
          let message: KernelMessage.IShellMessage = await notebook_panel.session.kernel.requestExecute(
            {
              code: code,
              silent: silent,
              store_history: store_history,
              user_expressions: user_expressions,
              allow_stdin: allow_stdin,
              stop_on_error: stop_on_error
            }
          ).done;
          let content: any = message.content;
          if (content["status"] == "ok") {
            resolve(content.user_expressions);
          } else {
            reject(content);
          }
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error("The notebook panel is null or undefined."));
      }
    });
    return prom;
  }
}

export { notebook_utils };
