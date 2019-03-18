Dockerfile.core -> everything conda/pip, based on miminal jupyterhub img
Dockerfile.labextensions -> labextensions we desire to add
Dockerfile.extension -> our extension

helm upgrade $RELEASE jupyterhub/jupyterhub --version=0.8.0-beta.1 --values config.yaml
