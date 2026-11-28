# America 360: Life — Game design bible (v0.2, 2026-11-28)

> **Goal: the most complete, detailed and realistic life simulator possible.** You live one life, year by year, in a real place. Every job, store, team, park, fish and price is real, or is clearly labeled as an estimate.
>
> Florida is the first state. When Florida is very detailed and realistic, the same model expands to other states (section 12).

This document is the single source of truth for the game. It lists every system we have agreed on, the real data each one uses, and a backlog of ideas. New ideas go into section 14 first, then move into a system when they are designed.

---

## 0. Decisions already made
| Topic | Decision |
|---|---|
| Name | **America 360: Life** |
| Genre | Original, year-by-year life simulator. No copying of another game's name, art, UI, stat names or texts |
| Interface language | English |
| First state | Florida, 6 metros: Jacksonville, Orlando, Miami, Tampa, Destin, Tallahassee |
| Start | Age **18** in **2026**. A childhood mode (birth → 18) may come later |
| Pace | One year per turn |
| Moving between cities | Yes |
| Mature content | Yes: realistic and direct (addiction, crime, prison, death causes), with real medical, legal and financial consequences. No gratuitous gore. A "Mature" setting, on by default |
| Difficulty | **Relaxed** (default) and **Realistic** |
| Use | Personal, non-commercial |
| Hosting | GitHub `life-sim-design` branch → Netlify **deploy previews only**. No production deploys unless explicitly requested |

## 1. Pillars
1. **Real numbers.** Wages, rents, taxes, prices, tuition, mortality and disaster odds come from dated public sources. Anything not sourced is a named **game estimate** (all estimates live in one place in code, `ASSUME`, so they can be audited and replaced).
2. **Real places and brands.** You work at real employers, shop at real chains, eat at real restaurants, watch real teams, fish real waters and visit real parks. The encyclopedia (Wikidata, OpenStreetMap) is the world database.
3. **Choices with consequences.** Decisions show up years later: debt, credit score, health habits, a criminal record, relationships, where you live.
4. **Inequality is real.** Being born poor or rich changes what is possible, as it does in real life.
5. **Transparent.** Every money figure can be traced to a source or an estimate. A seeded RNG makes every life replayable.
6. **Depth through data, not code.** Events, brands, products and places are content files, so the world grows without rewriting the engine.

## 2. Where we are (v0.1 prototype, live on the PR #17 preview at `/play`)
Built and tested:
- **Character creation:** name, sex (for life tables), city, difficulty. Random stats.
- **Each year:**
  - take-home pay (IRS 2026 brackets, FICA, no FL income tax);
  - HUD FY2026 rents;
  - living costs and a lifestyle choice (frugal / normal / lavish);
  - debt with interest, paid down automatically;
  - SSA mortality adjusted by health;
  - NOAA hurricane odds per metro;
  - random events.
- **Jobs:**
  - ~240 real occupations per metro with real wage percentiles (BLS OEWS);
  - entry requirements from BLS (education, experience);
  - real employers per metro;
  - raises, bonuses, layoffs (Florida Reemployment Assistance), firing;
  - Uber/DoorDash side gigs.
- **School:** real local colleges and universities, Bright Futures, student debt.
- **Home and moving:** rent studio–3BR, a roommate split, move back to the parents' home, move between the 6 metros.
- **Cars:** 14 models, cash or a 60-month loan, FL sales tax, insurance, a young-driver surcharge, depreciation, trade-in.
- **Activities:** real places from the encyclopedia with photos, trips to national parks and refuges (real distances), and local pro and college team games.
- **Outdoors:** 19 real fishing and hunting spots, 24 real species, licenses, hunter safety, a life list.
- **Health and social:** gym, doctor (insured or not), friends, nights out (DUI risk), chronic conditions.
- **Death:** an obituary and the life story. A New life button. Save in the browser.

## 3. Engine architecture (target)
The prototype is one engine file. To reach full depth it becomes a set of **systems**:

- **Systems.** Each system owns a slice of the state and declares:
  - its yearly tick;
  - its actions;
  - the events it can trigger.

  Systems: Family, Money, Credit, Career, Education, Housing, Vehicles, Possessions, Shopping, Health, Mind, Relationships, Law, Leisure, Outdoors, World (economy and climate), Death and legacy.
- **Events with choices, written as data** (`content/events/*.json`). Each event has:
  - conditions (age, city, job, stats, possessions, relationships, history flags);
  - a weight;
  - text;
  - **2–4 choices**, each with effects and possible **delayed consequences** (a flag that triggers later events).
  - Target: hundreds of events, then thousands.
