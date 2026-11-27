// Serve the original verification file at its exact URL, without the Pages HTML redirect.
export function onRequest({ request, env }) {
  const asset = new URL(request.url);
  asset.pathname = "/googlea9122a02eb64d3ad";
  return env.ASSETS.fetch(new Request(asset, request));
}
