import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';


/**
 * Initialization data for the jupyter-react-ext extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyter-react-ext',
  autoStart: true,
  activate: (app: JupyterLab) => {
    console.log('JupyterLab extension jupyter-react-ext is activated!');
  }
};

export default extension;
