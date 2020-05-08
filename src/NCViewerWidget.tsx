// Dependencies
import { Widget } from "@lumino/widgets";
import { DocumentRegistry } from "@jupyterlab/docregistry";

export default class NCViewerWidget extends Widget {
  public readonly context: DocumentRegistry.Context;
  public readonly ready = Promise.resolve(void 0);
  constructor(context: DocumentRegistry.Context) {
    super();
    this.context = context;
  }
}
