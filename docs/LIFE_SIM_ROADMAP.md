# America 360: Life — Development roadmap (2026-11-28)

This plan turns the v0.1 prototype into the most complete and realistic life simulator we can build: Florida first, then other states. It combines:
- everything agreed in the design bible ([LIFE_SIM_DESIGN.md](LIFE_SIM_DESIGN.md));
- the owner's requests in conversation;
- the findings of the external play-test report (two characters, ages 18–21, all menus).

**Guiding rule (from the play-test, and we agree): deepen and fix what exists before adding breadth.** Each phase makes the game more trustworthy and more interesting to play. New catalogs (more jobs, more places) come after the systems under them are solid.

Each phase is delivered on the PR #17 deploy preview (no production deploys unless requested). The owner plays it. Findings go back into the next phase.

**Effort** is in working sessions (one session ≈ one long focused block of work like the ones so far). These are estimates; data access problems (blocked government sites, manual downloads) can add time.

---

## Overview

| Horizon | Phase | Theme | Effort |
|---|---|---|---|
| Short term | 0.5 | Fixes and trust | 1–2 |
| Short term | 1 | Foundation: systems, events with choices, NPCs, economy over time, saves | 3–4 |
| Medium term | 2 | Careers and education with real pathways | 3–4 |
| Medium term | 3 | Family of origin and relationships | 3–4 |
| Medium term | 4 | Money depth: banking, credit, loans, investing | 3 |
| Medium term | 5 | Shopping, brands and possessions (vehicles and everything else) | 4 |
| Medium term | 6 | Homes: buying, mortgages, Florida insurance, neighborhoods | 3 |
| Long term | 7 | Health and mind | 3 |
| Long term | 8 | Law and crime | 2–3 |
| Long term | 9 | Places, travel and the outdoors in depth | 3 |
| Long term | 10 | Florida world: economy, climate, culture | 2 |
| Long term | 11 | Content, UX polish, achievements | 3–4 |
| Long term | 12 | Balance and QA at scale | 2 |
| Long term | 13 | Childhood mode and generations | 3–4 |
| Long term | 14 | Other states (state packs) | 4+ per state |

---

## Phase 0.5 — Fixes and trust (short term)
**Why first:** players must trust the numbers before we add more of them. All items below were confirmed in the code after the play-test.

**Money correctness:**
- Renting requires the deposit in cash. If you can't pay it, the game explains why and offers alternatives (a cheaper unit, a roommate, staying at home).
- Moving between cities applies the same rental rules. If you don't qualify, you get temporary options: a room in a shared house, an extended-stay motel or a friend's couch, with their costs.
- The header shows **total liabilities**, with a breakdown: student, credit/consumer and auto loan.
- **Complete yearly statement:**
  - opening cash;
  - every income line (wages, side gigs, unemployment benefits, bonuses);
  - every expense line (rent, basics, lifestyle, car, tuition, actions);
  - financing (new borrowing, repayments, interest);
  - closing cash.

  It is saved with that year's city and cost assumptions.
- **Pay from the hire month:** a new job pays only for the months worked that year (same for leaving a job).
- Living costs are split into **"needs"** and **"lifestyle (grows with income)"**, with the rule explained on screen.
- **Debt repayment control:** minimum payments / accelerated / build an emergency fund first.
- Percentages formatted cleanly (7%, not 7.000000000000001%).

**Realism quick wins:**
- **Fishing licenses as FWC sells them:** separate freshwater and saltwater licenses, a combo license, and the real exemptions (65+, under 16). Prices verified by hand.
- **Minimum ages and first licensing paths:**
  - police officer: 19+ and police academy;
  - nurses: a nursing program plus the NCLEX exam (LPN and RN);
  - truck drivers: CDL;
  - minimum age 21 where real (bartending rules, Uber driver, etc.).

**Places cleanup:**
- Merge duplicate destinations (e.g. Fort Matanzas monument and its visitor center).
- Sentence-aware descriptions (no "The St."), expandable.
- Current names for renamed venues (EverBank Stadium, not EverBank Field).
- Show each place's real municipality.
- Say how distance is measured. Use an estimated driving distance and time (straight line × road factor, labeled) until real routing exists.
- Travel without a car costs more and takes longer; very remote trips need a car or a paid ride.

