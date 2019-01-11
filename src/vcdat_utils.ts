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
    let msg: string = "Notebook was null!"; // For error tracking
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
            } else if (nbformat.isError(out)) {
              let err_data: nbformat.IError = out;
              err_data.evalue;
              msg = `Code resulted in errors. Error name: ${
                err_data.ename
              }.\nMessage: ${err_data.evalue}.`;
            }
            else {
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
   * Runs the currently selected cell of the notebook
   * @param command The command registry which can execute the run command.
   * @param notebook The notebook to run the cell in
   */
  export function runCellAtIndex(
    command: CommandRegistry,
    notebook: Notebook,
    index: number
  ) {
    let prom: Promise<string> = new Promise((resolve, reject) => {
      if (command && notebook) {
        if (index >= 0 && index < notebook.widgets.length) {
          //Save the old index, then set the current active cell
          let oldIndex = notebook.activeCellIndex;
          notebook.activeCellIndex = index;
          command
            .execute("notebook:run-cell")
            .then(() => {
              let output = readOutput(notebook, index);
              notebook.activeCellIndex = oldIndex;
              resolve(output);
            })
            .catch(error => {
              notebook.activeCellIndex = oldIndex;
              reject(error);
            });
        } else {
          reject("The index was out of range.");
        }
      } else {
        reject(
          "Null or undefined parameter was given for command or notebook argument."
        );
      }
    });
    return prom;
  }

  /**
   * Deletes the cell at specified index in the open notebook
   * @param command The command registry which can execute the run command
   */
  export function deleteCellAtIndex(
    command: CommandRegistry,
    notebook: Notebook,
    index: number
  ): Promise<void> {
    let prom: Promise<void> = new Promise((resolve, reject) => {
      if (command && notebook) {
        if (index >= 0 && index < notebook.widgets.length) {
          //Save the old index, then set the current active cell
          let oldIndex = notebook.activeCellIndex;
          notebook.activeCellIndex = index;

          if (oldIndex == index) {
            if (oldIndex > 0) {
              oldIndex -= 1;
            } else {
              oldIndex = 0;
            }
          } else if (oldIndex > index) {
            oldIndex -= 1;
          }

          command
            .execute("notebook:delete-cell")
            .then(() => {
              notebook.activeCellIndex = oldIndex;
              resolve();
            })
            .catch(error => {
              notebook.activeCellIndex = oldIndex;
              reject(error);
            });
        } else {
          reject("The index was out of range.");
        }
      } else {
        reject(
          "Null or undefined parameter was given for command or notebook argument."
        );
      }
    });
    return prom;
  }

  /**
   * Inserts a cell into the notebook, below the specified index.
   * @param command The command registry which can execute the run command
   * @param notebook The notebook to insert the cell in
   * @param index The index of the cell under which the new cell will be inserted, -1 will insert at top.
   */
  export function insertCellBelowIndex(
    command: CommandRegistry,
    notebook: Notebook,
    index: number
  ): Promise<void> {
    let prom: Promise<void> = new Promise((resolve, reject) => {
      if (command && notebook) {
        //Save the old index, then set the current active cell
        let oldIndex = notebook.activeCellIndex;

        //Adjust old index for cells inserted above active cell.
        if (oldIndex > index) {
          oldIndex++;
        }

        if (index <= 0) {
          notebook.activeCellIndex = 0;
          command
            .execute("notebook:insert-cell-below")
            .then(() => {
              notebook.activeCellIndex = oldIndex;
              resolve();
            })
            .catch(error => {
              reject(error);
            });
        } else if (index >= notebook.widgets.length) {
          notebook.activeCellIndex = notebook.widgets.length - 1;
          command
            .execute("notebook:insert-cell-below")
            .then(() => {
              notebook.activeCellIndex = oldIndex;
              resolve();
            })
            .catch(error => {
              reject(error);
            });
        } else {
          notebook.activeCellIndex = index;
          command
            .execute("notebook:insert-cell-below")
            .then(() => {
              notebook.activeCellIndex = oldIndex;
              resolve();
            })
            .catch(error => {
              reject(error);
            });
        }
      } else {
        reject(
          "Null or undefined parameter was given for command or notebook argument."
        );
      }
    });

    return prom;
  }

  /**
   * Injects code into the specified cell of a notebook, does not run the code
   * @param notebook The notebook to select the cell from
   * @param index The index of the cell to inject the code into
   * @param code A string containing the code to inject into the CodeCell.
   */
  export function injectCodeAtIndex(
    notebook: Notebook,
    index: number,
    code: string
  ): void {
    let msg: string = ""; // For error tracking
    if (notebook) {
      if (index >= 0 && index < notebook.model.cells.length) {
        let cell: ICellModel = notebook.model.cells.get(index);
        if (isCodeCellModel(cell)) {
          getCell(notebook, index).model.value.text = code;
          return;
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

  export function runAndDelete(
    command: CommandRegistry,
    notebook: Notebook,
    code: string
  ): Promise<string> {
    let prom: Promise<string> = new Promise((resolve, reject) => {
      let index = notebook.widgets.length;
      insertCellBelowIndex(command, notebook, index)
        .then(() => {
          notebook.widgets[index].hide;
          injectCodeAtIndex(notebook, index, code);
          runCellAtIndex(command, notebook, index)
            .then(output => {
              deleteCellAtIndex(command, notebook, index)
                .then(() => {
                  resolve(output);
                })
                .catch(error => {
                  reject(error);
                });
            })
            .catch(error => {
              deleteCellAtIndex(command, notebook, index).then(()=>{
                reject(error);
              });
            });
        })
        .catch(error => {
          reject(error);
        });
    });
    return prom;
  }

  /**
   * Injects code into the currently selected cell of a notebook, does not run the code
   * @param notebook The notebook to select the cell from
   * @param code A string containing the code to inject into the CodeCell.
   */
  export function codeInjectSelectCell(notebook: Notebook, code: string): void {
    let msg: string = ""; // For error tracking
    if (notebook) {
      if (notebook.activeCell) {
        notebook.activeCell.model.value.text = code;
        return;
      } else {
        msg = "There is no active cell.";
      }
    } else {
      msg = "Notebook was null or undefined.";
    }
    throw new Error(msg);
  }
}

export default { vCDAT_UTILS };
