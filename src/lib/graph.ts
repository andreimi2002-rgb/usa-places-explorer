/**
 * The connection graph, generated from entity relations at build time.
 * Nothing here is drawn by hand: add a relation to the data and it appears.
 */
import { getCollection } from 'astro:content';
import { routes } from './entities';

export type NodeType = 'league' | 'conference' | 'division' | 'franchise' | 'identity' | 'city' | 'venue' | 'person' | 'rivalry' | 'championship';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  href?: string;
  /** Not-started entities are drawn faded. */
  stub?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const key = (type: NodeType, id: string) => `${type}:${id}`;

let cached: Graph | undefined;

export async function buildGraph(): Promise<Graph> {
  if (cached) return cached;
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const node = (n: GraphNode) => nodes.set(n.id, n);
  const edge = (source: string, target: string, label: string) => {
    const id = `${source}->${target}:${label}`;
    edges.set(id, { id, source, target, label });
  };

  for (const l of await getCollection('leagues')) {
    node({ id: key('league', l.id), label: l.data.shortName, type: 'league', href: routes.leagues(l.id) });
  }
  for (const c of await getCollection('conferences')) {
    node({ id: key('conference', c.id), label: c.data.name, type: 'conference' });
    edge(key('conference', c.id), key('league', c.data.league.id), 'part of');
  }
  for (const d of await getCollection('divisions')) {
    node({ id: key('division', d.id), label: d.data.name, type: 'division' });
    edge(key('division', d.id), key('conference', d.data.conference.id), 'part of');
  }
  for (const c of await getCollection('cities')) {
    node({ id: key('city', c.id), label: c.data.name, type: 'city', href: routes.cities(c.id), stub: c.data.progress === 'not-started' });
  }
  for (const v of await getCollection('venues')) {
    node({ id: key('venue', v.id), label: v.data.name, type: 'venue', href: routes.venues(v.id), stub: v.data.progress === 'not-started' });
    edge(key('venue', v.id), key('city', v.data.city.id), 'in');
  }
  for (const f of await getCollection('franchises')) {
    const fk = key('franchise', f.id);
    node({ id: fk, label: f.data.name, type: 'franchise', href: routes.franchises(f.id), stub: f.data.progress === 'not-started' });
    if (f.data.division) edge(fk, key('division', f.data.division.id), 'plays in');
    for (const v of f.data.venues) edge(fk, key('venue', v.venue.id), v.to ? `home ${v.from}–${v.to}` : `home since ${v.from}`);
  }
  const identities = await getCollection('team_identities');
  // Only show identity nodes for franchises that have more than one identity;
  // otherwise the franchise links straight to its city.
  const counts = new Map<string, number>();
  for (const i of identities) counts.set(i.data.franchise.id, (counts.get(i.data.franchise.id) ?? 0) + 1);
  for (const i of identities) {
    const fk = key('franchise', i.data.franchise.id);
    if ((counts.get(i.data.franchise.id) ?? 0) > 1) {
      const ik = key('identity', i.id);
      node({ id: ik, label: i.data.name, type: 'identity' });
      edge(fk, ik, i.data.current ? 'current name' : 'former name');
      edge(ik, key('city', i.data.city.id), 'based in');
    } else {
      edge(fk, key('city', i.data.city.id), 'based in');
    }
  }
  for (const p of await getCollection('people')) {
    const pk = key('person', p.id);
    node({ id: pk, label: p.data.name, type: 'person', href: routes.people(p.id), stub: p.data.progress === 'not-started' });
    for (const r of p.data.roles) edge(pk, key('franchise', r.franchise.id), `${r.role.replace('-', ' ')} ${r.from}–${r.to ?? ''}`.trim());
  }
  for (const r of await getCollection('rivalries')) {
    const rk = key('rivalry', r.id);
    node({ id: rk, label: r.data.name, type: 'rivalry', href: routes.rivalries(r.id) });
    for (const f of r.data.franchises) edge(rk, key('franchise', f.id), 'rivalry');
  }
  for (const c of await getCollection('championships')) {
    // Only titles won are drawn; a node per lost Finals would crowd the graph.
    if (!c.data.winner) continue;
    const ck = key('championship', c.id);
    node({ id: ck, label: `${c.data.title} ${c.data.season}`, type: 'championship' });
    edge(key('franchise', c.data.winner.id), ck, 'won');
  }
  for (const t of await getCollection('trades')) {
    edge(key('person', t.data.person.id), key('franchise', t.data.to.id), `traded ${t.data.date.slice(0, 4)}`);
  }

  // Drop edges whose ends are missing (e.g. a reference to an unbuilt entity).
  const valid = [...edges.values()].filter((e) => nodes.has(e.source) && nodes.has(e.target));
  cached = { nodes: [...nodes.values()], edges: valid };
  return cached;
}

/** The neighborhood of one node, `depth` steps out, for mini-graphs. */
export async function neighborhood(type: NodeType, id: string, depth = 1, limit = 40): Promise<Graph> {
  const g = await buildGraph();
  const start = key(type, id);
  const keep = new Set([start]);
  let frontier = [start];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const e of g.edges) {
      for (const [a, b] of [[e.source, e.target], [e.target, e.source]] as const) {
        if (frontier.includes(a) && !keep.has(b) && keep.size < limit) {
          keep.add(b);
          next.push(b);
        }
      }
    }
    frontier = next;
  }
  return {
    nodes: g.nodes.filter((n) => keep.has(n.id)),
    edges: g.edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
  };
}

export const nodeKey = key;