**UI clarity:**
- Every action button shows its money cost and whether it uses a free-time action.
- Unavailable actions are **disabled with the reason visible** (not clickable then rejected).
- Specific button labels ("Apply: Cashier", "Go to the Jaguars game") for scanning and screen readers.
- Mobile:
  - section navigation without horizontal scrolling (a grid or menu);
  - compact stats header;
  - the Age up button always reachable.

**Done when:** all confirmed defects are fixed with tests; a balance run still matches real medians; the owner re-plays the same scenarios as the report.

---

## Phase 1 — Foundation (short term)
**Why:** everything after this (family, credit, crime, brands) needs these building blocks.

- **Systems architecture:** the engine is split into systems: Money, Career, Education, Housing, Vehicles, Possessions, Health, Mind, Relationships, Law, Leisure, Outdoors, World, Legacy. Each owns its state, its yearly tick, its actions and its events.
- **Events as data, with choices:**
  - JSON event files: conditions, weights, text and 2–4 choices;
  - effects can be immediate or **delayed** (flags that trigger later events);
  - authoring rules and a validator (Zod) so content can grow safely to thousands of events.
- **NPC model:** people with age, sex, job, income, health, traits, closeness and shared memories. They age every year and can die (the same SSA tables).
- **Economy over time:**
  - inflation (BLS CPI history; a projection for future years);
  - wage growth;
  - interest-rate history;
  - a business-cycle model (recessions and booms) that moves layoffs, hiring odds and asset prices.
- **Time budget:** free-time hours instead of a flat 4 actions. Work hours, school, commute and caregiving use time; actions cost time.
- **Next-year budget preview:** before Age up, the screen shows expected income, taxes, every cost, debt payments and closing cash, with warnings ("you will run out of money in month 8").
- **Saves:**
  - IndexedDB instead of localStorage;
  - several save slots;
  - export/import as a file;
  - versioned migrations;
  - corrupted-save recovery.
- **Finance screen:** a full ledger by year and charts (net worth, income, debt) over the life.

**Done when:** the current game runs on the new architecture with the same results, plus choices in at least 30 events, NPC parents and a full finance screen.

---

## Phase 2 — Careers and education with real pathways (medium term)
**Why next:** the play-test found the career and education systems too generic. They are the core of a life sim.

- **Occupation pathways:** for each major occupation family, a real path: requirements, training length, cost, exams, licenses, minimum ages.
  - **Health:** CNA, LPN and RN (nursing school + NCLEX), medical school + residency, pharmacy, dental hygiene, EMT/paramedic.
  - **Public safety:** police academy (FDLE certification), corrections, firefighter (Fire Academy + EMT), sheriff's office vs. city police vs. federal roles.
  - **Trades:** apprenticeships (electrician, plumber, HVAC, welding), state contractor licenses.
  - **Transport:** CDL A/B, pilots (flight school), maritime jobs.
  - **Law:** law school + Florida Bar exam.
  - **Teaching:** a degree + teaching certification.
  - **Real estate:** pre-license course + state exam.
  - **Beauty:** cosmetology license.
  - **Military:** enlist or go officer (ROTC), real local bases, deployments, GI Bill, VA benefits.
- **Promotion ladders** inside each occupation family (e.g. cashier → shift lead → assistant manager → store manager → district manager), with real wage percentiles used for the levels.
- **Work life:**
  - schedules (full-time, part-time, shifts, overtime);
  - tips for service jobs;
  - role-specific events with choices (a nurse's double shift, a police use-of-force decision, a server's bad customer);
  - coworker and boss NPCs;
  - unions where relevant, workplace injuries and workers' comp.
- **Hiring realism:**
  - applications cost time, not a full action each;
  - several applications per year, interviews with choices;
  - background checks (record), drug tests, references, networking and referrals.
- **Education depth:**
  - majors linked to career paths, GPA, course load (full/part-time), attendance, failing classes, switching majors;
  - internships, campus jobs, scholarships;
  - FAFSA and Pell Grant rules, Bright Futures tiers;
  - real tuition and admissions (College Scorecard);
  - online and for-profit colleges (with realistic debt and outcomes).

