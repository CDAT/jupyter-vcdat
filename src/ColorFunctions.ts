export default class ColorFunctions {
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

    const colors: string[] = Array<string>();
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
