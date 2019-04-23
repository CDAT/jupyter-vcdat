export class MiscUtilities {
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
    const sourceArr: string[] = MiscUtilities.removeFilename(source).split("/");
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
    if (removeExt) {
      name = MiscUtilities.removeExtension(name);
    }
    return name.replace(/(.*\/(.*\/)*[0-9]*)|([^a-z0-9_])/gi, "");
  }
}

export class ColorFunctions {
  public static isHexColor(hexCol: string): boolean {
    const regex = /^#[0-9a-fA-F]{6}$/i;
    return regex.test(hexCol);
  }

  public static rgbToHexColorStr(RGB: [number, number, number]): string {
    let str: string = "";
    RGB.forEach(val => {
      switch (true) {
        case val < 0:
          str += "00";
          break;
        case val < 16:
          str += `0${val.toString(16)}`;
          break;
        case val > 255:
          str += "ff";
          break;
        default:
          str += val.toString(16);
      }
    });

    return `#${str}`;
  }

  public static hexColorStrToRGB(hexColor: string): [number, number, number] {
    if (!ColorFunctions.isHexColor(hexColor)) {
      return [0, 0, 0];
    }
    const hexCol: string = hexColor.replace("#", "");

    return [
      parseInt(hexCol.substr(0, 2), 16),
      parseInt(hexCol.substr(2, 2), 16),
      parseInt(hexCol.substr(4, 2), 16)
    ];
  }

  public static createGradient(
    numColors: number,
    startColor: string,
    endColor: string
  ): string[] {
    let firstCol: string = startColor;
    let lastCol: string = endColor;
    if (!ColorFunctions.isHexColor(startColor)) {
      firstCol = "#000000";
    }

    if (!ColorFunctions.isHexColor(endColor)) {
      lastCol = "#ffffff";
    }

    if (numColors < 1) {
      return [];
    }
    if (numColors === 1) {
      return [firstCol];
    }
    if (numColors === 2) {
      return [firstCol, lastCol];
    }

    const startRGB: [number, number, number] = ColorFunctions.hexColorStrToRGB(
      firstCol
    );
    const endRGB: [number, number, number] = ColorFunctions.hexColorStrToRGB(
      lastCol
    );
    const interval: [number, number, number] = [0, 0, 0];
    const currColor: [number, number, number] = [0, 0, 0];

    interval[0] = Math.floor((endRGB[0] - startRGB[0]) / (numColors - 1));
    interval[1] = Math.floor((endRGB[1] - startRGB[1]) / (numColors - 1));
    interval[2] = Math.floor((endRGB[2] - startRGB[2]) / (numColors - 1));

    const colors: string[] = new Array<string>();
    colors.push(firstCol);

    for (let i: number = 1; i < numColors - 1; i += 1) {
      currColor[0] = startRGB[0] + interval[0] * i;
      currColor[1] = startRGB[1] + interval[1] * i;
      currColor[2] = startRGB[2] + interval[2] * i;
      colors.push(ColorFunctions.rgbToHexColorStr(currColor));
    }

    colors.push(lastCol);

    return colors;
  }
}
