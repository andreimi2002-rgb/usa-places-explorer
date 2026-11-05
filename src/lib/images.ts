/**
 * Smaller Wikimedia thumbnail for small slots such as player cards.
 * Only rewrites URLs that are already thumbnails (so the original is known to be wider),
 * and only to a standard size: Wikimedia refuses other sizes when hotlinked.
 */
const STANDARD = [120, 250, 330, 500, 960, 1280, 1920] as const;

export function thumb(url: string, width: (typeof STANDARD)[number]): string {
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+\/)(\d+)px-([^/]+)$/);
  if (!m || Number(m[2]) <= width) return url;
  return `${m[1]}${width}px-${m[3]}`;
}
