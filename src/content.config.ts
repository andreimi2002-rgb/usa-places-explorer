/**
 * Content collections. Structured facts live in JSON under src/data/<collection>/,
 * hand-written prose in MDX under src/content/prose/. Every schema is strict:
 * invalid data, unknown references or missing provenance fail the build.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

const isoDate = z.iso.date();

/** A source used for an entity as a whole. */
const source = z.object({ title: z.string().min(1), url: z.url(), accessed: isoDate });

/**
 * A key fact with field-level provenance. `verified: null` means it could not be
 * confirmed: the site never displays it as fact and the review report lists it.
 */
const fact = <T extends z.ZodType>(value: T) =>
  z.object({
    value,
    source: z.url(),
    verified: isoDate.nullable(),
    note: z.string().optional(),
  });

/** A Wikimedia Commons photo with its credit. */
const image = z.object({
  file: z.string().startsWith('File:'),
  url: z.url(),
  page: z.url(),
  author: z.string().min(1),
  license: z.string().min(1),
  licenseUrl: z.url().nullable(),
  alt: z.string().min(1),
  caption: z.string().optional(),
  /** null until someone has checked the license on the Commons page by hand. */
  licenseChecked: isoDate.nullable(),
});

const status = z.enum(['active', 'historical']);
const progress = z.enum(['not-started', 'researching', 'content-ready', 'under-review', 'complete']);
const year = z.number().int().min(1850).max(2100);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

/** Fields every entity carries. */
const base = {
  status,
  progress,
  sources: z.array(source),
};

const data = (name: string) => glob({ pattern: '**/*.json', base: `./src/data/${name}` });

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const sports = defineCollection({
  loader: data('sports'),
  schema: z.object({ ...base, name: z.string(), summary: z.string() }),
});

const leagues = defineCollection({
  loader: data('leagues'),
  schema: z.object({
    ...base,
    name: z.string(),
    shortName: z.string(),
    sport: reference('sports'),
    country: z.string(),
    founded: fact(year).optional(),
    website: z.url().optional(),
    summary: z.string(),
  }),
});

const conferences = defineCollection({
  loader: data('conferences'),
  schema: z.object({ ...base, name: z.string(), league: reference('leagues'), order: z.number().int() }),
});

const divisions = defineCollection({
  loader: data('divisions'),
  schema: z.object({ ...base, name: z.string(), conference: reference('conferences'), order: z.number().int() }),
});

const headCoach = z.object({
  name: z.string(),
  person: reference('people').optional(),
  /** The season this was last confirmed for, e.g. "2026-27". */
  asOf: z.string().regex(/^\d{4}-\d{2}$/),
  source: z.url(),
  verified: isoDate.nullable(),
});

const milestone = z.object({
  date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
  label: z.string(),
  kind: z.enum(['founding', 'venue', 'draft', 'finals', 'award', 'trade', 'ownership', 'identity', 'other']),
  source: z.url(),
  verified: isoDate.nullable(),
});

const franchises = defineCollection({
  loader: data('franchises'),
  schema: z.object({
    ...base,
    /** Current or last display name, e.g. "Orlando Magic". */
    name: z.string(),
    league: reference('leagues'),
    division: reference('divisions').nullable(),
    founded: fact(year).optional(),
    firstSeason: fact(z.string().regex(/^\d{4}-\d{2}$/)).optional(),
    colors: z
      .object({ value: z.array(z.object({ name: z.string(), hex })), source: z.url(), verified: isoDate.nullable() })
      .optional(),
    /**
     * Logo file inside src/assets/logos, e.g. "nba/orlando-magic.svg". Official logos are
     * trademarks, shown small for identification only; `source` records where the file came from.
     */
    logo: z
      .object({
        file: z.string().regex(/^[a-z]+\/[a-z0-9-]+\.svg$/),
        official: z.boolean(),
        source: z.url().nullable(),
        accessed: isoDate.nullable(),
      })
      .optional(),
    /**
     * Current uniforms, drawn as simplified diagrams. Only details a source confirms are stored;
     * the drawing shows nothing else.
     */
    kits: z
      .array(
        z.object({
          edition: z.enum(['association', 'icon', 'statement', 'city', 'classic', 'home', 'away', 'third', 'alternate']),
          season: z.string().regex(/^\d{4}-\d{2}$/),
          base: hex,
          /** Shoulder panel color, when a source describes one. */
          panel: hex.optional(),
          /** Trim or stripe color, when a source describes one. */
          trim: hex.optional(),
          pinstripes: z.boolean().default(false),
          wordmark: z.string().optional(),
          maker: z.string().optional(),
          description: z.string(),
          source: z.url(),
          verified: isoDate.nullable(),
        }),
      )
      .default([]),
    /** A free-license photo of a current uniform in a game. */
    kitPhoto: image.optional(),
    /** The players and builders who define the club; shown first, as gold cards. */
    legends: z.array(reference('people')).default([]),
    /** The faces of the current roster (not the full roster), confirmed for one season. */
    corePlayers: z
      .object({
        asOf: z.string().regex(/^\d{4}-\d{2}$/),
        rosterUrl: z.url(),
        players: z.array(z.object({ person: reference('people'), source: z.url(), verified: isoDate.nullable() })),
      })
      .optional(),
    /** First-year players on the current roster, with their draft slot when they were drafted. */
    rookies: z
      .object({
        asOf: z.string().regex(/^\d{4}-\d{2}$/),
        players: z.array(
          z.object({
            person: reference('people'),
            draft: z.object({ year, round: z.number().int().min(1), pick: z.number().int().min(1) }).optional(),
            note: z.string().optional(),
            source: z.url(),
            verified: isoDate.nullable(),
          }),
        ),
      })
      .optional(),
    venues: z
      .array(z.object({ venue: reference('venues'), from: year, to: year.nullable(), source: z.url(), verified: isoDate.nullable() }))
      .default([]),
    headCoach: headCoach.optional(),
    owner: fact(z.string()).optional(),
    milestones: z.array(milestone).default([]),
    /** One line for cards and meta descriptions. Our own words. */
    summary: z.string().optional(),
    image: image.optional(),
  }),
});

