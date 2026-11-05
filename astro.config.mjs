// @ts-check
import { writeFile } from 'node:fs/promises';
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import { siteConfig } from './src/site.config.ts';

/**
 * Writes Netlify's _headers so the whole site stays out of search engines until launch.
 * @returns {import('astro').AstroIntegration}
 */
function robotsHeaders() {
  return {
    name: 'robots-headers',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const body = siteConfig.indexable ? '' : '/*\n  X-Robots-Tag: noindex, nofollow\n';
        await writeFile(new URL('_headers', dir), body);
      },
    },
  };
}

export default defineConfig({
  site: siteConfig.url,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [mdx(), robotsHeaders()],
});
