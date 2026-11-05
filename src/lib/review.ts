/**
 * Finds everything that needs a human look: facts with `verified: null` and
 * photos whose license has not been checked. Used by /status; the same list
 * is mirrored in docs/REVIEW_REPORT.md.
 */
import { getCollection } from 'astro:content';

export interface ReviewItem {
  collection: string;
  id: string;
  path: string;
  kind: 'unverified-fact' | 'image-license';
  detail: string;
}

const COLLECTIONS = ['leagues', 'franchises', 'team_identities', 'venues', 'cities', 'people', 'rivalries', 'championships', 'trades', 'glossary'] as const;

function walk(node: unknown, path: string, out: { path: string; node: Record<string, unknown> }[]) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n, i) => walk(n, `${path}[${i}]`, out));
    return;
  }
  const obj = node as Record<string, unknown>;
  if ('verified' in obj || 'licenseChecked' in obj) out.push({ path, node: obj });
  for (const [k, v] of Object.entries(obj)) if (typeof v === 'object' && !('collection' in (v ?? {}))) walk(v, path ? `${path}.${k}` : k, out);
}

export async function reviewItems(): Promise<ReviewItem[]> {
  const items: ReviewItem[] = [];
  for (const c of COLLECTIONS) {
    for (const e of await getCollection(c)) {
      const found: { path: string; node: Record<string, unknown> }[] = [];
      walk(e.data, '', found);
      for (const { path, node } of found) {
        if ('verified' in node && node.verified === null) {
          items.push({ collection: c, id: e.id, path: path || '(entity)', kind: 'unverified-fact', detail: `${JSON.stringify(node.value ?? node.label ?? node.name ?? '')}${node.note ? ` (${node.note})` : ''}` });
        }
        if ('licenseChecked' in node && node.licenseChecked === null) {
          items.push({ collection: c, id: e.id, path, kind: 'image-license', detail: String(node.file ?? '') });
        }
      }
    }
  }
  return items;
}