**Done when:** you can't become a nurse or police officer without the real path. At least 25 career families have pathways and ladders. School has majors and GPA.

---

## Phase 3 — Family of origin and relationships (medium term)
- **Family of origin at 18**, drawn from the real household income distribution of the metro (Census ACS), or chosen:
  - classes: poor → very rich;
  - structures: two parents, single parent, divorced, grandparents, foster care;
  - backgrounds: military, immigrant families (Cuban, Venezuelan, Haitian, Puerto Rican…), generational Floridians, recent arrivals;
  - siblings.
- **What it changes:**
  - starting money;
  - who pays tuition (rich parents pay; poor families get Pell Grant eligibility);
  - a car at 18;
  - moving back home;
  - bailouts (a lawyer, rehab, rent);
  - referrals and connections;
  - inheritance or inherited debt;
  - expectations and pressure;
  - sending money home.
- **Parents and siblings as NPCs:** real jobs and wages, aging, illness, caregiving, divorce and remarriage, loans, death, wills and probate (simplified Florida rules).
- **Relationships:**
  - friends with closeness and memories;
  - dating (apps, work, school, gym, church, bars);
  - sex and protection, pregnancy;
  - moving in, engagement, the cost of a wedding, marriage (joint taxes);
  - divorce (Florida no-fault, alimony, child support, simplified).
- **Children:**
  - pregnancy and birth costs (insurance dependent);
  - daycare at real prices (DOL National Database of Childcare Prices);
  - schools, kids' activities, teen events, college savings (Florida Prepaid);
  - children as NPCs with their own lives.

**Done when:** two players starting in the same city but in different families have clearly different lives, and the family remains part of the story until the end.

---

## Phase 4 — Money depth (medium term)
- Checking and savings accounts at real banks and credit unions (Chase, Bank of America, Wells Fargo, Truist, VyStar, Suncoast…), APY, overdraft fees.
- **Credit score (300–850)**, from payment history, utilization, account age, mix and inquiries. It drives rent approval, deposits and every loan rate.
- **Credit cards:** limits, APR ranges, minimum payments, late fees, rewards, balance transfers.
- **Loans:**
  - student loans with federal rules: subsidized/unsubsidized, income-driven repayment, PSLF forgiveness, default and wage garnishment;
  - personal, payday (Florida limits), auto (term and credit-based rates), HELOC.
- **Taxes by filing status:** single, married, head of household; child tax credit, the EITC, capital gains, self-employment tax, refunds and audits.
- **Investing:**
  - 401(k) with the employer match, IRA and Roth IRA;
  - brokerage (index funds, single stocks);
  - crypto (volatile);
  - returns from historical distributions.
- **Bankruptcy:** Chapter 7 and 13, simplified, with the Florida homestead exemption. Collections, judgments.
- **Gambling:** Florida Lottery, Seminole Hard Rock, sports betting where legal, with an addiction risk.
- **Scams:** phone, romance, investment, contractor fraud after storms, elder scams.

---

## Phase 5 — Shopping, brands and possessions (medium term)
**The owner wants many more ways to buy cars and everything else.**

- **Brand places from the encyclopedia:** the brands present in each metro (Wikidata/OSM), and later the real store locations from OpenStreetMap. Each brand place offers:
  - actions: shop, eat, work there, apply, hang out;
  - a price tier;
  - events and effects;
  - jobs with the real local wages for that occupation.
- **Groceries and habits:** Publix (employee stock), Winn-Dixie, Walmart, Target, Aldi, Costco, Sam's Club, Whole Foods, Trader Joe's, Sedano's. The store you use sets your food budget and affects health over time.
- **Restaurants:** Waffle House, Denny's, IHOP, Chick-fil-A, McDonald's, Burger King, Cracker Barrel, Olive Garden, Hooters, Cuban cafés, seafood shacks. Eating out affects money, Vitality and Mood.
- **Vehicles expanded:**
  - **where you buy:** new from dealers, used from dealers (CarMax, local lots), private sellers, auctions, "buy here, pay here" for bad credit;
  - **how you pay:** cash, loans of 36–84 months with credit-based rates, or leases;
  - **models:** dozens with model years, mileage and condition; reliability by brand; classic cars that appreciate;
  - **running costs:** insurance by age, record and city; gas prices by year (EIA); maintenance, registration, tolls (SunPass), parking;
  - **events:** recalls, breakdowns, accidents with fault and claims, theft, floods;
  - **other vehicles:** motorcycles, scooters and e-bikes, golf carts, boats (with slips, storage and the boating safety card), jet skis, RVs, small planes.
