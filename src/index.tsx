
import './../style/css/bootstrap.min.css';
import './../style/css/jquery-ui.min.css';
import './../style/css/Styles.css';
import './../style/css/index.css';

import {
	ABCWidgetFactory,
	DocumentRegistry,
	IDocumentWidget,
	DocumentWidget
} from '@jupyterlab/docregistry';

import {
	JupyterLab,
	JupyterLabPlugin,
	ApplicationShell,
	ILayoutRestorer
} from '@jupyterlab/application';

import {
	InstanceTracker
} from '@jupyterlab/apputils';

import { CommandRegistry } from '@phosphor/commands';
import { JSONExt } from '@phosphor/coreutils'
import { Widget } from '@phosphor/widgets';
import { LeftSideBarWidget } from './widgets';

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
	requires: [ILayoutRestorer],
	activate: activate
};

export default extension;

/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab, restorer: ILayoutRestorer) {

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
	let leftBarCommand = {
		showLeftSideBar: "vcs:open-sidebar"
	};
	const COMMANDS = [leftBarCommand];

	commands.addCommand(COMMANDS[0].showLeftSideBar, {
		label: 'VCDAT LeftSideBar',
		execute: () => {
			if (!sidebar) {
				sidebar = new LeftSideBarWidget();
				sidebar.id = 'vcs-left-side-bar';
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

	// Track and restore the widget state
	let tracker = new InstanceTracker<Widget>({ namespace: 'vcs' });
	[leftBarCommand.showLeftSideBar].forEach(command => {
		restorer.restore(tracker, {
			command,
			args: () => JSONExt.emptyObject,
			name: () => 'vcs'
		});
	});
};

/**
 * Create a new widget given a context.
 */
export class NCViewerFactory extends ABCWidgetFactory<
	IDocumentWidget<NCViewerWidget>
	> {
	protected createNewWidget(
		context: DocumentRegistry.Context
	): IDocumentWidget<NCViewerWidget> {
		const content = new NCViewerWidget(context);
		const ncWidget = new DocumentWidget({ content, context });

		// the path to the file that was clicked to launch this widget
		const path = context.session.path.split('/').slice(-1)[0];

		// create new console
		commands.execute('console:create', {
			activate: true,
			path: context.path,
			preferredLanguage: context.model.defaultKernelLanguage
		}).then(consolePanel => {
			// once the console is created setup launch the sidebar
			consolePanel.session.ready.then(() => {
				commands.execute('vcs:open-sidebar');
				sidebar.updatePath(path);
				sidebar.updateConsole(consolePanel);
			});
		});
		return ncWidget;
	}
}

// dummy widget to make the NCViewerFactory happy
export class NCViewerWidget extends Widget {
	constructor(context: DocumentRegistry.Context) {
		super();
		this.context = context;
	}
	readonly context: DocumentRegistry.Context;
	readonly ready = Promise.resolve(void 0);
}