- **NPCs** (people around you): parents, siblings, partners, children, friends, coworkers, bosses, neighbors. Each has age, job, health, personality traits, closeness to you and a memory of key moments. NPCs age, change jobs, marry, get sick and die.
- **Economy over time:**
  - inflation (BLS CPI history; projected forward);
  - wage growth;
  - interest rates (Freddie Mac mortgage history);
  - stock returns (historical S&P series);
  - recessions and booms that move unemployment, home prices and layoffs.

  A 2050 life has 2050 prices.
- **Time budget** instead of a flat 4 actions: work hours, school, commute, sleep and free time. A 60-hour job leaves less time for everything else.
- **Saves:** IndexedDB (localStorage is too small), several save slots, and export/import as a file. Versioned with migrations so old saves keep working.
- **Determinism and tests:**
  - every system has unit tests;
  - balance simulations of thousands of lives check realistic outcomes (median net worth by age, life expectancy, debt-free rates, home ownership rate).

## 4. Family of origin (new)
At 18 you already come from somewhere. The family is drawn from the **real household income distribution of the chosen metro (Census ACS)**, or the player picks one for a challenge.

**Family types (examples, combinable):**
- **Income class:** poor, working class, middle class, upper-middle, rich, very rich.
- **Structure:** two parents, single parent, divorced, raised by grandparents, foster care (ages out at 18).
- **Background:**
  - military family (Jacksonville Navy, Eglin and Hurlburt in Destin, MacDill in Tampa);
  - immigrant families (Cuban, Venezuelan, Haitian, Puerto Rican and others; strongest in Miami and Orlando);
  - a generational Florida family;
  - a family that just moved from up North.
- **Siblings:** 0–4, older or younger, each an NPC.

**What the family changes:**
| | Poor | Middle | Rich |
|---|---|---|---|
| Cash at 18 | ~$0; may need to send money home | small | savings or a trust fund |
| College | Pell Grant (real federal rules), work-study, loans | loans + some help | parents pay tuition, room and board |
| Car | none | maybe an old one | one bought for you |
| Safety net | none; risk of eviction or homelessness | can move back home | bailouts, lawyers, rehab paid for |
| Connections | — | some | referrals, internships, a job at the family firm |
| Inheritance | maybe debts | modest | large, with estate drama |
| Pressure | survival stress | normal | high expectations, family conflict |

**Parents are real NPCs:**
- They have real occupations with real local wages.
- They age, get sick and may need your care or money.
- They divorce, remarry, lend or borrow money, and die. A will and probate follow (Florida rules, simplified).

## 5. Money
- **Accounts:** cash, checking, savings (APY), credit union vs. big bank (real brands: Chase, Bank of America, Wells Fargo, VyStar, Suncoast…).
- **Credit score (FICO-like, 300–850):**
  - built from payment history, utilization, account age, mix and new credit;
  - it decides rent approval, loan rates and deposits.
- **Credit cards** with real-world APR ranges, minimum payments, late fees and balance transfers.
- **Loans:** student (federal rules: subsidized/unsubsidized, income-driven repayment, **PSLF** forgiveness for public-sector workers), auto, personal, payday (real Florida limits), mortgage, HELOC.
- **Taxes:**
  - federal brackets by year;
  - filing status (single, married, head of household);
  - child tax credit, the EITC, capital gains;
  - property tax with the Florida homestead exemption;
  - sales tax with county surtaxes;
  - self-employment tax.
- **Investing:**
  - 401(k) with the employer match, IRA and Roth IRA, a brokerage account with index funds or single stocks;
  - crypto (high volatility);
  - real estate rentals;
  - returns follow historical distributions.
- **Bankruptcy:** Chapter 7 and Chapter 13, simplified; the Florida homestead exemption protects your home (a real and famous rule).
- **Scams:** phone, romance, investment and contractor scams after hurricanes. They are more common at older ages, as in Florida reality.
- **Gambling:** Florida Lottery, Seminole Hard Rock casinos, sports betting (where legal), with an addiction risk.

## 6. Shopping and possessions (expanded)
Everything you can buy has a **real brand or model**, an approximate price, running costs, depreciation and effects. All prices are labeled estimates unless sourced.

### 6.1 Vehicles
- **Where you buy:**
  - new from a dealer (real local dealerships from OSM where available);
  - used from a dealer (CarMax, local lots), from a private seller or at an auction;
  - "buy here, pay here" lots for bad credit, with high APR, realistic for poor players.
