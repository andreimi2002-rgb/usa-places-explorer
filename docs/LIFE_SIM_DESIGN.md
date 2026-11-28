# America 360: Life — Game design (v0.1, 2026-11-28)

The product is now a **realistic, year-by-year life simulator set in Florida**. The encyclopedia built so far becomes the game's world database: real cities, places, employers and brands. The game is an **original** work in the life-sim genre; it does not reuse another game's name, art, UI, stat names or texts. The interface is in English.

## 1. Pillars
1. **Real numbers.** Wages, rents, prices, taxes, tuition, life expectancy and hurricane odds come from dated public sources. Every simplification is written down in section 9.
2. **Real places.** You are born in a real city, attend real schools and universities, work for real employers, shop at real chains and visit real landmarks.
3. **One year per turn.** Each turn has a few meaningful choices and a story log of what happened. Money is computed monthly in the background.
4. **Consequences.** Debt, a bad credit score, health habits and storm damage carry forward. Nothing resets.
5. **Fair and transparent.** A seeded random generator drives every outcome, so a life can be replayed. The "why" behind numbers can be inspected: tap any money figure to see its source.

## 2. MVP scope
Six metro areas. Their data is already partly in the encyclopedia.

| Metro (Census CBSA) | Anchor city | Notes |
|---|---|---|
| Jacksonville, FL MSA | Jacksonville | Port, Navy, finance HQs, UNF/JU |
| Orlando–Kissimmee–Sanford MSA | Orlando | Theme parks, tourism jobs, UCF |
| Miami–Fort Lauderdale–West Palm Beach MSA | Miami | High cost of living, FIU/UM, international |
| Tampa–St. Petersburg–Clearwater MSA | Tampa | USF, finance and health, beaches |
| Crestview–Fort Walton Beach–Destin MSA | Destin | Tourism, Eglin AFB, seasonal economy |
| Tallahassee MSA | Tallahassee | State government, FSU/FAMU |

Not in the MVP: other states, multiplayer and paid AI. AI-written events may come later through a provider interface, after cost has been reviewed.

## 3. Core loop (one turn = one year)
1. **Age +1.** Automatic changes happen: growth and aging, school progression, contract or lease renewals.
2. **Money year.** Run 12 monthly steps: income minus taxes, minus housing, food, transport, insurance, debt payments and lifestyle. Then savings or debt changes, interest is applied and the credit score updates.
3. **Life events.** Draw 1–4 weighted random events that depend on age, city, job, health, relationships and season. Examples: a hurricane, a promotion offer, a car breakdown, meeting someone.
4. **Player actions.** Spend up to 3 action points out of these menus: Education, Career, Money, Home, Relationships, Health, Activities (visit real places), Shopping (real brands).
5. **Story log.** One readable paragraph per year, plus a ledger of the year's numbers.
6. **Checks.** Death check (actuarial odds × health modifiers), bankruptcy and eviction rules, and milestones.

## 4. Character model
- **Identity:** name, gender, birth year, birth city or ZIP area, family background (household income bracket drawn from the local Census distribution).
- **Core stats (0–100, original names):**
  - **Vitality:** physical health.
  - **Mood:** mental wellbeing.
  - **Smarts:** learning and test results.
  - **Drive:** discipline and work ethic.
  - **Charisma:** social success.
- **Money:** cash, checking/savings, retirement (401k/IRA), debts (student, auto, credit card, mortgage), credit score (300–850).
- **Skills (0–100):** tied to occupations, for example healthcare, trades, sales, tech, hospitality, office, driving.
- **Traits:** 1–2 innate traits, such as night owl, risk-taker, frugal or social butterfly. They modify event odds.
- **Relationships:** parents, siblings, partner, children and friends. Each has closeness (0–100) and their own simplified life (age, job, health).
- **Assets:** home (rent or own, value, mortgage), car (model class, value, insurance), pets.

## 5. Systems

### 5.1 Childhood and K-12 (ages 0–18)
- School quality uses the city's public district. Smarts and Drive set GPA.
- Activities (sports, arts, part-time job from age 16) change stats and future scholarships.
- **Florida specifics:** a **Bright Futures** scholarship is available with a high GPA and test score; it covers most in-state tuition. Real Florida rules are simplified.

### 5.2 Higher education
- Choices include real institutions in the six metros: UNF, JU, FSCJ, UCF, Valencia, Rollins, FIU, UM, MDC, USF, UT, HCC, FSU, FAMU, TCC, NWFSC (Destin area), plus trade school or the military.
- Each has real data: tuition and fees, admission selectivity and graduation rates (College Scorecard), and majors mapped to career paths.
- Admission chance = f(GPA, test score, activities, selectivity). Student loans follow federal limits and rates.

### 5.3 Careers
- Occupations come from the BLS SOC list, curated to 120–200 common jobs.
- For each occupation:
  - **Requirements:** education level and optional license.
  - **Pay:** the **real wage percentiles for that metro** (BLS OEWS).
  - **Growth:** typical raise and promotion odds.
