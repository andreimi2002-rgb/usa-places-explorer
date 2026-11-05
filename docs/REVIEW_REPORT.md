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

---

# Lot 2 — Trading cards, Finals tables, Bulls, Warriors, Knicks

Date: 2026-11-05. Same branch and PR (`nba-teams`, PR #10).

## 1. What was added

| Area | What |
|---|---|
| Design | Trading-card player cards (flip for facts): Legend (gold), Core, Rookie ("RC"), Notable. Original design, no Topps branding. Players without a free photo get a team-colored initials card. |
| Team pages | New sections: Core players (2026-27), Rookies (2026-27), Legends, Notable players, and a table of every NBA Finals appearance. |
| League page | "Every NBA champion" table (1947–2026) and the most-titles list. |
| Upgraded teams | Orlando Magic, Miami Heat, Los Angeles Lakers, Boston Celtics: core players, rookies and notable players. |
| New teams | Chicago Bulls, Golden State Warriors (with its Philadelphia, San Francisco and Oakland identities), New York Knicks (2026 champions). |
| Venues | United Center, Chase Center, Madison Square Garden. |
| Cities | Chicago, San Francisco, New York; Oakland added as a stub for the Warriors' 1971–2019 identity. |
| People | About 70 new: legends of the new teams (Jordan, Pippen, Phil Jackson, Curry, Barry, Chamberlain, Kerr, Reed, Frazier, Ewing), 2026-27 core players, rookies and notable former players. |
| Rivalry | Cavaliers vs. Warriors (four straight Finals, 2015–2018). |
| Glossary | Two-way contract, G League, rookie. |

## 2. How the player lists were chosen

- **Core players** follow NBA.com's 2026-27 season previews (dated September 22, 2026), not our own judgment.
- **Rookies** are the first-year players on each 2026-27 roster (Basketball-Reference). Draft slots come from
  the 2026 draft page. Some 2026 picks are not on their drafting team's roster (for example Orlando's pick 46,
  Felix Okpara), so they are not listed; draft-day trades were not traced.
- **Notable players**: years are from each club's all-time player list. **Titles on the card are computed**
  from the Finals data for the seasons a player was on the roster; a player who missed a title season
  through injury or a mid-season move could be credited wrongly. Please spot-check.
- Year ranges are first-to-last season with the club; gaps (for example Hedo Türkoğlu's 2009–10 season away
  from Orlando) are not shown.

## 3. Things to check

1. **2026 moves** (all from NBA.com): Giannis Antetokounmpo to Miami, Jaylen Brown to Philadelphia for Paul
   George, LeBron James to Philadelphia, the Knicks' 2026 title with Brunson as Finals MVP.
2. **Photos rejected** because Wikidata matched the wrong person or a group shot: Jaylen Brown, Horace Grant,
   Nic Claxton, OG Anunoby. Pau Gasol's photo was skipped for an unclear license. These players show the
   initials card.
3. **No free photo** for most rookies and some current players (Andrew Wiggins, Brandin Podziemski, Caleb
   Wilson and others).
4. **Bulls owner**: described as "Jerry Reinsdorf's group (chairman since 1985)"; the 2015 NBA.com feature
   is the source. Check that no change has happened since.
5. **Knicks owner**: MSG Sports, which announced a planned split of the Knicks and Rangers in 2026.

---

# Lot 3 — Weather, city hubs, card fixes, Spurs, Thunder, 76ers

