namespace MiscUtilities {
  /**
   * Converts a number to and ordinal shorthand string.
   * Example: 1 => 1st, 2 => 2nd, 5 => 5th, 32 => 32nd etc.
   * @param num
   */
  export function numToOrdStr(num: number): string {
    // Handle the teens
    if (num > 10 && num < 14) {
      return `${num}th`;
    }

    const lastNum: number = num % 10;
    switch (lastNum) {
      case 1:
        return `${num}st`;
      case 2:
        return `${num}nd`;
      case 3:
        return `${num}rd`;
      default:
        return `${num}th`;
    }
  }

  /**
   * Creates a regular expression to use for testing a file's extension
   * @param extensions An array of strings representing valid extensions. The string is used in
   * a regular expression and can contain regex if needed to match more cases. Case is ignored.
   * Example: ['.clt','.nc','.nc3','.nc4'] can also be ['.clt','.nc[34]?']
   * @returns A regular expression that will filter for the specified extensions
   */
  export function filenameFilter(extensions: string[]): RegExp {
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
  export function removeExtension(filename: string): string {
    return filename.replace(/\.[^/.]*$/, "");
  }

  export function createVariableName(
    name: string,
    removeExt: boolean = true
  ): string {
    if (removeExt) {
      name = removeExtension(name);
    }
    return name.replace(/(.*\/.*\/[0-9]*)|(\1[^a-z0-9])/gi, "");
  }
}

namespace ColorFunctions {
  export function isHexColor(hexCol: string): boolean {
    const regex = /^#[0-9a-fA-F]{6}$/i;
    return regex.test(hexCol);
  }

  export function rgbToHexColorStr(RGB: [number, number, number]): string {
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

  export function hexColorStrToRGB(hexColor: string): [number, number, number] {
    if (!isHexColor(hexColor)) {
      return [0, 0, 0];
    }
    const hexCol: string = hexColor.replace("#", "");

    return [
      parseInt(hexCol.substr(0, 2), 16),
      parseInt(hexCol.substr(2, 2), 16),
      parseInt(hexCol.substr(4, 2), 16)
    ];
  }

  export function createGradient(
    numColors: number,
    startColor: string,
    endColor: string
  ): string[] {
    if (!isHexColor(startColor)) {
      startColor = "#000000";
    }

    if (!isHexColor(endColor)) {
      endColor = "#ffffff";
    }

    if (numColors < 1) {
      return [];
    }
    if (numColors == 1) {
      return [startColor];
    }
    if (numColors == 2) {
      return [startColor, endColor];
    }

    const startRGB: [number, number, number] = hexColorStrToRGB(startColor);
    const endRGB: [number, number, number] = hexColorStrToRGB(endColor);
    const interval: [number, number, number] = [0, 0, 0];
    const currColor: [number, number, number] = [0, 0, 0];

    interval[0] = Math.floor((endRGB[0] - startRGB[0]) / (numColors - 1));
    interval[1] = Math.floor((endRGB[1] - startRGB[1]) / (numColors - 1));
    interval[2] = Math.floor((endRGB[2] - startRGB[2]) / (numColors - 1));

    const colors: string[] = new Array<string>();
    colors.push(startColor);

    for (let i: number = 1; i < numColors - 1; i++) {
      currColor[0] = startRGB[0] + interval[0] * i;
      currColor[1] = startRGB[1] + interval[1] * i;
      currColor[2] = startRGB[2] + interval[2] * i;
      colors.push(rgbToHexColorStr(currColor));
    }

    colors.push(endColor);

    return colors;
  }
}

export { MiscUtilities, ColorFunctions };