- **Employers** are real names in that city: Wikidata organizations headquartered there (CSX, FIS, Publix, Darden, Lockheed Martin…), plus OSM brands for entry-level jobs (Publix, Wawa, McDonald's, Walmart, Disney and Universal in Orlando).
- Actions: apply, interview (stat check), work harder, ask for a raise, switch jobs, start a side hustle, get fired or laid off.
- Recessions are a global event that raises layoff odds.

### 5.4 Money and taxes
- **Federal income tax** uses the real brackets and standard deduction for the game year, plus FICA. **Florida has no state income tax.**
- **Sales tax:** 6% state rate plus the county surtax (real per county).
- **Property tax:** county millage, with the Florida homestead exemption simplified.
- **Insurance:**
  - Health: employer or ACA, with simplified premiums.
  - Auto: Florida rates, high.
  - Homeowners: high in Florida, and higher in Miami and the coastal areas.
- **Credit score** model: payment history, utilization, age of accounts, new debt.
- **Inflation:** a yearly CPI drift applied to prices and wages, from a historical table.

### 5.5 Housing
- **Renting:** HUD Fair Market Rents by metro and bedroom count (studio to 4 BR), with neighborhood tiers (below, at or above market).
- **Buying:** median home value by city (Census ACS, or Zillow ZHVI if its terms allow), down payment, 30-year mortgage at the historical rate for the game year, closing costs, HOA.
- Places to live are the encyclopedia's neighborhoods and communities in each metro.

### 5.6 Health and aging
- Base mortality uses the **SSA period life table** by age and sex. Vitality, smoking, drinking, obesity and insurance modify it.
- Illnesses and accidents are drawn from simplified CDC prevalence by age. Treatment has a cost depending on insurance.
- Habit actions: gym (real chains such as Planet Fitness and LA Fitness), diet, doctor visits, therapy.

### 5.7 Relationships and family
- Meeting people happens through school, work, activities and apps.
- Dating leads to moving in together, marriage and divorce (with simplified Florida rules).
- **Children:** real childcare cost by metro. Children age and have their own basic arc.
- **Parents** age and may need care. A simplified inheritance follows.

### 5.8 Florida world events
- **Hurricanes:** yearly odds by metro, from the NOAA historical landfall record. Damage depends on the home, insurance and evacuation choice.
- **Heat waves**, flooding (higher in Miami and Tampa), sinkhole (rare), tourism boom and bust (Orlando, Destin), state budget cycles (Tallahassee jobs), military deployments (Jacksonville, Destin/Eglin).
- **News flavor:** short, original satirical headlines. They never name real private people.

### 5.9 Activities and shopping (the encyclopedia in play)
- **Visit** real places from the encyclopedia: beaches, parks, museums, stadiums, theme parks. Each has an entry cost where known (otherwise a band), a mood or stat effect and a link to its encyclopedia page.
- **Shop and eat** at real chains present in the metro (from OSM counts): groceries at Publix, Winn-Dixie or Aldi, eating out, buying cars. Prices are bands, not quotes.
- Brands appear factually as places to work and shop, with no endorsement implied. A disclaimer says the game is fiction and unaffiliated.

### 5.10 End of life
- Death produces a **life summary:** net worth, career, places visited, relationships and an "obituary".
- Players can continue as one of their children (later feature).

## 6. Data plan (stage 2)
One small JSON snapshot per metro, built by scripts and validated with Zod. Each value records its source and date, the same as the encyclopedia.

| Data | Source (free) | Granularity |
|---|---|---|
| Wages by occupation | BLS OEWS (May release), MSA files | metro × SOC × percentile |
| Rents | HUD Fair Market Rents | metro × bedrooms |
| Home values, household income distribution | Census ACS 5-year | city |
| Federal tax, FICA, standard deduction | IRS | year |
| Sales tax surtax, property millage | FL Dept. of Revenue | county |
| Tuition, admissions, graduation | College Scorecard (free API key) or IPEDS bulk | institution |
| Life table | SSA period life table | age × sex |
| CPI history, gas prices | BLS CPI, EIA | year |
| Hurricanes | NOAA HURDAT2 landfalls | metro buffer |
| Employers, places, brands | existing encyclopedia bundles (Wikidata, OSM) | metro |

## 7. Technical design
- **Engine:** pure TypeScript in `src/features/lifesim/engine`, with no UI imports. It works as `nextYear(state, choices, rng) → { state, log }`, which is deterministic for a given seed. It is unit-tested heavily, including property tests that check money conservation and that stats stay in range.
- **Content:** events are written as data (`content/events/*.ts`) with conditions, weights, choices and effects, so content grows without changing the engine.
- **State:** stored on the client in `localStorage` with a versioned save format and migrations; export and import save as a file. No account is needed for the MVP.
- **UI:** a mobile-first Next.js route `/play`. Screens:
  - character creation;
  - a year view (stats, log, actions);
  - menus;
  - finances (ledger, charts);
  - relationships;
  - assets;
  - a life summary.
- **Encyclopedia:** kept for the six metros only, linked from the game ("learn about this place"). The rest of Florida is removed from the production bundle; it stays in git history.

## 8. Milestones
| # | Milestone | Done when |
|---|---|---|
| 1 | Design (this doc) | Approved; open questions below resolved |
| 2 | Data snapshots for 6 metros | All section 6 data validated, with sources listed, in tests |
| 3 | Engine core | Birth → death playable in tests; taxes, rent and wages match the source tables; deterministic replay |
| 4 | UI | A full life playable on phone and desktop |
| 5 | Content | ≥ 200 events, careers for ≥ 120 occupations, activities in all 6 metros |
| 6 | Balance and polish | Median outcomes realistic (e.g. a median earner can afford median rent at about 30–40% of income); playtests |

## 9. Simplifications (documented on purpose)
- One person's view only. Other characters run simplified yearly updates.
- Money is computed monthly but shown yearly. There are no daily schedules.
- Prices are representative bands, not live quotes. Brand and store data says only that a chain exists in the metro.
- Health uses statistical odds, not medical advice. The game shows a disclaimer.

## 10. Open questions for the owner
1. Which year does a game start in: the current year (2026) with future years extrapolated, or a chosen historical birth year?
2. Can the player move between the six metros during a life? (Recommended: yes, and it makes metros comparable.)
3. Should some events be dark (crime, addiction)? (Recommended: realistic but non-graphic, with a content setting.)
4. What is the game's name? (Placeholder: "America 360: Life".)
