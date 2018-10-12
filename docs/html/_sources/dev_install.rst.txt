=================================
Developer Installation
=================================

Basic Setup
-----------------------------
    
* `Set up Github ssh key`_
* `Download and install anaconda`_
* `Fork vcdat 2.0 repo`_

.. _Set up Github ssh key: https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent
.. _Download and install anaconda: https://www.continuum.io/downloads
.. _Fork vcdat 2.0 repo: https://github.com/CDAT/jupyter-vcdat

Within the project directory do the following:

::

    #Create the environment
    conda create -n jupyter-vcdat -c cdat/label/nightly -c conda-forge -c cdat -c anaconda libcurl ipython nodejs vcs jupyterlab jupyter flake8 autopep8 pip nb_conda jupyterhub ipywidgets python=3
    source activate jupyter-vcdat

    # Go to vcs repo
    git clone https://github.com/CDAT/vcs.git
    cd vcs
    git checkout boxfill_widgets_jupyter
    python setup.py install --old-and-unmanageable

    # Install sidecar
    pip install sidecar
    jupyter labextension install @jupyter-widgets/jupyterlab-manager
    jupyter labextension install @jupyter-widgets/jupyterlab-sidecar

    #install the react-tutorial extension
    cd ..
    git clone https://github.com/CDAT/jupyter-vcdat.git
    cd jupyter-vcdat
    git checkout vcdat2.0
    npm install
    jupyter labextension install .

Running vCDAT
-----------------------------

* Start the development server::

    source activate jupyter-vcdat
    jupyter lab 

* A browser window will open.
* Right click on a '.nc' file and select 'vcs' to open the file.