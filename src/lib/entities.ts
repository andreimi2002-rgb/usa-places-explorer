/**
 * Read-side helpers over the content collections. Pages use these instead of
 * walking collections themselves, so relations are resolved in one place.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Franchise = CollectionEntry<'franchises'>;
export type Person = CollectionEntry<'people'>;

/** URL of an entity page. Kept here so every link is built the same way. */
export const routes = {
  leagues: (id: string) => `/leagues/${id}/`,
  franchises: (id: string) => `/teams/${id}/`,
  venues: (id: string) => `/venues/${id}/`,
  cities: (id: string) => `/cities/${id}/`,
  people: (id: string) => `/people/${id}/`,
  rivalries: (id: string) => `/rivalries/${id}/`,
  glossary: (id: string) => `/glossary/${id}/`,
} as const;

export async function identitiesOf(franchiseId: string) {
  const all = await getCollection('team_identities', (e) => e.data.franchise.id === franchiseId);
  return all.sort((a, b) => (a.data.from?.value ?? 0) - (b.data.from?.value ?? 0));
}

export async function currentIdentity(franchiseId: string) {
  return (await identitiesOf(franchiseId)).find((i) => i.data.current);
}

export async function cityOf(franchiseId: string) {
  const identity = await currentIdentity(franchiseId);
  return identity ? getEntry(identity.data.city) : undefined;
}

export async function peopleOf(franchiseId: string) {
  const people = await getCollection('people', (p) => p.data.roles.some((r) => r.franchise.id === franchiseId));
  return people.sort((a, b) => firstYear(a, franchiseId) - firstYear(b, franchiseId));
}

const firstYear = (p: Person, franchiseId: string) =>
  Math.min(...p.data.roles.filter((r) => r.franchise.id === franchiseId).map((r) => r.from));

export const rivalriesOf = (franchiseId: string) =>
  getCollection('rivalries', (r) => r.data.franchises.some((f) => f.id === franchiseId));

export const championshipsOf = (franchiseId: string) =>
  getCollection('championships', (c) => c.data.winner.id === franchiseId || c.data.runnerUp?.id === franchiseId);

export const tradesOf = (personId: string) => getCollection('trades', (t) => t.data.person.id === personId);

export const franchisesAtVenue = (venueId: string) =>
  getCollection('franchises', (f) => f.data.venues.some((v) => v.venue.id === venueId));

export async function franchisesInCity(cityId: string) {
  const ids = await getCollection('team_identities', (i) => i.data.city.id === cityId);
  const franchises = await Promise.all(ids.map((i) => getEntry(i.data.franchise)));
  return [...new Map(franchises.filter(Boolean).map((f) => [f!.id, f!])).values()];
}

let proseIds: Set<string> | undefined;

/** A prose section, e.g. prose("franchises", "orlando-magic", "why"); undefined when not written yet. */
export async function prose(collection: string, id: string, section: string) {
  proseIds ??= new Set((await getCollection('prose')).map((p) => p.id));
  const key = `${collection}/${id}/${section}`;
  return proseIds.has(key) ? getEntry('prose', key) : undefined;
}

/** League → conference → division for a franchise. */
export async function structureOf(f: Franchise) {
  const division = f.data.division ? await getEntry(f.data.division) : undefined;
  const conference = division ? await getEntry(division.data.conference) : undefined;
  const league = await getEntry(f.data.league);
  return { league, conference, division };
}
