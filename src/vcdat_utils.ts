import { Cell, ICellModel, isCodeCellModel, CodeCell } from "@jupyterlab/cells";
import { Notebook, NotebookActions } from "@jupyterlab/notebook";
import { nbformat } from "@jupyterlab/coreutils";
import { func } from "prop-types";
import { CommandRegistry } from "@phosphor/commands";

/** Contains some utility functions for core vCDAT functionality */
export namespace vCDAT_UTILS {
  /**
   * Reads the output at a cell within the specified notebook and returns it as a string
   * @param notebook The notebook to get the cell from
   * @param index The index of the cell to read
   * @returns A string value of the cell output from the specified notebook and cell index, or null if there is no output.
   * @throws An error message if there are issues in getting the output
   */
  export function readOutput(notebook: Notebook, index: number): any {
    let msg: string = ""; // For error tracking
    if (notebook) {
      if (index >= 0 && index < notebook.model.cells.length) {
        let cell: ICellModel = notebook.model.cells.get(index);
        if (isCodeCellModel(cell)) {
          let codeCell = cell;
          if (codeCell.outputs.length < 1) {
            return null;
          } else {
            let out = codeCell.outputs.toJSON().pop();
            if (nbformat.isExecuteResult(out)) {
              let exec_data: nbformat.IExecuteResult = out;
              return exec_data.data["text/plain"];
            } else {
              msg = "The cell output is not expected format.";
            }
          }
        } else {
          msg = "cell is not a code cell.";
        }
      } else {
        msg = "Cell index out of range.";
      }
    }
    throw new Error(msg);
  }

  /**
   * Gets the cell object at specified index in the notebook
   * @param notebook The notebook to get the cell from
   * @param index The index for the cell
   * @returns The cell at specified index
   */
  export function getCell(notebook: Notebook, index: number): Cell {
    if (notebook && index >= 0 && index < notebook.widgets.length) {
      return notebook.widgets[index];
    }
    return null;
  }

  /**
   * Gets the index of the currently selected cell in a notebook
   * @param notebook The notebook to get the active cell index from
   */
  export function selectedCellIndex(notebook: Notebook): number {
    if (notebook) {
      return notebook.widgets.indexOf(notebook.activeCell);
    }
  }

  /**
   * Selects the cell with the specified index within the notebook
   * @param notebook The notebook to select the cell from
   * @param index The index for the cell
   * @returns True if selection was successful, otherwise false.
   */
  export function selectCell(notebook: Notebook, index: number) {
    if (notebook) {
      let cell: Cell = getCell(notebook, index);
      if (cell) {
        notebook.select(cell);
        return true;
      }
    }
    return false;
  }

  export function runSelectCell(command: CommandRegistry, notebook: Notebook) {
    let prom: Promise<string> = new Promise((resolve, reject) => {
      command
        .execute("notebook:run-cell")
        .then(() => {
          let index = selectedCellIndex(notebook);
          let output = readOutput(notebook, index);
          console.log(output);
          resolve(output);
        })
        .catch(error => {
          reject(error);
        });
    });
    return prom;
  }

  /**
   * Injects code into the specified cell of a notebook, does not run the code
   * @param notebook The notebook to select the cell from
   * @param index The index of the cell to inject the code into
   * @param code A string containing the code to inject into the CodeCell.
   */
  export function codeInjectCell(
    notebook: Notebook,
    index: number,
    code: string
  ): void {
    let msg: string = ""; // For error tracking
    if (notebook) {
      //console.log(notebook);
      if (index >= 0 && index < notebook.model.cells.length) {
        let cell: ICellModel = notebook.model.cells.get(index);
        if (isCodeCellModel(cell)) {
          getCell(notebook, index).model.value.text = code;
        } else {
          msg = "Cell is not a code cell.";
        }
      } else {
        msg = "Cell index out of range.";
      }
    } else {
      msg = "Notebook was null or undefined.";
    }
    throw new Error(msg);
  }

  /**
   * Injects code into the currently selected cell of a notebook, does not run the code
   * @param notebook The notebook to select the cell from
   * @param code A string containing the code to inject into the CodeCell.
   */
  export function codeInjectSelectCell(notebook: Notebook, code: string): void {
    let msg: string = ""; // For error tracking
    if (notebook) {
      if(notebook.activeCell){
        notebook.activeCell.model.value.text = code;
        return;
      }
      else{
        msg = "There is no active cell.";
      }
    } else {
      msg = "Notebook was null or undefined.";
    }
    throw new Error(msg);
  }
}

export default { vCDAT_UTILS };
