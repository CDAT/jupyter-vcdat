import {
  ABCWidgetFactory,
  DocumentRegistry,
  IDocumentWidget,
  DocumentWidget
} 
from '@jupyterlab/docregistry';

import { 
  JupyterLab, 
  JupyterLabPlugin,
  ApplicationShell, 
  ILayoutRestorer } 
from '@jupyterlab/application';

import { 
  ICommandPalette, 
  InstanceTracker 
} from '@jupyterlab/apputils';

import { CommandRegistry } from '@phosphor/commands';
import { JSONExt } from '@phosphor/coreutils'
import { Widget } from '@phosphor/widgets';
import XkcdComic from './components/Comic';
import NumberField from './components/vcs_widgets';
import '../style/index.css';

const FILETYPE = 'NetCDF';
const FACTORY_NAME = 'vcs';

import NCSetupWidget from './components/nc_setup_widget';
import VCDAT_Widgets from './components/vcs_widgets';

// Declare the widget variables
let xkcdComic: XkcdComic;
let numField: NumberField;
let commands: CommandRegistry;
let shell: ApplicationShell;
let widget: NCSetupWidget;

/**
 * Initialization data for the jupyter-react-ext extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyter-react-ext',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: activate
};

export default extension;

/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer) {
  
  console.log('JupyterLab REACT jupyter-react-ext is activated!');
  commands = app.commands;
  shell = app.shell;

  const factory = new NCViewerFactory({
    name: FACTORY_NAME,
    fileTypes: [FILETYPE],
    defaultFor: [FILETYPE],
    readOnly: true
  });

  let ft: DocumentRegistry.IFileType = {
      name: FILETYPE,
      extensions: ['.nc'],
      mimeTypes: ['application/netcdf'],
      contentType: 'file',
      fileFormat: 'base64'
  }

  app.docRegistry.addFileType(ft);
  app.docRegistry.addWidgetFactory(factory);

  factory.widgetCreated.connect((sender, widget) => {
      console.log('NCViewerWidget created from factory');
  });
  
  // Add application commands
  const COMMANDS = {
    hello: "xkcd:hello",
    showComic: "xkcd:open",
    open_setup: "vcs:open-setup",
    showWidget: "vcs:open-widget"
  };

  //const command: string = 'xkcd:open';

  commands.addCommand(COMMANDS.showComic, {
    label: 'Show random xkcd comic',
    execute: () => {

      if (!xkcdComic) {
        // Create a new widget if one does not exist
        xkcdComic = new XkcdComic('jupyter-react-ext',"This Comic is rendered by React...");
        xkcdComic.update();
      }

      if (!tracker.has(xkcdComic)) {
        // Track the state of the widget for later restoration
        tracker.add(xkcdComic);
      }

      if (!xkcdComic.isAttached) {
        // Attach the widget to the main work area if it's not there
        shell.addToMainArea(xkcdComic);
      } else {
        // Refresh the comic in the widget
        xkcdComic.update();
      }

      // Activate the widget
      shell.activateById(xkcdComic.id);
    }
  });

  commands.addCommand(COMMANDS.hello, {
    label: 'Say Hello World',
    execute: () => {
      if(xkcdComic.isAttached){
        xkcdComic.title.label = "Hello World!!";
      }
      if(widget.isAttached){
        widget.title.label = "Hello World!!";
      }
      if(numField.isAttached){
        numField.title.label = "Hello World!!";
      }
    }
  });

  commands.addCommand(COMMANDS.open_setup, {
    label: 'VCS Setup',
    execute: () => {
        if(!widget){
            widget = new NCSetupWidget();
            widget.id = 'vcs-setup';
            widget.title.label = 'VCS Setup';
            widget.title.closable = true;
        }
        if (!widget.isAttached) {
            // Attach the widget to the left area if it's not there
            shell.addToLeftArea(widget);
        } else {
            widget.update();
        }
        // Activate the widget
        shell.activateById(widget.id);
    }
  });

  commands.addCommand(COMMANDS.showWidget, {
    label: 'VCDAT Widget',
    execute: () => {
        if(!numField){
            numField = new VCDAT_Widgets("numFieldTest");
            numField.id = "vcdat-widget";
            numField.title.label = "VCDAT Widget";
            numField.title.closable = true;
        }
        if (!numField.isAttached) {
            // Attach the widget to the left area if it's not there
            shell.addToRightArea(numField);
        } else {
          numField.update();
        }
        // Activate the widget
        shell.activateById(numField.id);
    }
  });

  // Add commands to the palette.
  [
    COMMANDS.showComic,
    COMMANDS.hello,
    COMMANDS.open_setup,
    COMMANDS.showWidget
  ].forEach(command => {
    palette.addItem({ command, category: '1. Visualization' });
  });

  // Track and restore the widget state
  let tracker = new InstanceTracker<Widget>({ namespace: 'xkcd' });
  [
    COMMANDS.showComic
  ].forEach(command => {
    restorer.restore(tracker, {
      command,
      args: () => JSONExt.emptyObject,
      name: () => 'xkcd'
    });
  });
};

export class NCViewerFactory extends ABCWidgetFactory<
    IDocumentWidget<NCViewerWidget>
    > {
    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(
        context: DocumentRegistry.Context
    ): IDocumentWidget<NCViewerWidget> {
        const content = new NCViewerWidget(context);
        const ncWidget = new DocumentWidget({ content, context });
        // debugger;
        console.log('executing command console:create');
        commands.execute('console:create', {
            activate: true,
            path: context.path,
            preferredLanguage: context.model.defaultKernelLanguage
        }).then(consolePanel => {
            consolePanel.session.ready.then(() => {
                consolePanel.console.inject('import cdms2');
                consolePanel.console.inject('import vcs');

                let dataLoadString = 'data = cdms2.open(\'' + context.session.path + '\')';
                consolePanel.console.inject(dataLoadString);
                consolePanel.console.inject('clt = data("clt")');
                consolePanel.console.inject('x=vcs.init()');
                consolePanel.console.inject('x.plot(clt)');
            });
        });
        return ncWidget;
    }
}

export class NCViewerWidget extends Widget {
    constructor(context: DocumentRegistry.Context) {
        super();
        this.context = context;
    }

    readonly context: DocumentRegistry.Context;

    readonly ready = Promise.resolve(void 0);
}