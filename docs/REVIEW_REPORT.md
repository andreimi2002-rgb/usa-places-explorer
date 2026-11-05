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

None. Resolved on 2026-11-05:

| Entity | Field | Resolution |
|---|---|---|
| Kia Center | `capacity.basketball` | 18,846, from NBA.com's arena list (updated October 2026). The venue's 18,500 is its general figure. |
| Kia Center | `owner` | City of Orlando, from the city's own Venues page (owned and operated through the Orlando Venues Department). |

## 3. Images

All photos are checked on their Commons pages. Amway Arena's photo was released into the public domain by its
author (PD-user). New: Tracy McGrady (CC BY 2.0, 2016) and Pat Williams (public domain, 1971-72 Chicago Bulls
media guide published without a copyright notice).

## 4. Facts verified only against secondary sources

These are displayed, but a primary source would be better:

| Fact | Source used |
|---|---|
| Magic hex codes | blue taken from the official 2025 logo file (#0050B5); black and silver are approximations. The team publishes names, not codes. |
| Orlando population (307,573, 2020 census) | Wikipedia (the Census API needs a key) |
| 1993 draft-night trade (Webber for Hardaway + picks) | RealGM transactions |
| O'Neal signing with the Lakers, July 1996 | Deseret News, 1996 |
| Rivalry nickname "The Sunshine State rivalry" | Wikipedia |
| Orlando Magic Hall of Fame induction years (6 people) | ClickOrlando |

## 5. Logos and uniforms

- **Logos:** all 30 NBA franchises now use their official primary logo from cdn.nba.com (accessed 2026-11-05),
  credited on each team page. Orlando's is the new logo from the June 2025 rebrand.
- **Uniforms (Orlando only):** Association, Icon and Statement sets for 2025-26, drawn from the NBA.com
  announcement and SportsLogos.net; real photo: Goga Bitadze in the Statement uniform (CC BY 4.0). The City
  Edition is not included yet.
- **Team colors after the rebrand:** switched to the deeper blue of the new official logo (#0050B5), also used for the Icon uniform drawing.

## 6. Prose checked and corrected during writing

These claims were removed or rewritten because no source confirmed them: winning the 1992 lottery as
described, "three straight first-round exits", "a city-built arena", superlatives about the fan base, and a
wrong time difference (Orlando is 5 hours behind London, not 6, for most of the year).

## 7. Decisions taken (2026-11-05)

1. **Accent color:** keep the site blue (`#4d8dff`); team pages already switch to team colors.
2. **Old PR #7:** closed; the work stays in `archive/previous-project`.
3. **Fan culture:** kept short and sourced; deepened per team only where local press gives solid material.
4. **Launch:** `indexable` stays off until several NBA teams are complete.

---

# Lot 1 — Miami Heat, Los Angeles Lakers, Boston Celtics

Date: 2026-11-05. Branch `nba-teams` (one PR for all NBA teams; merged to production once, at the end).

## 1. What was added

| Area | Entities | Progress |
|---|---|---|
| Teams | Miami Heat, Los Angeles Lakers, Boston Celtics (all 12 sections; uniforms for the Lakers only) | `under-review` |
| Identities | Minneapolis Lakers (1947–1960), plus the current identity of each team | `complete` |
| Venues | Kaseya Center, Crypto.com Arena, TD Garden | `under-review` |
| Cities | Miami, Los Angeles, Boston | `content-ready` |
| People | Dwyane Wade, Alonzo Mourning, LeBron James, Pat Riley, Kobe Bryant, Magic Johnson, Kareem Abdul-Jabbar, Jerry West, George Mikan, Bill Russell, Red Auerbach, Larry Bird, Paul Pierce; Shaquille O'Neal extended with his Lakers, Heat and Celtics years | `under-review` |
| Rivalry | Celtics vs. Lakers | `under-review` |
| Glossary | Finals MVP, MVP, three-peat, player-coach, sign-and-trade | `complete` |
| Trades | Russell to Boston (1956), Abdul-Jabbar to the Lakers (1975) | `complete` |
| League-wide | **All 80 NBA Finals (1947–2026)** from NBA.com's champions list, so every team page, stubs included, now shows its real title count | `complete` |

## 2. Things to check

1. **Finals lineage.** Old team names are mapped to today's franchises, for example Syracuse Nationals → 76ers,
   Rochester Royals → Kings, St. Louis Hawks → Hawks, Fort Wayne Pistons → Pistons, Philadelphia/San Francisco
   Warriors → Warriors, Baltimore (1971) and Washington Bullets → Wizards. **Seattle SuperSonics → Oklahoma City
   Thunder** is the one some fans dispute. The 1948 champion (the original Baltimore Bullets) and the 1947 and 1949
   runners-up (Chicago Stags, Washington Capitols) no longer exist, so those records keep only the team names.
2. **Current facts (as of 2026-27)**: head coaches Spoelstra, Redick and Mazzulla, and LeBron James playing for the
   76ers this season, come from Basketball-Reference (secondary).
3. **Owners**: Lakers (Mark Walter) and Celtics (Bill Chisholm group) from NBA.com; Heat: Micky Arison described
   by NBA.com as "Chairman & Governor" and "in control since 1995".
4. **Team colors** for all three are read from the official logo files, with descriptive names.
5. **Uniforms**: only the Lakers have a sourced 2025-26 set. Celtics and Heat sources were too old or too thin.
6. **City populations** are not shown yet: the Census API needs a key.
7. **Historical arenas** (Boston Garden, the Forum, Miami Arena) are not covered yet.
8. **Player years** (draft, seasons, awards, Hall of Fame) come from Basketball-Reference, a reference site.
