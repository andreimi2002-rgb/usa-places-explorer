# Team Page Template

The route is `/teams/<franchise-id>/` (`src/pages/teams/[id].astro`). One page per **franchise**; identities
(names and cities over time) appear inside it. A stub franchise (`progress: not-started`) shows only the
sections it has data for, plus a progress note.

## 1. Sections, in order

| # | Section | Data | Prose (`src/content/prose/franchises/<id>/`) | Shown when |
|---|---|---|---|---|
| 1 | **Hero**: logo, name, league / conference / division, city, founded, home venue, titles count, color swatches | `name`, `league`, `division`, `founded`, `venues`, `colors`, `logo`, `image`, current identity's `city`, `championships` | — | always |
| 2 | **Why it matters**: the case for caring about this team, for a newcomer | `summary` | `why.mdx` | prose exists |
| 3 | **At a glance**: fact box with source links | `firstSeason`, `owner`, `headCoach` (with `asOf`), finals reached | — | at least one verified fact |
| 3b | **The club today** (full format): name, colours and mascot; ownership; how the current team is built; a franchise records table, retired numbers, the club's own Hall of Fame | `owner`, `corePlayers` | `overview.mdx` | prose exists |
| 4 | **History by eras**: one H3 per era, with years in the heading | `milestones` | `history.mdx` | prose exists |
| 5 | **Venue**: current home, photo, link to venue page, past homes | `venues[]` → `venues` collection | `venue.mdx` | a venue is linked |
| 5b | **Uniforms**: simplified drawings of the current set, plus a free-license game photo | `kits[]`, `kitPhoto` | — | a verified kit |
| 6 | **Championships & milestones**: a table of every NBA Finals appearance, then the milestone timeline | `championships`, `milestones` | — | any item |
| 7 | **Players** as trading cards, in four groups: Core players (`asOf` season), Rookies (`asOf` season), Legends, Notable players | `corePlayers`, `rookies`, `legends`, other `people` with a role here | — | any card |
| 8 | **Rivalries**: cards linking to rivalry pages | `rivalries` containing this franchise | — | any rivalry |
| 9 | **Fans and game day** (heading from the prose `title`) | city via current identity | `fan-culture.mdx` | prose exists |
| 9b | **For European fans** box: watching times, games in Europe, European players, when to visit | — | `europe.mdx` | prose exists |
| 10 | **Identity history**: every name/city the franchise has used | `team_identities` | — | always |
| 11 | **Mini-graph**: the franchise's neighborhood in the connection graph, plus a text list | computed by `src/lib/graph.ts` | — | always |
| 12 | **Local time and live weather**: city time vs. London, Bucharest and the visitor; current weather and 3 days (Open-Meteo, in the browser) | city `timezone`, `coordinates` | — | always (weather when coordinates exist) |
| 13 | **Sources and credits** | every `sources[]` + image credits | — | always |

**Writing guidance per prose section**

- `why.mdx`: 2–3 short paragraphs for any newcomer: what makes this club distinct. Link at least one `<Term>`.
- `overview.mdx` (full format): H3 sections "Name, colours and mascot", "Ownership", "How the current team is built",
  "Records and honours" (a markdown table of franchise career leaders from Basketball-Reference).
- `europe.mdx` (full format): everything Europe-specific lives here and nowhere else: tip-off times in Europe,
  games played in Europe, European-born players, when to visit.
- `history.mdx`: eras as `### Name (YYYY–YYYY)`, full format: records, playoff runs with opponents, coaches and key
  moves for every era. Facts only from the sources listed on the franchise.
- `venue.mdx`: one or two paragraphs: the building, where it is, what a visit is like (only sourced details).
- `fan-culture.mdx`: the city, the fan base and how the team fits into local life; no unsourced claims about
  attendance or popularity.

Use `<Term id="glossary-id">text</Term>` the first time a term appears. Unknown ids fail the build.

**Full format, other pages (model: Orlando Magic, 2026-11-06)**

- People: `honours[]` (Basketball-Reference "bling", whole career) shown as "Career honours"; facts gain "Born" and
  "Drafted"; `body.mdx` biography in H3 parts (arrival, years at the club, after, legacy). Award facts already in
  `honours` are hidden from the profile's Key facts box but still feed the card back.