- **Everyday purchases:**
  - phones and carriers, laptops and consoles, TVs;
  - furniture and appliances (IKEA, Rooms To Go…), hurricane gear (generators, shutters);
  - clothes from budget to designer (real Florida malls), jewelry, watches, tattoos, cosmetic procedures;
  - subscriptions (streaming, gym, theme park annual passes, warehouse clubs);
  - hobby gear (fishing, hunting and firearms bought legally from real retailers with background checks, golf, surfing, cycling, music, photography);
  - gifts for NPCs.
- **Pets:** dogs and cats (shelter or breeder), vet bills, pet insurance; exotic pets under Florida permit rules.
- **Possessions inventory:** everything you own, with value, condition, depreciation; selling, theft, storm damage and insurance claims.

---

## Phase 6 — Homes (medium term)
- **Real neighborhoods** in each metro (e.g. Riverside, San Marco and Mandarin in Jacksonville; Brickell, Little Havana and Kendall in Miami; Ybor City and South Tampa…). Each has rent and price tiers, commute times (Census ACS), school quality and flood zones.
- **Renting:** apartments, houses, rooms, mobile homes; leases, renewals, rent increases, evictions, security deposits.
- **Buying:**
  - homes, condos, townhouses, land, waterfront, vacation homes, timeshares;
  - mortgages (conventional, FHA, VA) at the historical rate for the year (Freddie Mac);
  - PMI, closing costs, escrow.
- **Florida-specific costs:**
  - homeowners insurance (the real crisis, Citizens as the last resort);
  - flood insurance (NFIP);
  - HOA and condo fees;
  - condo special assessments after the post-Surfside safety laws;
  - property tax with the homestead exemption;
  - roof age, termites, sinkholes.
- **Renovations, selling** (agent fees), **landlording** (tenants, repairs, evictions), home values following the metro's real trends.

---

## Phase 7 — Health and mind (long term)
- **Disease incidence by real age statistics** (CDC, SEER): diagnosis, treatment paths, costs, survival odds.
- **Insurance:**
  - employer plans, ACA marketplace with subsidies;
  - the Florida Medicaid gap (no expansion);
  - Medicare at 65;
  - medical debt.
- **Habits:** diet, exercise, sleep, smoking, vaping, alcohol, prescription and illegal drugs; addiction, overdose, rehab, relapse.
- **Mental health:** depression, anxiety, burnout, grief, therapy, medication, crisis events (handled seriously, with real hotline info).
- **Body:** weight and fitness, appearance, aging.
- **Florida hazards:** heat illness, skin cancer, lightning, shark bites, alligators, mosquito-borne illness, red tide, with real rarity.

---

## Phase 8 — Law and crime (long term)
- **Being a victim:** theft, burglary, assault, identity theft, scams.
- **Committing crimes:** shoplifting, DUI, drugs, fraud, violence. Each has:
  - arrest odds;
  - bail;
  - a public defender vs. a private lawyer;
  - plea deals and trials;
  - real Florida penalty ranges (Florida Statutes);
  - probation, jail and prison life;
  - a record affecting jobs, housing and licenses;
  - expungement and record sealing where real.
- **Civil:** lawsuits (accidents, landlords), small claims, jury duty.

---

## Phase 9 — Places, travel and the outdoors in depth (long term)
- **Places:**
  - in-city / nearby / day trip / overnight tiers;
  - real municipalities;
  - real routing distances and times when a free routing source is usable;
  - entry costs where known;
  - festivals and events calendar (Gasparilla, Art Basel, Daytona, Florida–Georgia, spring break).
