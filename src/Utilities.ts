import { MainMenu } from "@jupyterlab/mainmenu";
import { KernelMessage } from "@jupyterlab/services";
import { NotebookPanel } from "@jupyterlab/notebook";
import { JupyterFrontEnd } from "@jupyterlab/application";
import { OUTPUT_RESULT_NAME } from "./constants";
import { checkCDMS2FileOpens } from "./PythonCommands";

export default class Utilities {
  /**
   * Converts a number to and ordinal shorthand string.
   * @param value
   * @returns string - The ordinal short name for a number
   * Example: 1 => 1st, 2 => 2nd, 5 => 5th, 32 => 32nd etc.
   */
  public static numToOrdStr(value: number): string {
    // Handle the teens
    if (value > 10 && value < 14) {
      return `${value}th`;
    }

    // All other numbers
    const lastNum: number = value % 10;
    switch (lastNum) {
      case 1:
        return `${value}st`;
      case 2:
        return `${value}nd`;
      case 3:
        return `${value}rd`;
      default:
        return `${value}th`;
    }
  }

  /**
   * Will return a string of a filename or path with it's extension removed.
   * Example: test.nc => test, test.sdf.tes.nc43534 => test.sdf.tes, test. => test
   * @param filename The filename/path to remove extension from
   */
  public static removeExtension(filename: string): string {
    return filename.replace(/\.[^/.]*$/, "");
  }

  /**
   * Will return the extension of a filename/filepath or empty string.
   * Example: test.nc => "nc", "test.sdf.tes.nc43534" => "nc43534", test. => "" , test => ""
   * @param filename The filename/path to remove extension from
   */
  public static getExtension(filename: string): string {
    const match: string[] = filename.match(/\.[^/.]*$/);
    return match ? match[0].substring(1) : "";
  }

  /**
   * Will return a string of the path with it's filename removed.
   * Example: folder/dir/test.nc => folder/dir/, test.sdf.tes.nc43534 => /
   * @param path The filename/path to remove extension from
   */
  public static removeFilename(path: string): string {
    const regEx: RegExp = /[^\/]+$/;
    return path.replace(regEx, "");
  }

  /**
   * Return the relative file path from source to target (if needed). If an absolute path
   * starting with '/' is passed, then it will be returned directly.
   * Assumes source is a path (with or without a file name) and target has the filename
   * @param source The directory path to start from for traversal, Ex: "dir1/dir2/file"
   * @param target The directory path and filename to seek from source Ex: "dir3/dir1/file2"
   * @return string - Relative path (e.g. "../../style.css") from the source to target, or absolute path
   */
  public static getUpdatedPath(source: string, target: string) {
    // Trim any whitespace that may exist in path
    const cleanSource: string = source.trim();
    const cleanTarget: string = target.trim();

    // Check if it is an absolute path
    if (target[0] === "/") {
      return target; // Leave absolute path alone
    }

    const sourceArr: string[] = Utilities.removeFilename(cleanSource).split(
      "/"
    );
    const targetArr: string[] = cleanTarget.split("/");
    const file: string = targetArr.pop();
    const depth1: number = sourceArr.length;
    const depth2: number = targetArr.length;
    const maxCommon: number = Math.min(depth1, depth2);
    let splitPos: number = 0;

    for (let idx: number = 0; idx < maxCommon; idx += 1) {
      if (sourceArr[idx] === targetArr[idx]) {
        splitPos += 1;
      }
    }

    let relativePath: string = "../".repeat(depth1 - splitPos - 1);
    for (let idx = splitPos; idx < depth2; idx += 1) {
      relativePath += `${targetArr[idx]}/`;
    }

    return relativePath + file;
  }

  /**
   *
   * @param name The file's name/path to convert to variable name
   * @param removeExt Default: true. Whether the extension of the file name should be removed.
   * @returns string - A string that can be safely used as a Python variable name.
   * (alpha numerical characters and underscore, and no numerical prefix)
   * Example (with extension removed): dir1/dir2/1file_12.sdf.ext -> file_12sdf
   */
  public static createValidVarName(
    name: string,
    removeExt: boolean = true
  ): string {
    let newName: string = name;
    if (removeExt) {
      newName = Utilities.removeExtension(newName);
    }
    return newName.replace(/(.*\/(.*\/)*[0-9]*)|([^a-z0-9_])/gi, "");
  }

  /**
   * Converts a python JSON object to an array using JSON parse
   * @param inStr String to convert
   */
  public static strToArray(inStr: string): any[] {
    try {
      const arr: any = JSON.parse(inStr.replace(/^'|'$/g, ""));
      return Array.isArray(arr) ? arr : [];
    } catch (error) {
      return [];
    }
  }

  // Adds a reference link to the help menu in JupyterLab
  public static addHelpReference(
    menu: MainMenu,
    text: string,
    url: string
  ): void {
    // Add item to help menu
    menu.helpMenu.menu.addItem({
      args: { text, url },
      command: "help:open"
    });
  }

  // Adds a button item to the help menu in JupyterLab
  public static addHelpMenuItem(
    menu: MainMenu,
    args: {},
    command: string
  ): void {
    // Add item to help menu
    menu.helpMenu.menu.addItem({
      args,
      command
    });
  }

  public static deepCopy(obj: any): any {
    let copy: any;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" !== typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (let i = 0, len = obj.length; i < len; i += 1) {
        copy[i] = Utilities.deepCopy(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {};
      for (const attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = Utilities.deepCopy(obj[attr]);
        }
      }
      return copy;
    }

