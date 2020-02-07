cd ..
npm pack
tar xzvf jupyter-vcdat-*.tgz && mv package deploy/local_package
rm jupyter-vcdat-*.tgz
cd deploy
jlpm
jlpm build
echo "----BUILDING DOCKER IMAGE----"
docker build -f DEV.Dockerfile -t cdat/vcdat:local-branch . && rm -r local_package
