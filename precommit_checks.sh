LOCAL_VCDAT_VERSION=`node -pe "require('./package.json').version"`
NPM_VCDAT_VERSION=`npm view jupyter-vcdat@nightly version`
function version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }
if version_gt $LOCAL_VCDAT_VERSION $NPM_VCDAT_VERSION; then
    echo "Version of $LOCAL_VCDAT_VERSION in the package.json looks good!"
else
    echo "Version $LOCAL_VCDAT_VERSION in package.json is not newer than npm version of $NPM_VCDAT_VERSION and will cause Publish job to fail."
    echo "You should update version $LOCAL_VCDAT_VERSION in package.json to a version greater than $NPM_VCDAT_VERSION"
    exit 1
fi