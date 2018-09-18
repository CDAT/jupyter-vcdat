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
  constructor(testInput: any) {
    super();

    this.id = 'jupyter-react-ext';
    this.title.label = 'xkcd.com';
    this.title.closable = true;
    this.test = testInput;
    this.addClass('jp-xkcdWidget');
    console.log('Widget constructor part 1');
    this.div = document.createElement('div');
    this.img = document.createElement('img');
    this.img.className = 'jp-xkcdCartoon';
    this.div.id = 'test-component';
    console.log('Widget constructor part 2');
    this.node.appendChild(this.div);
    this.node.appendChild(this.img);
    console.log('Widget constructor part 3');
    this.img.insertAdjacentHTML('afterend',
      `<div class="jp-xkcdAttribution">
        <a href="https://creativecommons.org/licenses/by-nc/2.5/" class="jp-xkcdAttribution" target="_blank">
          <img src="https://licensebuttons.net/l/by-nc/2.5/80x15.png" />
        </a>
      </div>`
    );

    ReactDom.render(<Test test={this.test} src={this.imgSrc} alt={this.imgAlt} title={this.imgTitle} />, this.div);
  }
  /**
   * The image element associated with the widget.
   */

  readonly img: HTMLImageElement;
  div: HTMLDivElement;
  imgSrc: any;
  imgAlt: any;
  imgTitle: any;
  test: any;

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
      this.img.src = data.img;
      this.img.alt = data.title;
      this.img.title = data.alt;
    });
  }
};

/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer) {
  console.log('JupyterLab REACT jupyter-react-ext is activated!');

  const testValue: string = "THIS IS A TEST";

  // Declare a widget variable
  let widget: XkcdWidget;
  console.log('Widget set!');
  // Add an application command
  const command: string = 'xkcd:open';
  app.commands.addCommand(command, {
    label: 'Show random xkcd comic',
    execute: () => {
      console.log('Command fired!');
      if (!widget) {
        // Create a new widget if one does not exist
        console.log('Widget before constructor');
        widget = new XkcdWidget(testValue);
        console.log('Widget after constructor');
        widget.update();
      }
      if (!tracker.has(widget)) {
        // Track the state of the widget for later restoration
        console.log('Widget not made!');
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        console.log('Widget already attached!');
        app.shell.addToMainArea(widget);
      } else {
        // Refresh the comic in the widget
        console.log('Widget update!');
        widget.update();
      }
      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({ command, category: 'App React Test' });

  // Track and restore the widget state
  let tracker = new InstanceTracker<Widget>({ namespace: 'xkcd' });
  restorer.restore(tracker, {
    command,
    args: () => JSONExt.emptyObject,
    name: () => 'xkcd'
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