- **How you pay:** cash, a loan (the rate depends on credit score and term: 36–84 months), or a **lease** (36 months, mileage limits).
- **Models:** dozens per class with model years, mileage and condition for used cars:
  - economy, midsize, SUV, minivan, pickup, EV/hybrid, luxury, sports, exotic;
  - classic cars that can **appreciate**.
- **Running costs:**
  - Florida insurance (age, record, city: Miami is highest);
  - fuel (EIA gas prices by year), maintenance by age and brand reliability;
  - registration, tolls (SunPass, E-ZPass areas);
  - parking (Miami, downtown).
- **Events:** recalls, breakdowns, accidents (fault, insurance claims, premium increases), theft, flooding (king tides, hurricanes), hail, lemon cars.
- **Other vehicles:**
  - motorcycles (Florida has no helmet requirement over 21 with insurance, a real rule; risk follows);
  - scooters and e-bikes;
  - **golf carts** (The Villages, beach towns);
  - **boats:** jon boat, bay boat, center console, pontoon, sailboat, yacht, with slip/marina fees, storage, insurance, maintenance and a boating safety card (real FL rule by birth year);
  - jet skis, RVs and campers, airplanes (pilot license).

### 6.2 Homes and real estate
- **Rent:** apartments, houses, rooms, mobile homes. Neighborhood tiers.
- **Buy:**
  - condos, townhouses, single-family homes, mobile homes, land, waterfront, vacation homes;
  - **timeshares** (Orlando, with realistic resale problems).
- **Mortgage:** conventional, FHA, VA (military), down payment, PMI, closing costs, escrow.
- **Florida-specific costs:**
  - homeowners insurance (the real Florida insurance crisis, Citizens Insurance as the last resort);
  - flood insurance (NFIP);
  - wind mitigation, HOA and condo fees;
  - **special assessments** after the 2021 Surfside condo collapse (new condo safety laws, real);
  - sinkholes, termites, roof age.
- **Renovations, landlording** (tenants, evictions, repairs), selling with realtor fees, property value following real metro trends.

### 6.3 Everyday purchases
- **Electronics:**
  - phones (iPhone, Galaxy, Pixel) with plans (Verizon, AT&T, T-Mobile, Mint…);
  - laptops, gaming consoles and PCs, TVs.
- **Home:** furniture (IKEA Jacksonville and Tampa, Rooms To Go, Ashley), appliances, hurricane gear (generators, shutters, impact windows).
- **Clothes and style:** budget vs. designer (Aventura Mall, Bal Harbour, St. Johns Town Center, the Mall at Millenia), jewelry, watches, tattoos, cosmetic surgery (real Miami reputation, with risks).
- **Subscriptions:** streaming, gym, theme park annual passes (Disney, Universal, Busch Gardens), meal kits, Costco/Sam's Club memberships.
- **Hobbies gear:** fishing rods and tackle, hunting gear and firearms (bought legally from real retailers such as Bass Pro Shops, with background checks and real Florida rules), golf clubs, surfboards, bikes, cameras, musical instruments.
- **Pets:** dogs and cats (shelter or breeder), vet bills, pet insurance; exotic pets (with real Florida permit rules).
- **Gifts** for NPCs affect relationships.

## 7. Brands and places in daily life (new)
The encyclopedia already knows **which brands exist in each city** (Wikidata and OSM), and OSM has **individual store locations**. The game uses them as real places to **shop, eat, work and hang out**.

- **Groceries:** Publix (employee-owned; working there can earn stock, as in reality), Winn-Dixie, Walmart, Target, Aldi, Costco, Sam's Club, Whole Foods, Trader Joe's, Sedano's (Miami). Where you shop changes your yearly food bill and health.
- **Restaurants and fast food:**
  - Waffle House (open after hurricanes), Denny's, IHOP;
  - Chick-fil-A (closed Sundays), McDonald's, Wendy's, Burger King (Miami HQ), Taco Bell;
  - Cracker Barrel, Olive Garden and LongHorn (Darden, Orlando HQ), Hooters (founded in Clearwater);
  - Cuban cafés in Miami, local seafood shacks.

  Eating out often affects money, Vitality and Mood.
- **Gas and convenience:** Wawa vs. RaceTrac vs. Circle K (a real Florida rivalry), Buc-ee's on road trips.
- **Pharmacy and health:** CVS, Walgreens, urgent care, hospital systems (the real employers already in the game).
- **Fitness:** Planet Fitness, LA Fitness, Orangetheory, CrossFit gyms.
- **Banks:** Chase, Bank of America, Wells Fargo, Truist, VyStar, Suncoast.
- **Fun:** Dave & Buster's, Topgolf, bowling, movie theaters (AMC, Regal), bars and clubs (South Beach, Ybor City, Destin Harbor), concerts and festivals.

