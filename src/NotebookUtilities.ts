import { NotebookPanel } from "@jupyterlab/notebook";
import { CommandRegistry } from "@phosphor/commands";
import { KernelMessage } from "@jupyterlab/services";
import { Dialog, showDialog } from "@jupyterlab/apputils";

/** Contains utility functions for manipulating/handling notebooks in the application. */
namespace NotebookUtilities {
  /**
   * Opens a pop-up dialog in JupyterLab to display a simple message.
   * @param title The title for the message popup
   * @param msg The message
   * @param buttonLabel The label to use for the button. Default is 'OK'
   * @returns Promise<void> - A promise once the message is closed.
   */
  export async function showMessage(
    title: string,
    msg: string,
    buttonLabel: string = "OK"
  ): Promise<void> {
    let buttons: ReadonlyArray<Dialog.IButton> = [
      Dialog.okButton({ label: buttonLabel })
    ];
    return showDialog({ title: title, body: msg, buttons: buttons }).then(
      () => {}
    );
  }

  /**
   * @description Creates a new JupyterLab notebook for use by the application
   * @param command The command registry
   * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
   */
  export async function createNewNotebook(
    command: CommandRegistry
  ): Promise<NotebookPanel> {
    let notebook: any = await command.execute("notebook:create-new", {
      activate: true,
      path: "",
      preferredLanguage: ""
    });
    await notebook.session.ready;
    return notebook;
  }

  /**
   * @description Gets the value of a key from specified notebook's metadata.
   * This asynchronous version checks the notebook session is ready before getting metadata.
   * If the notebook is null, an error will occur.
   * @param notebookPanel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns Promise<any> - The value of the metadata. Returns null if the key doesn't exist.
   */
  export async function getMetaData(
    notebookPanel: NotebookPanel,
    key: string
  ): Promise<any> {
    if (notebookPanel == null) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    await notebookPanel.activated;
    await notebookPanel.session.ready;
    if (notebookPanel.content.model.metadata.has(key)) {
      return notebookPanel.content.model.metadata.get(key);
    } else {
      return null;
    }
  }

  /**
   * @description Gets the value of a key from specified notebook's metadata.
   * @param notebookPanel The notebook to get meta data from.
   * @param key The key of the value.
   * @returns any -The value of the metadata. Returns null if the key doesn't exist.
   */
  export function getMetaDataNow(
    notebookPanel: NotebookPanel,
    key: string
  ): any {
    if (notebookPanel == null) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    if (notebookPanel.content.model.metadata.has(key)) {
      return notebookPanel.content.model.metadata.get(key);
    } else {
      return null;
    }
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
  export async function setMetaData(
    notebookPanel: NotebookPanel,
    key: string,
    value: any,
    save: boolean = false
  ): Promise<any> {
    if (notebookPanel == null) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    await notebookPanel.session.ready;
    let oldVal: any = notebookPanel.content.model.metadata.set(key, value);
    if (save) {
      await notebookPanel.context.save();
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
  export function setMetaDataNow(
    notebookPanel: NotebookPanel,
    key: string,
    value: any,
    save: boolean = false
  ): any {
    let oldVal = notebookPanel.content.model.metadata.set(key, value);
    if (save) {
      notebookPanel.context.save();
    }
    return oldVal;
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param notebookPanel The notebook to run the code in
   * @param code The code to run in the kernel, this code needs to evaluate to a variable named 'output'
   * Examples of valid code:
   *  Single line: "output=123+456"
   *  Multilines: "a = [1,2,3]\nb = [4,5,6]\nfor idx, val in enumerate(a):\n\tb[idx]+=val\noutput = b"
   * @param storeHistory Default is false. If true, the code executed will be stored in the kernel's history
   * and the counter which is shown in the cells will be incremented to reflect code was run.
   * @returns Promise<string> - A promise containing the execution results of the code as a string.
   * Or an empty string if there were no results.
   */
  export async function sendSimpleKernelRequest(
    notebookPanel: NotebookPanel,
    code: string,
    storeHistory: boolean = false
  ): Promise<string> {
    // Send request to kernel with pre-filled parameters
    let result: any = await sendKernelRequest(
      notebookPanel,
      code,
      { result: "output" },
      false,
      storeHistory,
      false,
      false
    );

    // Get results from the request for validation
    let output: any = result["result"];

    if (output == null || output.data == undefined) {
      //Output was empty
      return "";
    }

    //Output has data, return it
    let execResult: string = output["data"]["text/plain"];
    return execResult;
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param notebookPanel The notebook to run the code in.
   * @param code The code to run in the kernel.
   * @param userExpressions The expressions used to capture the desired info from the executed code.
   * @param silent Default is false. If true, kernel will execute as quietly as possible.
   * store_history will be set to false, and no broadcast on IOPUB channel will be made.
   * @param storeHistory Default is false. If true, the code executed will be stored in the kernel's history
   * and the counter which is shown in the cells will be incremented to reflect code was run.
   * @param allowStdIn Default is false. If true, code running in kernel can prompt user for input using
   * an input_request message.
   * @param stopOnError Default is false. If True, does not abort the execution queue, if an exception is encountered.
   * This allows the queued execution of multiple execute_requests, even if they generate exceptions.
   * @returns Promise<any> - A promise containing the execution results of the code as an object with
   * keys based on the user_expressions.
   * @example
   * //The code
   * const code = "a=123\nb=456\nsum=a+b";
   * //The user expressions
   * const expr = {sum: "sum",prod: "a*b",args:"[a,b,sum]"};
   * //Async function call (returns a promise)
   * sendKernelRequest(notebookPanel, code, expr,false);
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
    notebookPanel: NotebookPanel,
    code: string,
    userExpressions: any,
    silent: boolean = false,
    storeHistory: boolean = false,
    allowStdIn: boolean = false,
    stopOnError: boolean = false
  ): Promise<any> {
    // Check notebook panel is ready
    if (notebookPanel == null) {
      throw new Error(
        "The notebook is null or undefined. No meta data available."
      );
    }
    // Wait for kernel to be ready before sending request
    await notebookPanel.activated;
    await notebookPanel.session.ready;
    await notebookPanel.session.kernel.ready;
    let message: KernelMessage.IShellMessage = await notebookPanel.session.kernel.requestExecute(
      {
        code: code,
        silent: silent,
        store_history: storeHistory,
        user_expressions: userExpressions,
        allow_stdin: allowStdIn,
        stop_on_error: stopOnError
      }
    ).done;

    let content: any = message.content;

    if (content["status"] != "ok") {
      throw content; // If response is not 'ok', throw response contents as error
    }
    // Return user_expressions of the content
    return content.user_expressions;
  }
}

export { NotebookUtilities };
