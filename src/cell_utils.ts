import { ICellModel, isCodeCellModel } from "@jupyterlab/cells";
import { Notebook, NotebookPanel } from "@jupyterlab/notebook";
import { nbformat } from "@jupyterlab/coreutils";
import { CommandRegistry } from "@phosphor/commands";
import { notebook_utils } from "./notebook_utils";

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
    if (notebook == null) {
      throw new Error("Notebook was null!");
    }
    if (index < 0 || index >= notebook.model.cells.length) {
      throw new Error("Cell index out of range.");
    }
    let cell: ICellModel = notebook.model.cells.get(index);
    if (!isCodeCellModel(cell)) {
      throw new Error("cell is not a code cell.");
    }
    if (cell.outputs.length < 1) {
      return null;
    }
    let out = cell.outputs.toJSON().pop();
    if (nbformat.isExecuteResult(out)) {
      let exec_data: nbformat.IExecuteResult = out;
      return exec_data.data["text/plain"];
    }
    if (nbformat.isError(out)) {
      let err_data: nbformat.IError = out;
      err_data.evalue;
      throw new Error(
        `Code resulted in errors. Error name: ${err_data.ename}.\nMessage: ${
          err_data.evalue
        }.`
      );
    }
    throw new Error("The cell output is not expected format.");
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
  ): any {
    if (notebook == null) {
      throw new Error("Notebook was null!");
    }
    if (index < 0 || index >= notebook.model.cells.length) {
      throw new Error("Cell index out of range.");
    }
    let cell: ICellModel = notebook.model.cells.get(index);
    if (cell.metadata.has(key)) {
      return cell.metadata.get(key);
    } else {
      return null;
    }
  }

  /**
   * @description Sets the key value pair in the notebook's metadata.
   * If the key doesn't exists it will add one.
   * @param notebook_panel The notebook to set meta data in.
   * @param key The key of the value to create.
   * @param value The value to set.
   * @param save Default is false. Whether the notebook should be saved after the meta data is set.
   * Note: This function will not wait for the save to complete, it only sends a save request.
   * @returns any - The old value for the key, or undefined if it did not exist.
   */
  export function setCellMetaData(
    notebook_panel: NotebookPanel,
    index: number,
    key: string,
    value: any,
    save: boolean = false
  ): any {
    if (notebook_panel == null) {
      throw new Error("Notebook was null!");
    }
    if (index < 0 || index >= notebook_panel.model.cells.length) {
      throw new Error("Cell index out of range.");
    }
    try {
      let cell: ICellModel = notebook_panel.model.cells.get(index);
      let old_val: any = cell.metadata.set(key, value);
      if (save) {
        notebook_panel.context.save();
      }
      return old_val;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Looks within the notebook for a cell containing the specified meta key
   * @param notebook The notebook to search in
   * @param key The metakey to search for
   * @returns [number, ICellModel] - A pair of values, the first is the index of where the cell was found
   * and the second is a reference to the cell itself. Returns [-1, null] if cell not found.
   */
  export function findCellWithMetaKey(
    notebook: Notebook,
    key: string
  ): [number, ICellModel] {
    const iter = notebook.model.cells.iter();
    let index = 0;
    for (
      let nextVal = iter.next();
      iter.next() !== undefined;
      nextVal = iter.next()
    ) {
      if (nextVal.metadata.has(key)) {
        return [index, nextVal];
      }
      index++;
    }
    return [-1, null];
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
    if (command == null || notebook_panel == null) {
      throw new Error(
        "Null or undefined parameter was given for command or notebook argument."
      );
    }
    await notebook_panel.session.ready;
    let notebook = notebook_panel.content;
    if (index < 0 || index >= notebook.widgets.length) {
      throw new Error("The index was out of range.");
    }
    //Save the old index, then set the current active cell
    let oldIndex = notebook.activeCellIndex;
    notebook.activeCellIndex = index;
    try {
      await command.execute("notebook:run-cell");
      let output = readOutput(notebook, index);
      notebook.activeCellIndex = oldIndex;
      return output;
    } catch (error) {
      notebook.activeCellIndex = oldIndex;
      throw error;
    }
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
    if (notebook_panel == null) {
      throw new Error(
        "Null or undefined parameter was given for notebook argument."
      );
    }
    let notebook = notebook_panel.content;
    if (index < 0 || index >= notebook.widgets.length) {
      throw new Error("The index was out of range.");
    }
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
    if (notebook == null) {
      throw new Error("Notebook was null or undefined.");
    }
    if (index < 0 || index >= notebook.model.cells.length) {
      throw new Error("Cell index out of range.");
    }
    let cell: ICellModel = notebook.model.cells.get(index);
    if (isCodeCellModel(cell)) {
      cell.value.text = code;
      return;
    } else {
      throw new Error("Cell is not a code cell.");
    }
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
    let newIndex = insertCellAtIndex(notebook_panel, index);
    injectCodeAtIndex(notebook_panel.content, newIndex, code);
    return newIndex;
  }

  /**
   * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
   * Note: The code will be run but the results (output or errors) will not be displayed in the cell. Best for void functions.
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
    notebook_panel: NotebookPanel,
    index: number,
    code: string,
    deleteOnError: boolean
  ): Promise<[number, string]> {
    let insertionIndex;
    try {
      insertionIndex = insertInjectCode(notebook_panel, index, code);
      let output: string = await notebook_utils.sendSimpleKernelRequest(
        notebook_panel,
        code,
        false
      );
      return [insertionIndex, output];
    } catch (error) {
      if (deleteOnError) {
        deleteCellAtIndex(notebook_panel, insertionIndex);
      }
      throw error;
    }
  }

  /**
   * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
   * Note: The code will be run and the result (output or errors) WILL BE DISPLAYED in the cell.
   * @param notebook_panel The notebook to insert the cell into
   * @param command The command registry which can execute the run command.
   * @param index The index of where the new cell will be inserted and run.
   * If the cell index is less than or equal to 0, it will be added at the top.
   * If the cell index is greater than the last index, it will be added at the bottom.
   * @param code The code to inject into the cell after it has been inserted
   * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
   * @returns Promise<[number, string]> - A promise for when the cell code has executed
   * containing the cell's index and output result
   */
  export async function insertRunShow(
    notebook_panel: NotebookPanel,
    command: CommandRegistry,
    index: number,
    code: string,
    deleteOnError: boolean
  ): Promise<[number, string]> {
    let insertionIndex;
    try {
      insertionIndex = insertInjectCode(notebook_panel, index, code);
      let output: string = await runCellAtIndex(
        command,
        notebook_panel,
        insertionIndex
      );
      return [insertionIndex, output];
    } catch (error) {
      if (deleteOnError) {
        deleteCellAtIndex(notebook_panel, insertionIndex);
      }
      throw error;
    }
  }

  /**
   * @deprecated Using notebook_utils.sendSimpleKernelRequest or notebook_utils.sendKernelRequest
   * will execute code directly in the kernel without the need to create a cell and delete it.
   * @description This will insert a cell with specified code at the top and run the code.
   * Once the code is run and output received, the cell is deleted, giving back cell's output.
   * If the code results in an error, the injected cell is still deleted but the promise will be rejected.
   * @param notebook_panel The notebook to run the code in
   * @param code The code to run in the cell
   * @param insertAtEnd True means the cell will be inserted at the bottom
   * @returns Promise<string> - A promise when the cell has been deleted, containing the execution result as a string
   */
  export async function runAndDelete(
    notebook_panel: NotebookPanel,
    code: string,
    insertAtEnd = true
  ): Promise<string> {
    let index: number = -1;
    if (insertAtEnd) {
      index = notebook_panel.content.model.cells.length;
    }
    let result: [number, string] = await insertAndRun(
      notebook_panel,
      index,
      code,
      true
    );
    deleteCellAtIndex(notebook_panel, result[0]);
    return result[1];
  }
}

export { cell_utils };
