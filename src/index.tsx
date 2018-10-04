
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
	ApplicationShell
} 
from '@jupyterlab/application';

import { CommandRegistry } from '@phosphor/commands';
//import { JSONExt } from '@phosphor/coreutils'
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
	requires: [],
	activate: activate
};

export default extension;

/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab) {
	
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

		//Create and show LeftSideBar
		if(!sidebar){
			sidebar = new LeftSideBarWidget(commands);
			sidebar.id = 'left-side-bar';
			sidebar.title.label = 'VCS LeftSideBar';
			sidebar.title.closable = true;
		}
		if (!sidebar.isAttached) {
			// Attach the widget to the left area if it's not there
			shell.addToLeftArea(sidebar);
		} else {
			sidebar.update();
		}
		// Activate the widget
		shell.activateById(sidebar.id);

		// Inject command;
		console.log('executing command console:create');
		commands.execute('console:create', {
			activate: true,
			path: context.path,
			preferredLanguage: context.model.defaultKernelLanguage
		}).then(consolePanel => {
			consolePanel.session.ready.then(() => {

				var injectCmd = "import cdms2\nimport vcs\ndata = cdms2.open(\'";
				injectCmd += context.session.path + "\')\nclt = data('clt')\n";
				injectCmd += "x=vcs.init()\nx.plot(clt)";
				consolePanel.console.inject(injectCmd);
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