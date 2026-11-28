/**
 * Wikimedia Commons thumbnails: the API returns a /thumb/ URL at 1600px when the
 * original is larger. Re-request a smaller standard width for cards. URLs that are
 * not thumbnails (original smaller than 1600px) are returned unchanged.
 */
export function commonsThumb(url: string, width: 330 | 500 | 960 | 1280): string {
  if (!url.includes("/wikipedia/commons/thumb/")) return url;
  return url.replace(/\/\d+px-([^/]+)$/, `/${width}px-$1`);
}
