# jupyter-react-ext

Learning to make extensions for JupyterLab and incorporating React.

## Prerequisites

- JupyterLab

## Installation

For a development install:

```bash

    #Create the environment
    ./install_script.sh

    # Install tslint (optional)
      # For VSCode:
       code --install-extension tslint

      # For Atom:
      apm install linter-tslint

    cd jupyter-vcdat
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```
