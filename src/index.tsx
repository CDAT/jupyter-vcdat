
import './../style/css/bootstrap.min.css';
import './../style/css/jquery-ui.min.css';
import './../style/css/Styles.css';
import './../style/css/index.css';

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
import LeftSideBarWidget from './components/left_side_bar_widget';

const FILETYPE = 'NetCDF';
const FACTORY_NAME = 'vcs';

// Declare the widget variables
let commands: CommandRegistry;
let shell: ApplicationShell;
let sidebar: LeftSideBarWidget;

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
		showLeftSideBar: "vcs:open-sidebar"
	};

	//const command: string = 'xkcd:open';
	commands.addCommand(COMMANDS.showLeftSideBar, {
		label: 'VCDAT LeftSideBar',
		execute: () => {
			if(!sidebar){
				sidebar = new LeftSideBarWidget(commands);
				sidebar.id = 'left-side-bar';
				sidebar.title.label = 'VCS LeftSideBar';
				sidebar.title.closable = false;
			}
			if (!sidebar.isAttached) {
				// Attach the widget to the left area if it's not there
				shell.addToLeftArea(sidebar);
			} else {
				sidebar.update();
			}
			// Activate the widget
			shell.activateById(sidebar.id);
		}
	});

	// Add commands to the palette.
	[
	COMMANDS.showLeftSideBar
	].forEach(command => {
		palette.addItem({ command, category: '1. Visualization' });
	});

	// Track and restore the widget state
	let tracker = new InstanceTracker<Widget>({ namespace: 'vcs' });
	[
	COMMANDS.showLeftSideBar
	].forEach(command => {
	restorer.restore(tracker, {
			command,
			args: () => JSONExt.emptyObject,
			name: () => 'vcs'
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