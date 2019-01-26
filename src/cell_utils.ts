import { Cell, ICellModel, isCodeCellModel } from "@jupyterlab/cells";
import { Notebook, NotebookPanel } from "@jupyterlab/notebook";
import { nbformat } from "@jupyterlab/coreutils";
import { CommandRegistry } from "@phosphor/commands";

/** Contains some utility functions for handling notebook cells */
namespace cell_utils {
  /**
   * @description Reads the output at a cell within the specified notebook and returns it as a string
   * @param notebook The notebook to get the cell from
   * @param index The index of the cell to read
   * @returns any - A string value of the cell output from the specified
   * notebook and cell index, or null if there is no output.
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
   * @description Gets the value of a key from the specified cell's metadata.
   * @param notebook_panel The notebook that contains the cell.
   * @param index The index of the cell.
   * @param key The key of the value.
   * @returns any - The value of the metadata. Returns null if the key doesn't exist.
   */
  export function getCellMetaData(
    notebook: Notebook,
    index: number,
    key: string
  ) {
    let msg: string = "Notebook was null!"; // For error tracking
    if (notebook) {
      if (index >= 0 && index < notebook.model.cells.length) {
        let cell: ICellModel = notebook.model.cells.get(index);
        if (cell.metadata.has(key)) {
          return cell.metadata.get(key);
        } else {
          return null;
        }
      } else {
        msg = "Cell index out of range.";
      }
    }
    throw new Error(msg);
  }

  /**
   * @description Sets the key value pair in the notebook's metadata.
   * If the key doesn't exists it will add one.
   * @param notebook_panel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @returns The old value for the key, or undefined if it did not exist.
   */
  export function setCellMetaData(
    notebook: Notebook,
    index: number,
    key: string,
    value: any
  ) {
    let msg: string = "Notebook was null!"; // For error tracking
    if (notebook) {
      if (index >= 0 && index < notebook.model.cells.length) {
        let cell: ICellModel = notebook.model.cells.get(index);
        return cell.metadata.set(key, value);
      } else {
        msg = "Cell index out of range.";
      }
    }
    throw new Error(msg);
  }

  /**
   * @description Gets the cell object at specified index in the notebook.
   * @param notebook The notebook to get the cell from
   * @param index The index for the cell
   * @returns Cell - The cell at specified index, or null if not found
   */
  export function getCell(notebook: Notebook, index: number): ICellModel {
    if (notebook && index >= 0 && index < notebook.model.cells.length) {
      return notebook.model.cells.get(index);
    }
    return null;
  }

  /**
   * @description Runs code in the currently selected cell of the notebook
   * @param command The command registry which can execute the run command.
   * @param notebook The notebook panel to run the cell in
   * @returns Promise<string> - A promise containing the output after the code has executed.
   */
  export async function runCellAtIndex(
    command: CommandRegistry,
    notebook_panel: NotebookPanel,
    index: number
  ): Promise<string> {
    let prom: Promise<string> = new Promise(async (resolve, reject) => {
      if (command && notebook_panel) {
        try {
          await notebook_panel.session.ready;
          let notebook = notebook_panel.content;
          if (index >= 0 && index < notebook.widgets.length) {
            //Save the old index, then set the current active cell
            let oldIndex = notebook.activeCellIndex;
            notebook.activeCellIndex = index;
            try {
              await command.execute("notebook:run-cell");
              let output = readOutput(notebook, index);
              notebook.activeCellIndex = oldIndex;
              resolve(output);
            } catch (error) {
              notebook.activeCellIndex = oldIndex;
              reject(error);
            }
          } else {
            reject(new Error("The index was out of range."));
          }
        } catch (error) {
          reject(error);
        }
      } else {
        reject(
          new Error(
            "Null or undefined parameter was given for command or notebook argument."
          )
        );
      }
    });
    return prom;
  }

