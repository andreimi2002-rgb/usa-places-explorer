/** Relative luminance of a #RRGGBB colour (WCAG formula), 0 for black to 1 for white. */
export function luminance(hex: string): number {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return 0;
  const [r, g, b] = m.slice(1).map((x) => {
    const c = parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * A team colour that stays visible on the site's dark background, for text and thin lines:
 * the first team colour bright enough (navy and black are skipped), or a lightened first colour.
 */
export function readableTeamColor(hexes: string[]): string | undefined {
  if (!hexes.length) return undefined;
  return hexes.find((h) => luminance(h) >= 0.1) ?? `color-mix(in srgb, ${hexes[0]} 45%, #fff)`;
}
