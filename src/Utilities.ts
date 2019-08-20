import { MainMenu } from "@jupyterlab/mainmenu";

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
   * Return the relative file path from source to target.
   * Assumes source is a path (with or without a file name) and target has the filename
   * @param source The directory path to start from for traversal, Ex: "dir1/dir2/file"
   * @param target The directory path and filename to seek from source Ex: "dir3/dir1/file2"
   * @return string - Relative path (e.g. "../../style.css") from the source to target
   */
  public static getRelativePath(source: string, target: string) {
    const sourceArr: string[] = Utilities.removeFilename(source).split("/");
    const targetArr: string[] = target.split("/");
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
   * Converts a string to an array of strings using JSON parse
   * @param inStr String to convert
   */
  public static strToArray(inStr: string): any[] {
    return JSON.parse(inStr.replace(/^'|'$/g, ""));
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
}
