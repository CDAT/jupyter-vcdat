import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, InstanceTracker } from '@jupyterlab/apputils';
import { JSONExt } from '@phosphor/coreutils'
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import '../style/index.css';

class Test extends React.Component <any, any> {

  constructor (props: any){
    super(props);
    this.state = { src: this.props.imgSrc, alt: this.props.imgAlt, title: this.props.imgTitle };
  }

  render() {
    return (
      <div>
        <p>This finally worked!! This is rendered by React</p>
        <img src={this.state.src} alt={this.state.alt} title={this.state.title}></img>
      </div>
    )
  }
}


/**
 * An xckd comic viewer
 */
class XkcdWidget extends Widget {
  /**
   * Construct a new xkcd widget.
   */
  constructor() {
    super();

    this.id = 'jupyter-react-ext';
    this.title.label = 'xkcd.com';
    this.title.closable = true;
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

    console.log('Widget constructor part 4');

    ReactDom.render(<Test src={this.imgSrc} alt={this.imgAlt} title={this.imgTitle} />, this.div);
    console.log('Widget constructor part 5');
  }
  /**
   * The image element associated with the widget.
   */

  readonly img: HTMLImageElement;
  div: HTMLDivElement;
  imgSrc: any;
  imgAlt: any;
  imgTitle: any;

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
        widget = new XkcdWidget();
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