- Venues: `facts[]` (address, tenants, events, nearest train) and `body.mdx` in parts: History, More than
  basketball, Getting there.
- Cities: `facts[]` (airport, climate, other teams), `body.mdx` in parts: The city, Sports in <city>, Visiting;
  `europe.mdx` for the time difference and travel tips.

## 2. Schema (franchise)

From `src/content.config.ts`. `fact<T>` = `{ value: T, source: url, verified: ISO date | null, note?: string }`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | `active` \| `historical` | yes | |
| `progress` | `not-started` \| `researching` \| `content-ready` \| `under-review` \| `complete` | yes | |
| `sources` | `[{ title, url, accessed }]` | yes | may be empty only for stubs |
| `name` | string | yes | current or last display name |
| `league` | ref `leagues` | yes | |
| `division` | ref `divisions` \| null | yes | null for leagues without divisions or for historical teams |
| `founded` | fact\<year\> | no | |
| `firstSeason` | fact\<"YYYY-YY"\> | no | |
| `colors` | `{ value: [{ name, hex }], source, verified }` | no | first color is the page accent |
| `logo` | `{ file: "<league>/<id>.svg", official, source, accessed }` | no | file in `src/assets/logos/`; initials are shown if missing; official logos are credited under the sources |
| `kits` | `[{ edition, season, base, panel?, trim?, pinstripes, wordmark?, maker?, description, source, verified }]` | no | `edition`: association, icon, statement, city, classic, home, away, third, alternate; colors as hex |
| `kitPhoto` | Commons image | no | a real game photo of a current uniform |
| `venues` | `[{ venue: ref, from: year, to: year\|null, source, verified }]` | no | `to: null` = current home |
| `headCoach` | `{ name, person?: ref, asOf: "YYYY-YY", source, verified }` | no | semi-current; always shows its season |
| `owner` | fact\<string\> | no | |
| `milestones` | `[{ date: "YYYY[-MM[-DD]]", label, kind, source, verified }]` | no | `kind`: founding, venue, draft, finals, award, trade, ownership, identity, other |
| `summary` | string | no | one line for cards and meta description |
| `image` | Commons image (see below) | no | hero background |

**Related collections a team page reads:** `team_identities` (`franchise`, `name`, `city`, `from`, `to`,
`current`), `championships` (`winner`, `runnerUp`, `level`, `season`, `result`), `people` (`roles[].franchise`),
`rivalries` (`franchises` tuple), `trades`, `venues`, `cities`.

**Image object:** `{ file: "File:…", url, page, author, license, licenseUrl, alt, caption?, licenseChecked }`.

## 3. JSON example

`src/data/franchises/orlando-magic.json` (shortened: two sources, two milestones).

