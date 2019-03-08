namespace MiscUtilities {
  /**
   *
   * @param num
   */
  export function numToOrdStr(num: number): string {
    //Handle the teens
    if (num > 10 && num < 14) {
      return `${num}th`;
    }

    let lastNum: number = num % 10;
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
}

export { MiscUtilities };
