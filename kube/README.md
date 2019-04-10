Dockerfile.setup -> everything before our extension, based on miminal
jupyterhub img

Dockerfile.extension -> our extension

helm upgrade $RELEASE jupyterhub/jupyterhub --version=0.8.0-beta.1 --values config.yaml
