export class Utilities {
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
   * Creates a regular expression to use for testing a file's extension
   * @param extensions An array of strings representing valid extensions. The string is used in
   * a regular expression and can contain regex if needed to match more cases. Case is ignored.
   * Example: ['.clt','.nc','.nc3','.nc4'] can also be ['.clt','.nc[34]?']
   * @returns RegExp - A regular expression that will filter for the specified extensions
   */
  public static filenameFilter(extensions: string[]): RegExp {
    let regexStr: string = `.+((${extensions.pop()})`;
    extensions.forEach((ext: string) => {
      regexStr += `|(${ext})`;
    });
    regexStr += ")$";
    return new RegExp(regexStr, "i");
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
  public static strArray(inStr: string): string[] {
    return JSON.parse(inStr.replace(/^'|'$/g, ""));
  }
}