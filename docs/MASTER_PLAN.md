# American Sports Encyclopedia — Master Plan

## 1. Vision

An interconnected encyclopedia of US professional sports, written for Europeans who did not grow up with them.
It explains why a team matters, how it connects to its city, rivals, arenas and legends, and what its games
mean on European time. English first; Romanian later.

**It is not** a news, scores, schedules, standings or statistics site. Those exist elsewhere and go stale; we
write the parts that last.

## 2. Audience

- European fans who just discovered a league (through a streaming service, a game or a player from home).
- Travellers planning a game during a US trip.
- Curious readers who want context, not numbers.

Assume no prior knowledge. Every piece of jargon is explained the first time it appears.

## 3. The three differentiators (visible on every page)

| # | Differentiator | How it is built |
|---|---|---|
| 1 | **Beginner explanations** | Original prose in plain language; `<Term>` links every jargon word to the glossary with a tooltip. |
| 2 | **Connection graph** | Built at build time from the data relations (`src/lib/graph.ts`). Full explorer at `/graph/`, a mini-graph on each entity page. Nothing is drawn by hand. |
| 3 | **European angle** | Local-time widget (pure `Intl`, no API): city time vs. London, Bucharest and the visitor's own zone. Prose compares with European football where it helps. |

## 4. Scope

**Order of leagues**

1. NBA (in progress: skeleton + Orlando Magic pilot)
2. NFL, MLB, NHL
3. MLS, WNBA, NWSL, PWHL, UFL

**Rules**

- Historical entities are kept (defunct franchises, old arenas, former names) with `status: "historical"`.
- Never hard-code a team count. Counts are always computed from the data.
- Semi-current facts are allowed only with an `asOf` season: head coach and home venue.

**Out of scope:** full rosters, results, schedules, standings, statistics, paid APIs, any backend, user
accounts.

**Scope changes approved by the owner (2026-11-05):**
- **Core players** (3–5 faces of the current team, chosen from NBA.com's season previews) and **rookies** (first-year
  players on the current roster) are allowed as semi-current facts, always labelled with their season (`asOf`).
  A link to the official roster covers everyone else.
- **Live weather** for each city, loaded in the visitor's browser from Open-Meteo (free, no key, CC BY 4.0, credited
  under the widget). No server, no stored data; if the service is down the widget simply does not appear.
  Open-Meteo's free tier is for non-commercial use, so a paid plan is needed if the site ever carries ads.
- **City pages are hubs**: all teams in the city across every sport, teams that left, venues, rivalries, titles won
  there, local time and weather, and neighbouring cities in the same metro area. Generated from the data, so
  they grow with each new league.

## 5. Tech

- **Astro** (TypeScript, static output) on **Netlify**. No server code.
- **Content collections** with Zod schemas (`src/content.config.ts`):
  - structured facts as JSON in `src/data/<collection>/<id>.json`;
  - prose as MDX in `src/content/prose/<collection>/<id>/<section>.mdx`.
  - Invalid data, a broken reference or a missing source **fails the build**.
- **Pagefind** for search (static index, built after `astro build`).
- **Cytoscape** for the graph, loaded only on pages that show one.
- Scales to thousands of pages: every page is a static route generated from a collection; no per-page code.

## 6. Data model

Entities (one collection each): `sports`, `leagues`, `conferences`, `divisions`, `franchises`,
`team_identities`, `venues`, `cities`, `people`, `rivalries`, `championships`, `trades`, `glossary`.

**Every entity has:**

- `id` (the file name, kebab-case)
- `status`: `active` | `historical`
- `progress`: `not-started` → `researching` → `content-ready` → `under-review` → `complete`
- `sources`: `[{ title, url, accessed }]`

**Key facts** use `{ value, source, verified, note? }`. `verified` is the ISO date it was checked against the
source, or `null`. **A fact with `verified: null` is never displayed** and is listed on `/status` and in
`docs/REVIEW_REPORT.md`.

**Franchise vs. identity rule.** A *franchise* is the continuous legal club (one page, one history). A
*team identity* is a name + city it has played under. Relocations and renames add identities, never new
franchises. Lineage follows the league's official franchise history, which is sourced like any other fact. A franchise page lists all
its identities; old identities have no page of their own.

**Sport-specific extensions** are optional fields (for example, `venues.extensions.baseball` for outfield
distances). No sport is required to fill another sport's fields. See `docs/TEAM_PAGE_TEMPLATE.md`.

## 7. Content rules

1. **Never invent facts.** If it cannot be sourced, it is not written.
2. Prefer primary sources (league, team, venue sites), then reputable press, then reference sites. Wikipedia
   only as a last resort, and the fact is flagged in the review report.
3. Record the URL and access date for every source.
4. Original prose only. No close paraphrase of any source.
5. Warm, clear tone. Explain jargon the first time; link it with `<Term>`.
6. No superlatives or claims about "best" or "greatest" unless a source states them as fact (an award, a record).

## 8. Images and logos

- Photos: **Wikimedia Commons, free licenses only** (CC0, public domain, CC BY, CC BY-SA). Author, license
  and the file page are stored with the image and shown in the page credits. `licenseChecked` stays `null`
  until a person has checked the Commons page.
- **Logos:** official team logos (from the league's own site) in `src/assets/logos/<league>/<id>.svg`,
  referenced only through the data (`franchise.logo`, with its source). They are trademarks, shown small and
  only to identify the team, never as site branding. Each team page credits the logo's owner. If an owner
  asks, a logo is removed by swapping one file.
- **Uniforms:** our own simplified SVG drawings from sourced details (no logos on them), plus free-license
  game photos from Commons.
- Footer disclaimer on every page: *"Not affiliated with the NBA, NFL, MLB, NHL, MLS or any team. Team names
  and logos are trademarks of their respective owners."*

## 9. Indexing

The whole site is `noindex, nofollow` until launch, controlled by one switch: `indexable` in
`src/site.config.ts`. It drives the meta robots tag, the `X-Robots-Tag` header (`dist/_headers`) and
`robots.txt`.

## 10. Design

- Dark navy/charcoal background, one accent color (`--accent`), team colors as page accents.
- Condensed display headings (Barlow Condensed), readable body text (Inter), an editorial feel.
- Mobile first, accessible: skip link, visible focus, tooltips that also work on keyboard focus, a text list
  beside every graph.
- The design system is a small set of tokens and classes in `src/styles/global.css` plus a few components
  (`FactBox`, `Timeline`, `Photo`, `SourceList`, `LocalTime`, `MiniGraph`, `Term`, `Logo`, `EntityHeader`).

## 11. Phases

| Phase | Content | State |
|---|---|---|
| 0 | Archive the old project, scaffold the encyclopedia | Done |
| 1 | NBA skeleton (league, conferences, divisions, all current franchises as stubs) + Orlando Magic pilot | Done, under review |
| 2 | Remaining NBA franchises to `complete`, one at a time; key rivalries, legends, more glossary | Next, after review |
| 3 | NFL, MLB, NHL skeletons, then pilots; sport extensions in use | Planned |
| 4 | MLS, WNBA, NWSL, PWHL, UFL | Planned |
| 5 | Romanian translation (Astro i18n routes; data stays shared) | Planned |
| 6 | Launch: final license review, switch `indexable` on | Planned |

## 12. Progress tracking

- Each entity carries its own `progress` value; the internal `/status` page (noindex, not in search)
  shows progress per collection and the full review list.
- `docs/REVIEW_REPORT.md` is the human-readable version of the review list for each delivery.
- An entity only moves to `complete` after its review items are resolved.
