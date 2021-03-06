# New Jupyter-vcdat Release Steps:

When making a new jupyter-vcdat official release, make sure master contains 
all the latest updates and the package.json version has been updated to the
new version number. Check all documentation has been updated to reflect new
release number and features. Go to https://github.com/CDAT/jupyter-vcdat/releases
and make sure the release has been tagged with latest commit.
Once everything has been done and all tests have passed, then jupyter-vcdat is
ready to publish to npm and docker hub. Follow the steps below to make official
published versions.

## Convert nightly to latest release
Nightly docker images, conda and npm packages are generated by each commit to
master. Therefore, in order to do an official release, all that's needed is to
convert the nightly tag to latest.

## Convert latest nightly package to official:
- Get the version of the latest nightly npm package (the one to make official)
```bash
npm view jupyter-vcdat dist-tags #Get the latest nightly version number
npm dist-tag add jupyter-vcdat@<nightly-version> latest
```

## Convert latest nightly docker image to official latest
- Create a tag for the nightly image to latest
```bash
docker pull cdat/vcdat:nightly #Get the latest docker nightly image
docker image tag cdat/vcdat:nightly cdat/vcdat:latest #Set as the latest image
docker push cdat/vcdat:latest #Push to docker hub
```

## For Conda package
- Go to anaconda cloud and edit the label of the nightly package, so that it
includes the latest official label: https://anaconda.org/cdat/jupyter-vcdat/files
Find the latests stable file and click 'labels'. Then enter new version label.

# Manual Publish steps:
Note: The steps below are for manually publishing jupyter-vcdat to npm and docker hub, 
however every commit to master will automaticaly publish as the nightly tag
(after tests pass), so these steps are only if you need to run it manually.

## NPM Publish steps:

- Go to jupyter-vcdat repo and checkout master branch:
```bash
cd vcdat/repo/path
git checkout master
git pull #Pull latest changes from master
```

- Publish to npm:
Note: Make sure the package.json contains the correct official version being published
before running this step.
```bash
npm login
npm install
npm publish
```
## Docker Image Build and publish:

- NOTE: THIS WILL BUILD USING THE LATEST PUBLISHED NPM NIGHTLY VERSION OF VCDAT EXTENSION.
- Build docker image:
```bash
#Do this within the deploy directory
docker build -t cdat/vcdat:<new version> .
```

- Test the docker image runs properly:
```bash
# Test using current directory
docker run -p 9000:9000 -v=$(pwd)/:/home/jovyan/local/ -it cdat/vcdat:<new version> jupyter-lab --port=9000

OR

# Test using specified directory
docker run -p 9000:9000 -v /<Path to use in testing>/:/home/jovyan/testing/ -it cdat/vcdat:<new version> jupyter-lab --port=9000
```
Note: Once image is running in the terminal, use the link shown near the bottom: 'http://127.0.0.1:9000...'
OR within your browser, go to: localhost:9000, and enter the jupyterlab token from the console into the token field.
You should now be able to see jupyter-vcdat in browser

- After test is successful and image is running properly, publish to docker hub:
```bash
docker push cdat/vcdat:<new version>
docker image tag cdat/vcdat:<new version> cdat/vcdat:latest
docker push cdat/vcdat:latest
```

# Docker Image Build With Local Extension:

- Build docker image from local branch:
```bash

#Do this within the deploy directory
./local_package.sh #build a local docker package
```

- Test the docker image runs properly:
```bash
# Test using current directory
docker run -p 9000:9000 -v=$(pwd)/:/home/jovyan/local/ -it cdat/vcdat:local-branch jupyter-lab --port=9000

OR

# Test using specified directory
docker run -p 9000:9000 -v /<Path to use in testing>/:/home/jovyan/testing/ -it cdat/vcdat:local-branch jupyter-lab --port=9000
```
Note: Within browser, go to: localhost:9000/lab, and enter the jupyterlab token from the console into the token field. Then you should see jupyter-vcdat in browser

- After test is successful and image is running properly, you can publish to docker hub this way:
```bash
docker image tag cdat/vcdat:local-branch cdat/vcdat:<new version>
docker push cdat/vcdat:<new version>
# (Optional) To set image as official latest once it was pushed:
docker image tag cdat/vcdat:<new-version> cdat/vcdat:latest
docker push cdat/vcdat:latest
```

# Update VCDAT to latest version on NERSC
- Log in to Cori at NERSC:
```bash
ssh user@cori.nersc.gov
```

- Check current vcdat versions available on Cori:
```bash
shifterimg images | grep vcdat
```

- Pull latest docker image for vcdat:
```bash
shifterimg -v pull docker:cdat/vcdat:latest
```
- Wait for Docker image update:
Note: You'll see the same message printing out continuously with the time step and status (it may appear to be an error at first, but it's not and you just need to wait for it to complete).

- Done! Make sure to test image to be sure everything is working well (see steps below).

## Running

- Make sure your home directory at NERSC contains a '.overrides-jupyter-' file with this line:
```
exec shifter --volume=$(pwd):/run --volume=$(pwd):/home/jovyan --image=cdat/vcdat:latest -- jupyter-labhub "$@"
```

- Point your browser to: https://jupyter.nersc.gov/hub/

- Log in with NERSC credentials, and select 'Cori' option.

- Once loaded, Jupyter-VCDAT should be ready to go!