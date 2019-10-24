[![DOI](https://zenodo.org/badge/147574270.svg)](https://zenodo.org/badge/latestdoi/147574270)

# Jupyter-vcdat

A Jupyter Lab extension that integrates vCDAT features directly in a notebook.

## Prerequisites

- Installation of conda via Anaconda or Miniconda conda >=4.6.11 (the script
  will try to update your base installation anyway)

If you didn't let Anaconda or Miniconda prepend the Anaconda<2 or 3> install location to PATH, make sure conda is in your PATH (for more information see the [Anaconda Documentation](https://docs.anaconda.com/anaconda/user-guide/faq/#installing-anaconda)). Assuming Ananconda is installed in ${HOME}/anaconda:
* export PATH=${HOME}/anaconda/bin:${PATH} # for bash
* setenv PATH ${HOME}/anaconda/bin:${PATH} # for tcsh

## User Installation

You can run jupyter-vcdat via local installation, via anaconda environment or by dcker container.

### New conda environment

This example will create and run a new conda environment 'jupyter-vcdat', containing JupyterLab and jupyter-vcdat

```bash
conda create -n jupyter-vcdat -c cdat/label/v82 -c conda-forge jupyter-vcdat #Create conda environment
conda activate jupyter-vcdat #Start environment
jupyter lab build #Build jupyter lab to include jupyter-vcdat extension (only for first time installation)

jupyter lab #Start Jupyter Lab
```

The browser should open automatically, if not, point your browser to: localhost:8888/lab

### Existing conda environment

This example will install jupyter-vcdat to an existing conda environment.
* Note: python3 is required and will be installed.

```bash
conda install -c cdat/label/v82 -c conda-forge jupyter-vcdat #Install jupyter-vcdat
jupyter lab build #Build jupyter lab to include jupyter-vcdat extension (only for first time installation)

jupyter lab #Start Jupyter Lab
```

The browser should open automatically, if not, point your browser to: localhost:8888/lab

### Jupyter-vcdat docker container

This example runs a jupyter-vcdat docker container at localhost:9000/lab, with mounted volume 'my_data':

```bash
docker run -p 9000:8888 -v /Path/To/my_data/:/home/jovyan/my_data/ -it cdat/vcdat:latest #Run the image
```

After the container is running, obtain the token (if needed) from the output shown in the console:

```bash
The Jupyter Notebook is running at:
http://(d8a71c79a232 or 127.0.0.1):8888/?token=<Copy the token value from here>
```

Open a browser and use this URL:

### localhost:8888/lab?token=\<Paste token value here>

You should then be able to access the jupyter lab instance on your local browser.

## Obtaining sample data

To download sample data, enter the code below within a Jupyter notebook cell and run the cell:

```python
import vcs
import cdms2
import cdat_info
import pkg_resources
vcs_egg_path = pkg_resources.resource_filename(pkg_resources.Requirement.parse("vcs"), "share/vcs")
path = vcs_egg_path+'/sample_files.txt'
cdat_info.download_sample_data_files(path,"sample_data")
```


## Local installation (for developers)

If you didn't let Anaconda or Miniconda prepend the Anaconda<2 or 3> install location to PATH, make sure conda is in your PATH (for more information see the [Anaconda Documentation](https://docs.anaconda.com/anaconda/user-guide/faq/#installing-anaconda)). Assuming Ananconda is installed in ${HOME}/anaconda:
* export PATH=${HOME}/anaconda/bin:${PATH} # for bash
* setenv PATH ${HOME}/anaconda/bin:${PATH} # for tcsh

Next, clone the jupyter-vcdat github repo:

```bash
git clone https://github.com/CDAT/jupyter-vcdat.git
```

Change into the directory containing the repo and type in the following commands:

```bash

    #Create the environment
    ./install_script.sh #Note: You can use -h to get help and options for installation script.

    # The following two lines of code install tslint if developers want to use it (optional):
      # For VSCode:
       code --install-extension tslint

      # For Atom:
      apm install linter-tslint

    # For all users, activate the jupyter-vcdat environment and launch the JupyterLab interface
    Activate jupyter-vcdat
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```
