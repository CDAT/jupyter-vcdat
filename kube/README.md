Dockerfile.core -> everything conda/pip, based on miminal jupyterhub img
Dockerfile.labextensions -> labextensions we desire to add

Our extension needs to be built from npm repo or  container cannot be ran
read-only here are the steps:

npm login
editpackage.json to set new version
npm install
npm publish

At this point you can build our extension as container
Dockerfile.extension -> our extension

kubernetes/helm setup instructions at: 
https://z2jh.jupyter.org/en/latest/setup-jupyterhub.html#setup-jupyterhub

Use config.yaml in the directory

helm upgrade $RELEASE jupyterhub/jupyterhub --version=0.8.0-beta.1 --values config.yaml
