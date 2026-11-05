import type { APIRoute } from 'astro';
import { buildGraph } from '../lib/graph';

/** The full connection graph as static JSON, generated from the data at build time. */
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await buildGraph()), { headers: { 'Content-Type': 'application/json' } });
