
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

import { CommandRegistry } from '@phosphor/commands';
import { NCViewerWidget, LeftSideBarWidget } from './widgets';

const FILETYPE = 'NetCDF';
const FACTORY_NAME = 'vcs';

// Declare the widget variables
let commands: CommandRegistry;
let sidebar: LeftSideBarWidget;
let shell: ApplicationShell;

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
function activate(app: JupyterLab) {

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

		//Create and show LeftSideBar
		if(!sidebar){
			sidebar = new LeftSideBarWidget(commands, context);
			sidebar.id = 'vcs-left-side-bar';
			sidebar.title.label = 'vcs';
			sidebar.title.closable = true;
		}
		// Attach the widget to the left area if it's not there
		if (!sidebar.isAttached) {
			shell.addToLeftArea(sidebar);
		} else {
			sidebar.update();
		}
		// Activate the widget
		shell.activateById(sidebar.id);

		return ncWidget;
	}
}