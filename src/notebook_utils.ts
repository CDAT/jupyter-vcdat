import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { KernelMessage } from "@jupyterlab/services";

/** Contains utility functions for manipulating/handling notebooks in the application. */
namespace notebook_utils {
  /**
   * @description Creates a new JupyterLab notebook for use by the application
   * @param command The command registry
   * @returns A promise containing the notebook panel object that was created (if successful).
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
   * @description Gets the value of a key from specified notebook's metadata. Returns null if the key doesn't exist.
   * Checks the notebook session is ready before getting the metadata.
   * @param notebook_panel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns The value of the metadata.
   */
  export async function getMetaData(
    notebook_panel: NotebookPanel,
    key: string
  ): Promise<any> {
    let prom: Promise<any> = new Promise(async (resolve, reject) => {
      try {
        await notebook_panel.session.ready;
        if (notebook_panel.content.model.metadata.has(key)) {
          resolve(notebook_panel.content.model.metadata.get(key));
        } else {
          return resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  /**
   * @description Sets the key value pair in the notebook's metadata. If the key doesn't exists it will add one.
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
    let prom: Promise<any> = new Promise(async (resolve, reject) => {
      try {
        await notebook_panel.session.ready;
        resolve(notebook_panel.content.model.metadata.set(key, value));
      } catch (error) {
        reject(error);
      }
    });
    return prom;
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
              user_expressions: { result: "output" },
              store_history: store_history
            }
          ).done;
          let content: any = message.content;
          if (content["status"] == "ok") {
            let output = content["user_expressions"]["result"];
            if (output) {
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
   * @param store_history Default is false. If true, the code executed will be stored in the kernel's history
   * and the counter which is shown in the cells will be incremented to reflect code was run.
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
    store_history: boolean = false
  ): Promise<any> {
    let prom: Promise<any> = new Promise(async (resolve, reject) => {
      // Check notebook panel is ready
      if (notebook_panel) {
        try {
          // Wait for kernel to be ready before sending request
          await notebook_panel.session.ready;
          await notebook_panel.session.kernel.ready;
          let message: KernelMessage.IShellMessage = await notebook_panel.session.kernel.requestExecute(
            {
              code: code,
              user_expressions: user_expressions,
              store_history: store_history
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
