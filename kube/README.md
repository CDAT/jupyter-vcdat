## New Jupyter-vcdat Release Steps:

When making a new jupyter-vcdat official release, make sure master contains 
all the latest updates and the package.json version has been updated to the
new version number. Check all documentation has been updated to reflect new
release number and features. Go to https://github.com/CDAT/jupyter-vcdat/releases
and make sure the release has been tagged with latest commit.
Once everything has been done and all tests have passed, then jupyter-vcdat is
ready to publish to npm and docker hub. Follow steps below to publish a new docker
image and the npm package. 

## NPM Publish steps:

- Go to jupyter-vcdat repo and checkout master branch:
```bash
cd vcdat/repo/path
git checkout master
git pull #Pull latest changes from master
```

- Publish to npm:
```bash
npm login
npm install
npm publish
```
## Docker Image Build and publish:

- Build docker image:
```bash
#Do this within the kube directory
docker build -t cdat/vcdat:<new version> .
```

- Test the docker image runs properly:
```bash
docker run -p 9000:9000 -v /<Path to directory to use in testing>/:\
/home/jovyan/testing/ -it cdat/vcdat:<new version> jupyter-lab --port=9000
```
Note: Within browser, go to: localhost:9000, and enter the jupyterlab token from the console into the token field. Then you should see jupyter-vcdat in browser

- After test is successful and image is running properly, publish to docker hub:
```bash
docker push cdat/vcdat:<new version>
docker push cdat/vcdat:latest
```