const teamIdentities = defineCollection({
  loader: data('team_identities'),
  schema: z.object({
    ...base,
    franchise: reference('franchises'),
    name: z.string(),
    city: reference('cities'),
    from: fact(year).optional(),
    to: year.nullable(),
    current: z.boolean(),
  }),
});

/** Optional sport-specific venue details; none are required. */
const venueExtensions = z
  .object({
    basketball: z.object({ courtName: z.string().optional() }).optional(),
    football: z.object({ roof: z.enum(['open', 'dome', 'retractable']).optional(), surface: z.string().optional() }).optional(),
    baseball: z
      .object({ leftField: fact(z.number()).optional(), centerField: fact(z.number()).optional(), rightField: fact(z.number()).optional() })
      .optional(),
    hockey: z.object({ rinkSize: z.string().optional() }).optional(),
  })
  .optional();

const venues = defineCollection({
  loader: data('venues'),
  schema: z.object({
    ...base,
    name: z.string(),
    city: reference('cities'),
    opened: fact(z.string()).optional(),
    closed: fact(z.string()).optional(),
    capacity: z.record(z.string(), fact(z.number().int())).optional(),
    owner: fact(z.string()).optional(),
    formerNames: z.array(z.object({ name: z.string(), from: year.nullable(), to: year.nullable(), source: z.url(), verified: isoDate.nullable() })).default([]),
    summary: z.string().optional(),
    image: image.optional(),
    extensions: venueExtensions,
  }),
});

const cities = defineCollection({
  loader: data('cities'),
  schema: z.object({
    ...base,
    name: z.string(),
    region: z.string(),
    country: z.string(),
    /** IANA time zone, used by the local-time widget. */
    timezone: z.string().regex(/^[A-Za-z]+(\/[A-Za-z_]+)+$/),
    population: fact(z.number().int()).optional(),
    /** Metropolitan area shared with neighbouring cities, e.g. "San Francisco Bay Area". */
    metro: z.string().optional(),
    /** City-centre coordinates, used for the live weather widget. */
    coordinates: fact(z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) })).optional(),
    summary: z.string().optional(),
    image: image.optional(),
  }),
});

const people = defineCollection({
  loader: data('people'),
  schema: z.object({
    ...base,
    name: z.string(),
    /** Playing position, e.g. "Guard", "Forward", "Center", "Guard-Forward". */
    position: fact(z.string()).optional(),
    roles: z.array(
      z.object({
        franchise: reference('franchises'),
        role: z.enum(['player', 'head-coach', 'executive', 'owner', 'founder']),
        from: year,
        to: year.nullable(),
        source: z.url(),
        verified: isoDate.nullable(),
      }),
    ),
    facts: z.array(z.object({ label: z.string(), value: z.string(), source: z.url(), verified: isoDate.nullable() })).default([]),
    summary: z.string(),
    image: image.optional(),
  }),
});

const rivalries = defineCollection({
  loader: data('rivalries'),
  schema: z.object({
    ...base,
    name: z.string(),
    nickname: z.string().optional(),
    franchises: z.tuple([reference('franchises'), reference('franchises')]),
    facts: z.array(z.object({ label: z.string(), value: z.string(), source: z.url(), verified: isoDate.nullable() })).default([]),
    summary: z.string(),
    image: image.optional(),
  }),
});

const championships = defineCollection({
  loader: data('championships'),
  schema: z.object({
    ...base,
    league: reference('leagues'),
    season: z.string().regex(/^\d{4}-\d{2}$/),
    level: z.enum(['league', 'conference']),
    title: z.string(),
    /** The franchise, when it still exists in the data; defunct clubs only have a name. */
    winner: reference('franchises').optional(),
    runnerUp: reference('franchises').optional(),
    /** Team names as they were that season, e.g. "Minneapolis Lakers". */
    winnerName: z.string(),
    runnerUpName: z.string().optional(),
    result: z.string().optional(),
    source: z.url(),
    verified: isoDate.nullable(),
  }),
});

const trades = defineCollection({
  loader: data('trades'),
  schema: z.object({
    ...base,
    person: reference('people'),
    from: reference('franchises'),
    to: reference('franchises'),
    date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
    summary: z.string(),
    verified: isoDate.nullable(),
  }),
});

const glossary = defineCollection({
  loader: data('glossary'),
  schema: z.object({
    ...base,
    term: z.string(),
    /** Tooltip text: one or two plain sentences, our own words. */
    short: z.string().max(240),
    sports: z.array(reference('sports')).default([]),
    related: z.array(reference('glossary')).default([]),
  }),
});

/** Hand-written prose, one file per entity section: src/content/prose/<collection>/<id>/<section>.mdx */
const prose = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/prose' }),
  schema: z.object({ title: z.string().optional() }),
});

export const collections = {
  sports,
  leagues,
  conferences,
  divisions,
  franchises,
  team_identities: teamIdentities,
  venues,
  cities,
  people,
  rivalries,
  championships,
  trades,
  glossary,
  prose,
};
