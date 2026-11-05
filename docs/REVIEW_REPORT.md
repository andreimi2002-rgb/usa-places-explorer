# Review Report — NBA skeleton + Orlando Magic pilot

Date: 2026-11-05. The live version of the automated list is the internal `/status` page.

## 1. What was delivered

| Area | Entities | Progress |
|---|---|---|
| Skeleton | NBA, 2 conferences, 6 divisions, 30 franchises, 30 team identities, 28 cities | stubs (`not-started`), facts from nba.com/teams |
| Pilot: team | Orlando Magic | `under-review` |
| Pilot: venues | Kia Center (current), Amway Arena (historical, 1989–2010) | `under-review` |
| Pilot: city | Orlando | `complete` |
| Pilot: rivalry | Heat–Magic | `under-review` |
| Pilot: people | Shaquille O'Neal, Anfernee Hardaway, Tracy McGrady, Dwight Howard, Nick Anderson, Pat Williams | `under-review` |
| Pilot: other | 4 championship records (1995 and 2009 Finals and East titles), 2 trades | — |
| Glossary | expansion team, NBA draft, draft lottery, trade, free agency, playoffs, NBA Finals, Hall of Fame | `under-review` |

## 2. Unverified facts (stored, hidden on the site)

| Entity | Field | Stored value | Why it is not verified | What would resolve it |
|---|---|---|---|---|
| Kia Center | `capacity.basketball` | 18,846 | Only a secondary source (Wikipedia); the venue's own rental page says about 18,500 | An official Magic or Kia Center figure for basketball seating |
| Kia Center | `owner` | City of Orlando | Only Wikipedia | A City of Orlando page on the venue |

## 3. Image licenses not yet checked by hand

| Entity | File | Stated license |
|---|---|---|
| Amway Arena | File:Amway Arena Exterior.jpg | Public domain (please confirm the reason on the Commons page) |

All other photos (Orlando Magic hero, Kia Center, Lake Eola, O'Neal, Hardaway, Howard, Anderson) were checked
on their Commons pages on 2026-11-05.

**Missing images:** Tracy McGrady, Pat Williams (no suitable free-license photo found yet).

## 4. Facts verified only against secondary sources

These are displayed, but a primary source would be better:

| Fact | Source used |
|---|---|
| Magic colors and hex codes | teamcolorcodes.com |
| Orlando population (307,573, 2020 census) | Wikipedia (the Census API needs a key) |
| 1993 draft-night trade (Webber for Hardaway + picks) | RealGM transactions |
| O'Neal signing with the Lakers, July 1996 | Deseret News, 1996 |
| Rivalry nickname "The Sunshine State rivalry" | Wikipedia |
| Orlando Magic Hall of Fame induction years (6 people) | ClickOrlando |

## 5. Placeholders

- **Logo:** `src/assets/logos/nba/orlando-magic.svg` is a placeholder (blue circle, star, "ORL"), not the
  official logo. Other teams show initials.

## 6. Prose checked and corrected during writing

These claims were removed or rewritten because no source confirmed them: winning the 1992 lottery as
described, "three straight first-round exits", "a city-built arena", superlatives about the fan base, and a
wrong time difference (Orlando is 5 hours behind London, not 6, for most of the year).

## 7. Open questions for you

1. **Accent color:** the site uses a blue accent (`#4d8dff`). Keep it, or pick another?
2. **Old PR #7** (`listing-enrichment` from the previous project) is archived in `archive/previous-project`. Close it?
3. **Fan culture:** the Orlando fan-culture section is short and careful. Should we invest in deeper sources
   (local press, team history books) for this section on every team?
4. **Launch:** when to switch `indexable` on, and whether to use official logos at launch.
5. **Kia Center capacity:** show "about 18,500" from the venue's page, or wait for an exact official figure?
