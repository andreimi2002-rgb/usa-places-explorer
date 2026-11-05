/**
 * Site-wide settings. `indexable` is the single launch switch: while it is
 * false every page gets `noindex, nofollow`, robots.txt disallows everything
 * and Netlify sends an `X-Robots-Tag` header.
 */
export const siteConfig = {
  name: 'American Sports Encyclopedia',
  tagline: 'US pro sports, explained for Europeans',
  url: 'https://usa-places-explorer.netlify.app',
  indexable: false,
  /** Reference zones for the "local time vs. Europe" widget. */
  europeanZones: [
    { label: 'London', tz: 'Europe/London' },
    { label: 'Bucharest', tz: 'Europe/Bucharest' },
  ],
  disclaimer:
    'Not affiliated with the NBA, NFL, MLB, NHL, MLS or any team. Team names and logos are trademarks of their respective owners.',
} as const;