  /**
   * @description Deletes the cell at specified index in the open notebook
   * @param notebook_panel The notebook panel to delete the cell from
   * @param index The index that the cell will be deleted at
   * @returns void
   */
  export function deleteCellAtIndex(
    notebook_panel: NotebookPanel,
    index: number
  ): void {
    try {
      if (notebook_panel) {
        let notebook = notebook_panel.content;

        if (index >= 0 && index < notebook.widgets.length) {
          //Save the old index, then set the current active cell
          let oldIndex = notebook.activeCellIndex;
          notebook.model.cells.remove(index);
          //Adjust old index to account for deleted cell.
          if (oldIndex == index) {
            if (oldIndex > 0) {
              oldIndex -= 1;
            } else {
              oldIndex = 0;
            }
          } else if (oldIndex > index) {
            oldIndex -= 1;
          }
          notebook.activeCellIndex = oldIndex;
        } else {
          throw new Error("The index was out of range.");
        }
      } else {
        throw new Error(
          "Null or undefined parameter was given for notebook argument."
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Inserts a cell into the notebook, the new cell will be at the specified index.
   * @param notebook_panel The notebook panel to insert the cell in
   * @param index The index of where the new cell will be inserted.
   * If the cell index is less than or equal to 0, it will be added at the top.
   * If the cell index is greater than the last index, it will be added at the bottom.
   * @returns number - The index it where the cell was inserted
   */
  export function insertCellAtIndex(
    notebook_panel: NotebookPanel,
    index: number
  ): number {
    try {
      let notebook = notebook_panel.content;

      //Create a new cell
      let cell = notebook.model.contentFactory.createCodeCell({});

      //Save the old index, then set the current active cell
      let oldIndex = notebook.activeCellIndex;

      //Adjust old index for cells inserted above active cell.
      if (oldIndex >= index) {
        oldIndex++;
      }
      if (index <= 0) {
        notebook.model.cells.insert(0, cell);
        notebook.activeCellIndex = oldIndex;
        return 0;
      } else if (index >= notebook.widgets.length) {
        notebook.model.cells.insert(notebook.widgets.length - 1, cell);
        notebook.activeCellIndex = oldIndex;
        return notebook.widgets.length - 1;
      } else {
        notebook.model.cells.insert(index, cell);
        notebook.activeCellIndex = oldIndex;
        return index;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Injects code into the specified cell of a notebook, does not run the code.
   * Warning: the existing cell's code/text will be overwritten.
   * @param notebook The notebook to select the cell from
   * @param index The index of the cell to inject the code into
   * @param code A string containing the code to inject into the CodeCell.
   * @throws An error message if there are issues with injecting code at a particular cell
   * @returns void
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
          cell.value.text = code;
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

  /**
   * @description This will insert a new cell at the specified index and the inject the specified code into it.
   * @param notebook The notebook to insert the cell into
   * @param index The index of where the new cell will be inserted.
   * If the cell index is less than or equal to 0, it will be added at the top.
   * If the cell index is greater than the last index, it will be added at the bottom.
   * @param code The code to inject into the cell after it has been inserted
   * @returns number - index of where the cell was inserted
   */
  export function insertInjectCode(
    notebook_panel: NotebookPanel,
    index: number,
    code: string
  ): number {
    try {
      let newIndex = insertCellAtIndex(notebook_panel, index);
      injectCodeAtIndex(notebook_panel.content, newIndex, code);
      return newIndex;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
   * @param command The command registry which can execute the insert command
   * @param notebook_panel The notebook to insert the cell into
   * @param index The index of where the new cell will be inserted and run.
   * If the cell index is less than or equal to 0, it will be added at the top.
   * If the cell index is greater than the last index, it will be added at the bottom.
   * @param code The code to inject into the cell after it has been inserted
   * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
   * @returns Promise<[number, string]> - A promise for when the cell code has executed
   * containing the cell's index and output result
   */
  export async function insertAndRun(
    command: CommandRegistry,
    notebook_panel: NotebookPanel,
    index: number,
    code: string,
    deleteOnError: boolean
  ): Promise<[number, string]> {
    let prom: Promise<[number, string]> = new Promise((resolve, reject) => {
      try {
        let insertionIndex = insertInjectCode(notebook_panel, index, code);
        runCellAtIndex(command, notebook_panel, insertionIndex)
          .then(output => {
            resolve([insertionIndex, output]);
          })
          .catch(error => {
            if (deleteOnError) {
              try {
                deleteCellAtIndex(notebook_panel, insertionIndex);
                reject(error);
              } catch (error) {
                reject(error);
              }
            } else {
              reject(error);
            }
          });
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }

  /**
   * @deprecated Using notebook_utils.sendSimpleKernelRequest or notebook_utils.sendKernelRequest
   * will execute code directly in the kernel without the need to create a cell and delete it.
   * @description This will insert a cell with specified code at the top and run the code.
   * Once the code is run and output received, the cell is deleted, giving back cell's output.
   * If the code results in an error, the injected cell is still deleted but the promise will be rejected.
   * @param command The command registry
   * @param notebook_panel The notebook to run the code in
   * @param code The code to run in the cell
   * @param insertAtEnd True means the cell will be inserted at the bottom
   * @returns Promise<string> - A promise when the cell has been deleted, containing the execution result as a string
   */
  export async function runAndDelete(
    command: CommandRegistry,
    notebook_panel: NotebookPanel,
    code: string,
    insertAtEnd = true
  ): Promise<string> {
    let prom: Promise<string> = new Promise(async (resolve, reject) => {
      let index: number = -1;
      try {
        if (insertAtEnd) {
          index = notebook_panel.content.model.cells.length;
        }
        let result: [number, string] = await insertAndRun(
          command,
          notebook_panel,
          index,
          code,
          true
        );
        deleteCellAtIndex(notebook_panel, result[0]);
        resolve(result[1]);
      } catch (error) {
        reject(error);
      }
    });
    return prom;
  }
}

export { cell_utils };