**Each brand place has:**
- actions: buy, eat, work there, apply, hang out;
- a price tier: budget / mid / premium (estimates);
- effects and events (a robbery at a gas station at night, meeting someone at the gym, a food poisoning risk…);
- jobs with **real wages** for that occupation in that metro.

**Habits:** what you buy and where builds habits over years (fast food → health; Costco → savings; gym → Vitality). Loyalty unlocks brand events.

**Legal note:** brands appear factually as places to work and shop. The game is fiction, unaffiliated, with no endorsement implied.

## 8. Career and education (expanded)
- **Applying:** applications, interviews (stat checks and choices), references, background checks (a criminal record matters), drug tests.
- **At work:**
  - performance, promotions with real title ladders (e.g. cashier → shift lead → assistant manager → store manager), coworker and boss NPCs, office politics;
  - overtime, shift work, unions (where relevant), workplace injuries (workers' comp), harassment events;
  - **tips** for service jobs, as real income.
- **Paths:**
  - **military:** Navy, Air Force, Army, Marines, Coast Guard, with real local bases; GI Bill and VA loans;
  - **trades:** apprenticeships, electrician, plumber, HVAC (huge in Florida);
  - **licenses:** nursing (NCLEX), real estate, CDL truck driving, cosmetology, teaching certificate, the bar exam, medical residency;
  - **government:** State of Florida in Tallahassee, city and county, police and fire academies;
  - **entrepreneurship:** food truck, lawn care, pressure washing, a fishing charter in Destin, a restaurant, a real estate business, a tech startup. Revenue, staff, taxes and failure odds;
  - **gig economy and creators:** Uber, DoorDash, Instacart, TaskRabbit, YouTube or influencer;
  - **retirement:** Social Security (claiming age 62–70), pensions (Florida Retirement System), part-time work.
- **Education:**
  - real colleges and universities with real tuition, admission rates and graduation rates (College Scorecard);
  - majors linked to careers; GPA; dropping out; grad school; online degrees;
  - for-profit colleges (with realistic debt traps).

## 9. Health, body and mind
- **Mortality and disease:**
  - mortality from the SSA life table, modified by lifestyle and conditions;
  - diseases by real age incidence (CDC, SEER for cancer): diagnosis, treatment cost, survival odds.
- **Insurance:**
  - employer plans, ACA marketplace with subsidies;
  - Florida did not expand Medicaid, so many low-income adults have no coverage (a real gap);
  - Medicare at 65;
  - medical debt.
- **Habits:** diet, exercise, sleep, smoking, vaping, alcohol, drugs (prescription and illegal), with addiction mechanics, overdoses, rehab and relapse.
- **Mental health:** depression, anxiety, burnout, therapy, medication, crisis events (handled seriously, with real hotline info shown).
- **Body:** weight, fitness level, appearance, aging, cosmetic procedures.
- **Florida specifics:** heat illness, sunburn and skin cancer, mosquito-borne illness (rare), shark bites (very rare; real Florida statistics), lightning strikes (Florida is the US lightning capital), alligator encounters, red tide breathing problems.

## 10. Relationships, law and society
- **Relationships:**
  - friends, dating (apps, work, church, gym, bars), sex and protection, pregnancy;
  - moving in, engagement, marriage (cost of a wedding), divorce (Florida no-fault divorce, alimony and child support, simplified);
  - children with their own lives: daycare cost (DOL childcare price data), schools, college costs.
- **Law and crime:**
  - victim events (theft, burglary, assault, identity theft, scams);
  - committing crimes (shoplifting, DUI, drugs, fraud, violence) with arrest odds, bail, a public defender vs. a private lawyer, plea deals;
  - real Florida penalty ranges (Florida Statutes), probation, jail and prison time, a criminal record affecting jobs and housing;
  - lawsuits (car accidents, slip and fall, landlord disputes); small claims court; jury duty.
- **Society:** voting, local politics, religion and church community, volunteering, social media reputation, language skills (Spanish in Miami helps with jobs).

## 11. World, climate and Florida flavor
- **Hurricanes:**
  - real odds per metro (NOAA);
  - the season runs June–November;
  - evacuation decisions, shelters, damage by home type and insurance, FEMA aid, price gouging, long power outages, contractor fraud.
- **Other hazards:** king tide flooding (Miami), red tide (Gulf), heat waves, sinkholes, wildfires (Panhandle), cold snaps (iguanas falling from trees in Miami).
- **Economy events:** tourism booms and busts (Orlando, Destin), state budget cycles (Tallahassee), military deployments (Jacksonville, Destin), the insurance crisis, housing booms and crashes (2008-style).
- **Space:** rocket launches visible from Orlando, jobs on the Space Coast.
- **Leisure:**
  - theme parks, beaches, springs, the Keys, spring break, Daytona events, Gasparilla (Tampa);
  - Art Basel (Miami), Florida–Georgia game weekend, college football Saturdays.
- **Outdoors:**
  - fishing and hunting with real species and spots (expanding: seasons, bag limits, tournaments, trophies, guide work);
  - diving and snorkeling (reefs, wrecks, springs), surfing, kayaking, camping in state parks.

## 12. Expanding to other states
Each state becomes a **state pack** with the same structure, so the engine never changes per state:

| Pack piece | Source pattern |
|---|---|
| Metros and their counties | Census CBSA |
| Wages | BLS OEWS metro files |
| Rents, home values | HUD FMR, Census ACS / Zillow |
| State and local taxes | state revenue department (many states have an income tax) |
| Hazards | NOAA (hurricanes, tornadoes), USGS (earthquakes), wildfire data, winter storms |
| Places, brands, employers, teams | the encyclopedia pipeline already built for Florida |
| Outdoors | real species and spots per state (e.g. elk in Colorado, salmon in Alaska, walleye in Minnesota) |
| State rules | licenses, drinking/driving laws, gun laws, minimum wage, Medicaid status, specific programs (like Bright Futures) |

Moving between states becomes a life decision (taxes, climate, costs, jobs).

## 13. Development stages
The full phased plan (short to long term, including the fixes from the external play-test) is in [LIFE_SIM_ROADMAP.md](LIFE_SIM_ROADMAP.md).

## 14. Ideas backlog
Add anything here, even half-formed. Items move into sections 4–11 when designed.
- Achievements (catch a tarpon, see every local team, millionaire by 40, survive 5 hurricanes, visit every national park in the state).
- A newspaper-style obituary and yearly "local news" headlines (original satire, no real private people).
- Wills, trusts and inheritance fights.
- Pets with personalities that age and die.
- Hobbies as skill trees (fishing, cooking, music, sports).
- Weather of the year shown on the year card.
- A "lifetime stats" screen: money earned, taxes paid, miles driven, fish caught, games attended.
- Photo album: real Commons photos of the places you visited, in the order you visited them.
- Owner ideas to come.

## 15. Data sources (current and planned)
| Data | Source | Status |
|---|---|---|
| Wages by occupation and metro | BLS OEWS May 2024 | ✅ in game |
| Entry education and experience | BLS Employment Projections | ✅ |
| Federal taxes, FICA | IRS tax year 2026 | ✅ (SS wage base to confirm) |
| Rents | HUD FMR FY2026 | ✅ |
| Mortality | SSA period life table 2023 | ✅ |
| Hurricane odds | NOAA HURDAT2 1950–2025 | ✅ |
| Places, parks, trips | Wikidata, Wikipedia, Commons | ✅ |
| Fish and game species, spots | Wikidata | ✅ |
| Employers, teams, cars | curated lists (estimates for prices) | ✅ (to verify) |
| Household income distribution | Census ACS | planned (stage 2) |
| Inflation | BLS CPI | planned (stage 1) |
| Mortgage rates | Freddie Mac PMMS | planned (stage 5) |
| Home values | Census ACS / Zillow ZHVI (check terms) / FHFA HPI | planned (stage 5) |
| Tuition, admissions | College Scorecard | planned |
| Childcare prices | DOL National Database of Childcare Prices | planned (stage 2) |
| Disease incidence | CDC, SEER | planned (stage 6) |
| Marriage, divorce, births | CDC NCHS | planned (stage 2) |
| Crime by county | FDLE | planned (stage 7) |
| Gas prices | EIA | planned (stage 4) |
| County sales surtaxes, millage | FL Dept. of Revenue | blocked (site unreachable); retry |
| Fishing/hunting license prices | FWC | blocked for automation; verify by hand |
| Store locations | OpenStreetMap (ODbL, attribution) | planned (stage 4) |

## 16. Simplifications (documented on purpose)
- One player's view; NPCs run simplified yearly lives.
- Money is yearly in the UI (monthly math in the background where it matters).
- Prices for brands, cars, tickets and products are representative estimates, labeled in the game.
- Health and legal systems follow statistics and simplified rules; the game is not medical or legal advice.
- Real brands, employers and teams appear factually; the game is fiction and unaffiliated.
