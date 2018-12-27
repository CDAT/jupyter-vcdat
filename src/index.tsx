import "./../style/css/Styles.css";
import "./../style/css/index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import {
  ABCWidgetFactory,
  DocumentRegistry,
  IDocumentWidget,
  DocumentWidget
} from "@jupyterlab/docregistry";

import {
	JupyterLab,
	JupyterLabPlugin,
	ApplicationShell,
} from '@jupyterlab/application';

import { CommandRegistry } from "@phosphor/commands";
import { NCViewerWidget, LeftSideBarWidget } from "./widgets";

const FILETYPE = "NetCDF";
const FACTORY_NAME = "vcs";

// Declare the widget variables
let commands: CommandRegistry;
let sidebar: LeftSideBarWidget;
let shell: ApplicationShell;

/**
 * Initialization data for the jupyter-vcdat extension.
 */
const extension: JupyterLabPlugin<void> = {
	id: 'jupyter-vcdat',
	autoStart: true,
	requires: [],
	activate: activate
};

export default extension;

/**
 * Activate the vcs widget extension.
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

	// Creates the left side bar widget when the app has started
	app.started.then(()=>{
		// Create the left side bar
		sidebar = new LeftSideBarWidget(commands, null);
		sidebar.id = 'vcs-left-side-bar';
		sidebar.title.label = 'vcs';
		sidebar.title.closable = true;

		// Attach it to the left side of main area
		shell.addToLeftArea(sidebar);
	});

	// Whenever a panel is changed in the shell, this will trigger
	app.shell.activeChanged.connect((sender,data)=>{
		if(!data.oldValue && data.newValue && data.newValue.hasClass("jp-NotebookPanel") && !sidebar.notebook){
			sidebar.updateNotebook(data.newValue);
		}
		if(data.oldValue && data.newValue && data.newValue.hasClass("jp-NotebookPanel")){
			sidebar.updateNotebook(data.newValue);
		}
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

		sidebar.updatePath(context);
		if(sidebar.loading_data && sidebar.notebook){
			sidebar.loading_data = false;
		} else {
			sidebar.createNotebook(undefined, undefined);
		}

		// Activate the widget
		shell.activateById(sidebar.id);

		return ncWidget;
	}
}
