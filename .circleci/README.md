## Steps needed when changing the circleci Dockerfile:

The dockerfile in this directory will build a container that is used by circleci to test the repo.
If modifications are made (in order to add or remove an extension or installation step for example),
an updated docker image will need to be created. Follow steps below:

## Docker image create and publish:

- Build docker image locally:
```bash
#Do this within the .circleci directory
docker build -t cdat/vcdat_circleci:nightly .
```

- Publish to docker hub:
```bash
docker push cdat/vcdat_circleci:<new version>
docker push cdat/vcdat_circleci:nightly
```