Date: 2026-11-05. Same branch and PR (`nba-teams`, PR #10).

## 1. What was added

| Area | What |
|---|---|
| Cards | Card backs show at most 4 facts, with "Full profile" always visible; the name on the front links to the profile. Players without a free photo get a team-colored silhouette card. |
| Photos | Second search pass, directly in Commons: 17 more players now have photos (Jaylen Brown, Horace Grant, OG Anunoby, Walt Frazier and others). |
| Weather | Live weather (Open-Meteo) next to the local-time widget on team, venue and city pages; °C by default, °F toggle. City coordinates come from Open-Meteo's GeoNames geocoder, stored with the source. |
| City hubs | City pages list every team today (by sport and league), teams that left, titles won in the city, venues, rivalries and metro neighbours. |
| New teams | San Antonio Spurs (with the Dallas Chaparrals identity), Oklahoma City Thunder (with the Seattle SuperSonics identity), Philadelphia 76ers (with the Syracuse Nationals identity). |
| Venues | Frost Bank Center, Paycom Center, Xfinity Mobile Arena. |
| Cities | San Antonio, Oklahoma City, Philadelphia; Seattle and Syracuse added for the former identities. |
| People | Legends of the new teams (Duncan, Robinson, Gervin, Popovich, Gilgeous-Alexander, Westbrook, Payton, Wilkens, Schayes, Erving, Malone, Iverson), core players, rookies and notable players. |

## 2. Things to check

1. **Arena name in Philadelphia**: NBA.com's arena list (October 2026) still says "Wells Fargo Center", but the
   team announced the new name, Xfinity Mobile Arena, in May 2025. We use the new name.
2. **Paycom Center**: no official source found yet for its opening date, former names or owner, so those fields
   are empty.
3. **SuperSonics history**: shown as part of the Thunder franchise, as in NBA.com's records. Seattle's city page
   lists the SuperSonics as a team that left.
4. **Titles counted per city**: a title counts for a city when the team's name that season matches the identity
   in that city (for example the Minneapolis Lakers' five titles count for Minneapolis, not Los Angeles).
5. **Still without a photo** (silhouette cards): Allan Houston, Pau Gasol (license unclear), Brandin Podziemski and
   most 2026 rookies.

---

# Lot 4 — Pistons, Rockets, Bucks, Cavaliers, Pacers

Date: 2026-11-05. Same branch and PR (`nba-teams`, PR #10). Only the exceptions are listed here.

## Things to check

1. **Pistons' founding year**: we use 1941 (Fort Wayne Zollner Pistons, NBL), from NBA.com's "Behind the name";
   NBA.com's roster page says 1948, the year the team joined the BAA. Both are explained on the page.
2. **Cavaliers' arena**: NBA.com lists it as Rocket Arena. The earlier names (Gund Arena 1994–2005, Quicken Loans
   Arena 2005–2019) are sourced; the years of "Rocket Mortgage FieldHouse" and the switch to "Rocket Arena" are not,
   so that former name is stored but hidden.
3. **Opening dates missing**: Little Caesars Arena, Toyota Center and Gainbridge Fieldhouse show only their first
   NBA season (from NBA.com's arena list), not an exact opening date.
4. **Pacers' ABA titles** (1970, 1972, 1973) come from NBA.com but are not in the Finals table, which covers the
   NBA only.
5. **New links between teams** found while researching: Ben Wallace, Chuck Daly, Mark Price and Patrick Ewing all
   also played or coached in Orlando; Oscar Robertson is linked to the Cincinnati Royals (today's Kings).
6. **2026-27 moves**: Kevin Durant in Houston, James Harden in Cleveland, Tyler Herro and Kel'el Ware in Milwaukee
   (from the Antetokounmpo trade), all from Basketball-Reference rosters and NBA.com previews.

---

# Lot 5 — Nuggets, Jazz, Suns, Trail Blazers, Timberwolves

Date: 2026-11-05. Same branch and PR (`nba-teams`, PR #10). Only the exceptions are listed here.

## Things to check

1. **Portland**: new owner Tom Dundon (NBA approval in March 2026; one NBA.com article says April) and a new coach,
   Micah Nori, the club's third in under a year. No 2026-27 rookies on the roster, so that section is hidden.
2. **Arizona time**: Phoenix stays on Mountain Standard Time all year, so its gap to Europe changes twice a year;
   the city and team pages say so instead of giving a single number.
3. **Arena details**: Moda Center and Target Center show only their first NBA season; Mortgage Matchup Center has
   no former names stored because no source gave them with years.
4. **New links**: Aaron Gordon (Orlando 2014–2021), Alex English (Bucks, Pacers), Bill Walton (Celtics 1986 title),
   Rudy Gobert and Donovan Mitchell (Utah), Kevin Garnett's two Minnesota stints.
5. **Founding names**: Denver Rockets (ABA, 1967–1974) and New Orleans Jazz (1974–1979) are stored as former
   identities; Minneapolis now shows both the Lakers (1947–1960) and the Timberwolves.

---

# Lot 6 — Mavericks, Clippers, Kings, Grizzlies, Pelicans

Date: 2026-11-05. Same branch and PR (`nba-teams`, PR #10). Only the exceptions are listed here.

## Things to check

1. **Pelicans lineage**: the franchise starts in 2002 (New Orleans Hornets). The Charlotte Hornets' 1988–2002 history
   belongs to today's Charlotte franchise, as NBA.com describes the 2014 name transition. Charlotte is in lot 7.
2. **Kings' founding**: we start at the 1948-49 BAA season (Rochester Royals), as Basketball-Reference does; the
   team's NBL years before that are not covered yet.
3. **Clippers' arena city**: the Intuit Dome is in Inglewood, a separate city in the Los Angeles area; Inglewood and
   Los Angeles share the "Greater Los Angeles" metro on the city pages.
4. **Portland's rookies**: the club made no 2026 draft picks, so its page now says so instead of hiding the section.
5. **New links to Orlando**: Chris Webber (drafted first by Orlando in 1993, traded for Penny Hardaway) and Jamahl
   Mosley (Magic coach 2021–2026, now the Pelicans' coach).
6. **Memphis owner**: Robert Pera's control is sourced to a 2018 NBA.com release; no later change found.

---

# Lot 7 — Hawks, Hornets, Nets, Raptors, Wizards (all 30 NBA teams done)

Date: 2026-11-05. Same branch and PR (`nba-teams`, PR #10). Only the exceptions are listed here.

## Things to check

1. **Hornets lineage**: today's Charlotte franchise owns the 1988–2002 Hornets history and the Bobcats years
   (2004–2014); the 2002–2004 gap, when Charlotte had no team, is explained on the page.
2. **Nets cities**: for the identities we chose Uniondale (Long Island) for the New York Nets and East Rutherford
   for the New Jersey Nets, where they played longest. Their earlier arenas (Commack, Piscataway, Newark) are not
   shown. Please confirm this simplification.
3. **Former arena names** (Philips Arena, MCI Center) are stored but hidden because their years are not sourced.
4. **Bob Pettit** died on September 24, 2026 (NBA.com obituary); his page says so.
5. **New links to Orlando**: Dominique Wilkins (1998–99), Vince Carter (2009–2011), Felix Okpara (Orlando's 2026
   pick, now on a two-way deal in Washington).
6. **2026-27 moves**: Trae Young and Anthony Davis in Washington, Kawhi Leonard back in Toronto, LaMelo Ball in
   Minnesota, all from NBA.com previews and Basketball-Reference rosters.
7. **Unconfirmed nationalities removed**: Hannes Steinbach and Henri Veesaar no longer say "German" / "Estonian";
   no source confirmed them.

# Final NBA check (before the depth pass)

Date: 2026-11-06. Checked on the full build (528 pages).

- **Links**: 0 broken internal links, 0 broken anchors, no page without an inbound link.
- **Graph**: 645 nodes, 865 edges, no dangling or duplicate edges, no isolated nodes, every node link resolves.
  Identity nodes are drawn only for clubs with more than one name; titles only when the winner still exists
  (so the 1948 Baltimore Bullets title has no node). Both by design.
- **Titles**: 80 Finals, counts match the league record (Celtics 18, Lakers 17, Warriors 7, Bulls 6, Spurs 5, ...;
  2025-26 Knicks over Spurs).
- **Search**: tested 20 queries (teams, players with and without diacritics, venues, old names such as
  "Seattle SuperSonics"). All return the right page first. "salary cap" returns nothing: the glossary has no entry yet.
- **Mobile (375 px)**: all 531 pages checked. One overflow fixed (Detroit: a long unbroken photo credit); credit
  text now wraps everywhere.
- **Photos**: 403 images, all on upload.wikimedia.org under free licenses. 14 messy credits (file names, an email
  address) rewritten as plain "author; crop by editor". Bill Russell and Dan Issel credits now read "Unknown author",
  as on Commons (public domain). Player cards and city venue tiles now load the standard 500 px Wikimedia thumbnail
  instead of 960/1280 px.
- **Positions**: 225 former players had no position; added from their Basketball-Reference pages, found through each
  franchise's player list so the right person is matched. When several are listed, the card shows the first two and
  the full list is kept as a note.
- **Core players**: Clippers and Lakers had only two; added Max Strus (LAC) and Walker Kessler (LAL), both named in the
  NBA.com 2026-27 previews and on the Basketball-Reference rosters.

## Still open (for the depth pass)

- 97 people have no free photo.
- Uniform drawings exist only for the Magic and the Lakers.
- Conference titles are stored only for Orlando (1995, 2009).