- **Fishing and hunting:**
  - habitat by spot;
  - shore, pier, kayak, own boat or charter;
  - gear quality;
  - seasons and weather;
  - bag and size limits;
  - target species;
  - tournaments and trophies;
  - guide and charter careers;
  - the alligator harvest permit lottery;
  - more species and spots per metro.
- **More outdoor activities:** diving and snorkeling (reefs, wrecks, springs), surfing, kayaking, camping in state parks, golf.
- **Travel:** vacations in and out of Florida (flights, hotels, cruises from Miami and Port Canaveral).

---

## Phase 10 — Florida world (long term)
- **Hurricanes with choices:** prepare, evacuate or stay, shelters, FEMA aid, long outages, price gouging, contractor fraud.
- **Other hazards and events:** king tides, red tide, heat waves, wildfires, freezes (falling iguanas), sinkholes.
- **Economy:** tourism cycles (Orlando, Destin), state budget cycles (Tallahassee), military deployments, the insurance crisis, housing booms and crashes.
- **Culture:** rocket launches, college football Saturdays, local news headlines (original satire, never naming real private people), elections and voting.

---

## Phase 11 — Content, UX polish, achievements (long term)
- **Event library:** hundreds, then thousands of events with choices, across all systems.
- **Achievements and milestones:** first tarpon, every local team seen, millionaire by 40, survive five hurricanes, every national park in the state…
- **Challenge scenarios:** e.g. "start poor in Miami with no car", "rich kid in Tallahassee", "single parent at 20".
- **Lifetime stats screen,** photo album of visited places (Commons photos), a newspaper-style obituary.
- **Accessibility:** keyboard, screen readers, contrast, reduced motion.
- **Performance** on low-end phones.

---

## Phase 12 — Balance and QA at scale (long term, then continuous)
- Simulation harness of **10,000+ lives** per change, compared to real statistics:
  - life expectancy;
  - median net worth by age (Federal Reserve SCF);
  - home ownership rate by age;
  - college completion, marriage and divorce rates;
  - poverty rate, incarceration rate.
- Regression tests for every bug found in play-tests.
- A repeatable play-test script, like the external report, after each major phase.

---

## Phase 13 — Childhood mode and generations (long term)
- **Optional start at birth:** childhood, K-12 in the real district (school quality), grades, sports, first jobs at 16, teen events.
- **Generations:** when you die, continue as one of your children with the inheritance, family reputation and history.

---

## Phase 14 — Other states (long term)
- **State pack tooling:** scripts that build a state pack from public data, with the same pieces as Florida:
  - metros;
  - wages, rents, home values;
  - state and local taxes;
  - hazards;
  - places, brands, employers, teams;
  - outdoor species and spots;
  - state rules (licenses, minimum wage, Medicaid, gun and alcohol laws, scholarship programs).
- **Moving between states** as a life decision.
- **Candidate first states:** Georgia (neighbor, easy move), Texas (huge, no income tax like Florida), California or New York (contrast in costs and taxes). Owner decides.

---

## Cross-cutting rules (every phase)
- Real data first. Any estimate goes into one audited place (`ASSUME`) and is labeled in the game.
- Sources and licenses are recorded per dataset. No private data is sent to external services; government contact details stay only in `.env.local`.
- Unit tests per system, end-to-end tests per screen, balance runs per change.
- Deploy previews only; production deploys on explicit request.
- After each phase:
  - an updated bible;
  - an owner play-test;
  - findings feed the next phase.

## Risks and dependencies
| Risk | Mitigation |
|---|---|
| Government sites block automated download (FL DOR, FWC, HUD, SSA) | Owner downloads the files manually; scripts read them from `data/raw` |
| Browser storage limits as lives get detailed | IndexedDB in Phase 1, compact save format |
| Engine complexity grows quickly | Systems architecture and data-driven events in Phase 1; strict tests |
| Realism vs. fun | Difficulty modes, clear previews, a choice behind every consequence |
| Brand and venue facts change (names, closures) | Data timestamps, periodic refresh from the encyclopedia pipeline |
| Session/usage limits on the AI side | Small, shippable phases; nothing is half-done between sessions |