```json
{
  "status": "active",
  "progress": "under-review",
  "sources": [
    {
      "title": "Orlando Magic unveil 30 Years of Pure Magic (NBA.com)",
      "url": "https://www.nba.com/magic/news/orlando-magic-unveil-30-years-pure-magic-20180808",
      "accessed": "2026-11-05"
    },
    {
      "title": "Season Review: 1989-90 (NBA.com)",
      "url": "https://www.nba.com/news/history-season-review-1989-90",
      "accessed": "2026-11-05"
    }
  ],
  "name": "Orlando Magic",
  "league": "nba",
  "division": "nba-southeast",
  "founded": {
    "value": 1989,
    "source": "https://www.nba.com/magic/news/orlando-magic-unveil-30-years-pure-magic-20180808",
    "verified": "2026-11-05",
    "note": "Franchise awarded April 22, 1987; first regular-season game November 4, 1989."
  },
  "firstSeason": {
    "value": "1989-90",
    "source": "https://www.nba.com/news/history-season-review-1989-90",
    "verified": "2026-11-05"
  },
  "colors": {
    "value": [
      {
        "name": "Magic Blue",
        "hex": "#0077C0"
      },
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Silver",
        "hex": "#C4CED4"
      }
    ],
    "source": "https://teamcolorcodes.com/orlando-magic-color-codes/",
    "verified": "2026-11-05"
  },
  "logo": {
    "file": "nba/orlando-magic.svg",
    "official": true,
    "source": "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg",
    "accessed": "2026-11-05"
  },
  "kits": [
    {
      "edition": "statement",
      "season": "2025-26",
      "base": "#000000",
      "panel": "#0077C0",
      "trim": "#C4CED4",
      "pinstripes": true,
      "wordmark": "MAGIC",
      "maker": "Jordan Brand",
      "description": "Black, inspired by the original warm-up jackets: a blue shoulder panel and two silver stripes framing the wordmark.",
      "source": "https://news.sportslogos.net/2025/06/03/orlando-magic-unveil-new-uniforms-logos-court-design/basketball/",
      "verified": "2026-11-05"
    }
  ],
  "venues": [
    {
      "venue": "amway-arena",
      "from": 1989,
      "to": 2010,
      "source": "https://news.pollstar.com/2012/03/30/say-goodbye-to-amway-arena/",
      "verified": "2026-11-05"
    },
    {
      "venue": "kia-center",
      "from": 2010,
      "to": null,
      "source": "https://www.kiacenter.com/news/detail/kia-center-celebrates-15-legendary-years",
      "verified": "2026-11-05"
    }
  ],
  "headCoach": {
    "name": "Sean Sweeney",
    "asOf": "2026-27",
    "source": "https://www.nba.com/news/magic-hire-sean-sweeney-coach",
    "verified": "2026-11-05"
  },
  "owner": {
    "value": "DeVos family (since September 1991)",
    "source": "https://www.nba.com/magic/devos-family",
    "verified": "2026-11-05"
  },
  "milestones": [
    {
      "date": "1987-04-22",
      "label": "The NBA awards Orlando an expansion franchise",
      "kind": "founding",
      "source": "https://www.nba.com/magic/news/orlando-magic-unveil-30-years-pure-magic-20180808",
      "verified": "2026-11-05"
    },
    {
      "date": "1989",
      "label": "Nick Anderson becomes the first draft pick in team history (11th overall)",
      "kind": "draft",
      "source": "https://www.basketball-reference.com/teams/ORL/draft.html",
      "verified": "2026-11-05"
    }
  ],
  "summary": "Florida’s expansion success story: two NBA Finals trips in its first twenty years and three No. 1 picks who changed the franchise.",
  "image": {
    "licenseChecked": "2026-11-05",
    "file": "File:AmwayCenterCourt.JPG",
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/AmwayCenterCourt.JPG/1280px-AmwayCenterCourt.JPG",
    "page": "https://commons.wikimedia.org/wiki/File:AmwayCenterCourt.JPG",
    "author": "350z33",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "alt": "View from the upper seats of a Magic home game, with the scoreboard over the court",
    "caption": "The first regular-season game at the new arena, October 2010"
  }
}
```

A **stub** (every other NBA franchise today) needs only:

```json
{ "status": "active", "progress": "not-started", "sources": [{ "title": "NBA Teams (NBA.com)", "url": "https://www.nba.com/teams", "accessed": "2026-11-05" }],
  "name": "Boston Celtics", "league": "nba", "division": "nba-atlantic" }
```

plus one `team_identities` file (for example `team_identities/boston-celtics.json`) linking the name to its city.

## 4. Uniform drawings

`src/components/Kit.astro` draws a jersey and shorts from one `kits[]` entry. It shows **only** what the data
records: base color, shoulder panel, two trim stripes (when a panel and trim are given), pinstripes and the
wordmark. The pinstripe color is a neutral contrast unless `trim` is set. The page states that the drawings are
simplified sketches, not the exact designs. Record a detail only when a source describes it or a free-license
photo clearly shows it.

## 5. Sport-specific extensions

Extensions are optional and never required for another sport. Today they live on venues
(`venues.extensions`); franchise extensions will be added the same way when a sport needs them.

| Sport | Venue extension | Planned franchise extension |
|---|---|---|
| Basketball | `basketball.courtName` | — |
| American football | `football.roof` (`open` \| `dome` \| `retractable`), `football.surface` | — |
| Baseball | `baseball.leftField`, `centerField`, `rightField` (facts, in feet) | spring-training site |
| Hockey | `hockey.rinkSize` | — |
| Soccer (MLS, NWSL) | to add: `soccer.pitchSize`, shared-stadium flag | academy / reserve team link |

Venue capacity is a record keyed by configuration (`{ "basketball": fact, "hockey": fact, "concert": fact }`),
so multi-sport arenas need no special case.

Team page sections stay the same for every sport; only the labels change (for example "tip-off" vs. "kickoff"
in the local-time widget).
