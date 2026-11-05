import type { APIRoute } from 'astro';
import { siteConfig } from '../site.config';

/** Disallows everything until `siteConfig.indexable` is switched on. */
export const GET: APIRoute = () =>
  new Response(siteConfig.indexable ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n', {
    headers: { 'Content-Type': 'text/plain' },
  });
