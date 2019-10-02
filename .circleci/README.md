## Steps needed when changing the circleci Dockerfile:

The Dockerfile.circleci in this directory will build a container that is used by circleci to test the repo.
If modifications are needed (in order to add or remove an extension or installation step for example),
an updated docker image will need to be created. Follow steps below:

## Create and publish circleci docker:

- Build circleci docker image locally:
```bash
#Do this within the .circleci directory
docker build -t cdat/vcdat_circleci:<new version> .
```

- Publish to docker hub:
```bash
docker push cdat/vcdat_circleci:<new version>
```

- Retag latest version as nightly and push
```bash
docker image tag cdat/vcdat_circleci:nightly cdat/vcdat_circleci:<new version>
docker push cdat/vcdat_circleci:nightly
```