    throw new Error("Unable to copy object! Its type isn't supported.");
  }

  // Will try to open a file path in cdms2. Returns true if successful.
  public static async tryFilePath(
    sessionSource: NotebookPanel | JupyterFrontEnd,
    filePath: string
  ): Promise<boolean> {
    try {
      if (sessionSource instanceof NotebookPanel) {
        return (
          (await Utilities.sendSimpleKernelRequest(
            sessionSource,
            checkCDMS2FileOpens(filePath),
            false
          )) === "True"
        );
      }
      return (
        (await Utilities.sendSimpleKernelRequest(
          sessionSource,
          checkCDMS2FileOpens(filePath),
          false
        )) === "True"
      );
    } catch (error) {
      console.error(error);
    }

    return false;
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param sessionSource The source used for the kernel session, can be a notebook or the jupyterlab application
   * @param code The code to run in the kernel, this code needs to evaluate to a variable named 'output'
   * Examples of valid code:
   *  Single line: "output=123+456"
   *  Multilines: "a = [1,2,3]\nb = [4,5,6]\nfor idx, val in enumerate(a):\n\tb[idx]+=val\noutput = b"
   * @param storeHistory Default is false. If true, the code executed will be stored in the kernel's history
   * and the counter which is shown in the cells will be incremented to reflect code was run.
   * @returns Promise<string> - A promise containing the execution results of the code as a string.
   * Or an empty string if there were no results.
   */
  public static async sendSimpleKernelRequest(
    sessionSource: NotebookPanel | JupyterFrontEnd,
    code: string,
    storeHistory: boolean = false
  ): Promise<string> {
    let result: any;
    if (sessionSource instanceof NotebookPanel) {
      // Send request to kernel with pre-filled parameters
      result = await Utilities.sendKernelRequest(
        sessionSource,
        code,
        { result: OUTPUT_RESULT_NAME },
        false,
        storeHistory,
        false,
        false
      );
    } else {
      // Send request to kernel with pre-filled parameters
      result = await Utilities.sendAppKernelRequest(
        sessionSource,
        code,
        { result: OUTPUT_RESULT_NAME },
        false,
        storeHistory,
        false,
        false
      );
    }

    // Get results from the request for validation
    const output: any = result.result;

    if (!output || output.data === undefined) {
      // Output was empty
      return "";
    }

    // Output has data, return it
    const execResult: string = output.data["text/plain"];
    return execResult;
  }

  /**
   * @description This function runs code directly in the notebook's kernel and then evaluates the
   * result and returns it as a promise.
   * @param notebookPanel The notebook to run the code in.
   * @param runCode The code to run in the kernel.
   * @param userExpressions The expressions used to capture the desired info from the executed code.
   * @param runSilent Default is false. If true, kernel will execute as quietly as possible.
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
  public static async sendKernelRequest(
    notebookPanel: NotebookPanel,
    runCode: string,
    userExpressions: any,
    runSilent: boolean = false,
    storeHistory: boolean = false,
    allowStdIn: boolean = false,
    stopOnError: boolean = false
  ): Promise<any> {
    // Check notebook panel is ready
    if (notebookPanel === null) {
      throw new Error("The notebook is null or undefined.");
    }

    // Wait for kernel to be ready before sending request
    await notebookPanel.activated;
    await notebookPanel.session.ready;
    await notebookPanel.session.kernel.ready;

    const message: KernelMessage.IShellMessage = await notebookPanel.session.kernel.requestExecute(
      {
        allow_stdin: allowStdIn,
        code: runCode,
        silent: runSilent,
        stop_on_error: stopOnError,
        store_history: storeHistory,
        user_expressions: userExpressions
      }
    ).done;

    const content: any = message.content;

    if (content.status !== "ok") {
      // If cdat is requesting user input, return nothing
      if (
        content.status === "error" &&
        content.ename === "StdinNotImplementedError"
      ) {
        return "";
      }

      // If response is not 'ok', throw contents as error, log code
      const msg: string = `Code caused an error:\n${runCode}`;
      console.error(msg);
      throw content;
    }
    // Return user_expressions of the content
    return content.user_expressions;
  }

  /**
   * @description This function starts a kernel in Jupyter lab and then evaluates the
   * result and returns it as a promise.
   * @param app The jupyter lab frontend object
   * @param runCode The code to run in the kernel.
   * @param userExpressions The expressions used to capture the desired info from the executed code.
   * @param runSilent Default is false. If true, kernel will execute as quietly as possible.
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
  public static async sendAppKernelRequest(
    app: JupyterFrontEnd,
    runCode: string,
    userExpressions: any,
    runSilent: boolean = false,
    storeHistory: boolean = false,
    allowStdIn: boolean = false,
    stopOnError: boolean = false
  ): Promise<any> {
    // Use service manager, wait for it to be ready
    await app.serviceManager.sessions.ready;

    // Start session and wait for it to be ready
    const session = await app.serviceManager.sessions.startNew({ path: "" });
    await session.kernel.ready;

    // Send message to kernel
    const message = await session.kernel.requestExecute({
      allow_stdin: allowStdIn,
      code: runCode,
      silent: runSilent,
      stop_on_error: stopOnError,
      store_history: storeHistory,
      user_expressions: userExpressions
    }).done;

    const content: any = message.content;

    if (content.status !== "ok") {
      // If cdat is requesting user input, return nothing
      if (
        content.status === "error" &&
        content.ename === "StdinNotImplementedError"
      ) {
        return "";
      }

      // If response is not 'ok', throw contents as error, log code
      const msg: string = `Code caused an error:\n${runCode}`;
      console.error(msg);
      throw content;
    }

    // Close the session once it's done
    session.shutdown();

    // Return user_expressions of the content
    return content.user_expressions;
  }
}
