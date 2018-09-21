import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, InstanceTracker } from '@jupyterlab/apputils';
import { JSONExt } from '@phosphor/coreutils'
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import Test from './components/test';
import '../style/index.css';

/**
 * An xckd comic viewer
 */
class XkcdWidget extends Widget {
  /**
   * Construct a new xkcd widget.
   */
  constructor(widgetId: string, headerText: any) {
    super();

    this.id = widgetId;
    this.title.label = 'xkcd.com';
    this.headerText = headerText;
    this.title.closable = true;
    this.addClass('jp-xkcdWidget');
    this.div = document.createElement('div');
    this.div.id = "app";
    this.div.className = 'jp-xkcdCartoon';
    this.node.appendChild(this.div);

    ReactDom.render(<Test headerText={this.headerText} src={this.imgSrc} alt={this.imgAlt} title={this.imgTitle} />, this.div);
  }
  /**
   * The image element associated with the widget.
   */

  div: HTMLDivElement;
  imgSrc: any;
  imgAlt: any;
  imgTitle: any;
  headerText: string;

  /**
   * Handle update requests for the widget.
   */
  onUpdateRequest(msg: Message): void {
    fetch('https://egszlpbmle.execute-api.us-east-1.amazonaws.com/prod').then(response => {
      return response.json();
    }).then(data => {
      this.imgSrc = data.img;
      this.imgAlt = data.title;
      this.imgTitle = data.alt;

      this.reRender();
    });
  }

  reRender(): void {
    ReactDom.render(<Test headerText={this.headerText} src={this.imgSrc} alt={this.imgAlt} title={this.imgTitle} />, this.div);
  }
};

/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer) {
  console.log('JupyterLab REACT jupyter-react-ext is activated!');

  const headerText: string = "This Comic is rendered by a React Component...";

  // Declare a widget variable
  let widget: XkcdWidget;
  
  // Add application commands
  const COMMANDS = {
    hello: "xkcd:hello",
    showComic: "xkcd:open"
  };

  //const command: string = 'xkcd:open';

  app.commands.addCommand(COMMANDS.showComic, {
    label: 'Show random xkcd comic',
    execute: () => {

      if (!widget) {
        // Create a new widget if one does not exist
        widget = new XkcdWidget('jupyter-react-ext',headerText);
        widget.update();
      }
      if (!tracker.has(widget)) {
        // Track the state of the widget for later restoration
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.addToLeftArea(widget);
      } else {
        // Refresh the comic in the widget
        widget.update();
      }
      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  app.commands.addCommand(COMMANDS.hello, {
    label: 'Say Hello',
    execute: () => {
      if(widget.isAttached){
        widget.headerText = "Hello World!!";
        widget.reRender();
      }
    }
  });

  // Add commands to the palette.
  [
    COMMANDS.showComic,
    COMMANDS.hello
  ].forEach(command => {
    palette.addItem({ command, category: 'App React Test' });
  });

  // Track and restore the widget state
  let tracker = new InstanceTracker<Widget>({ namespace: 'xkcd' });
  [
    COMMANDS.showComic,
    COMMANDS.hello
  ].forEach(command => {
    restorer.restore(tracker, {
      command,
      args: () => JSONExt.emptyObject,
      name: () => 'xkcd'
    });
  });
};

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
