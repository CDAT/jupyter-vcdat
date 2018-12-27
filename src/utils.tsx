// call an external API
async function callApi(url: string) {
  const response = await fetch(url);
  const body = await response.json();
  if (response.status !== 200) throw Error(body.message);
  return body;
}

export { callApi };
