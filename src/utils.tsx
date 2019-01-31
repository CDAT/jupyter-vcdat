/**
 * @description fetch info from a remote url resource
 * @param url a url string to send the get request to, this should already be fully encoded
 */
async function callApi(url: string) {
  const response = await fetch(url);
  const body = await response.json();
  if (response.status !== 200) throw Error(body.message);
  return body;
}
/**
 * @description run an array of promises in serial
 * @param funcs an array of functions which wraps promises
 */
const serial = (funcs: any) =>
  funcs.reduce(
    (promise: Promise<any>, func: any) =>
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );
export { callApi, serial };
