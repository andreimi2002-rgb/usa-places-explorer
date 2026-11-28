"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  ACTIONS_PER_YEAR, ASSUME, BEDROOMS, activityCost, ageUp, applyForJob, askForRaise, attendGame, buyCar, buyLicense, carQuote, doActivity, dropOut,
  enroll, fmtMoney, gameCost, goOutdoors, jobCheck, metroOf, moveBackHome, moveCity, needsFishingLicense, netWorth, newLife, nightOut,
  normalizeLife, programs, quitJob, rentCheck, rentHome, retire, seeDoctor, sellCar, setLifestyle, sideGig, socialize, spotSpecies, study,
  takeHunterSafety, workHarder, workout, type Result,
} from "../engine/life";
import { EDUCATION_LABELS, type Difficulty, type GameActivity, type GameData, type Life, type Lifestyle, type Stats } from "../engine/types";

const SAVE_KEY = "a360-life-v1";
const TABS = ["Life", "Jobs", "School", "Home", "Car", "Activities", "Outdoors", "Health"] as const;
type Tab = (typeof TABS)[number];

const FIRST = { male: ["James", "Michael", "David", "Daniel", "Carlos", "Jayden", "Ethan", "Luis", "Marcus", "Tyler"], female: ["Olivia", "Emma", "Sophia", "Isabella", "Mia", "Ava", "Camila", "Aaliyah", "Madison", "Gabriela"] };
const LAST = ["Smith", "Johnson", "Rodriguez", "Garcia", "Williams", "Martinez", "Brown", "Hernandez", "Jones", "Lopez", "Davis", "Perez"];
const randomName = (g: "male" | "female") => `${FIRST[g][Math.floor(Math.random() * 10)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;

const noopSubscribe = () => () => {};

function loadSave(): Life | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    const l = raw ? (JSON.parse(raw) as Life) : null;
    return l && typeof l.name === "string" && l.stats ? normalizeLife(l) : null;
  } catch {
    return null;
  }
}
function writeSave(l: Life | null) {
  try {
    if (l) window.localStorage.setItem(SAVE_KEY, JSON.stringify(l));
    else window.localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage unavailable: the game still works for this session */
  }
}

export function Game({ data }: { data: GameData }) {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const saved = useMemo(() => (hydrated ? loadSave() : null), [hydrated]);
  const [current, setLife] = useState<Life | null | undefined>(undefined);
  const life = current === undefined ? saved : current;
  const [tab, setTab] = useState<Tab>("Life");
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const commit = (r: Result) => {
    if (r.ok) {
      setLife(r.life);
      writeSave(r.life);
    }
    setToast({ text: r.message, ok: r.ok });
  };
  const start = (l: Life) => {
    setLife(l);
    writeSave(l);
    setTab("Life");
    setToast(null);
  };

  if (!hydrated) return <p className="container-page pt-10 text-muted">Loading…</p>;
  if (!life) return <NewLife data={data} onStart={start} />;
  const restart = () => { writeSave(null); setLife(null); setToast(null); };
  if (!life.alive) return <Obituary data={data} life={life} onRestart={restart} />;

  const m = metroOf(data, life);
  return (
    <div className="container-page pb-20 pt-6 lg:pb-0" data-testid="game">
      <header className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">America 360: Life</p>
          <h1 className="mt-1 truncate font-serif text-2xl sm:text-3xl" data-testid="life-name">{life.name}</h1>
          <p className="text-sm text-ink-soft" data-testid="life-status">
            Age <strong className="text-ink">{life.age}</strong> · {life.year} · {m.name}, FL
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:text-right">
          <span className="text-muted">Cash</span>
          <strong className={life.cash < 0 ? "text-danger" : "text-ink"} data-testid="cash">{fmtMoney(life.cash)}</strong>
          <span className="text-muted">Debt</span>
          <strong className={life.debt > 0 ? "text-danger" : "text-ink"}>{fmtMoney(life.debt)}</strong>
          <span className="text-muted">Net worth</span>
          <strong>{fmtMoney(netWorth(life))}</strong>
          <span className="col-span-2 mt-1 sm:text-right">
            <button type="button" className="text-xs text-muted underline hover:text-gold" data-testid="new-life-anytime"
              onClick={() => { if (window.confirm("Start a new life? This one will be lost.")) restart(); }}>
              New life
            </button>
          </span>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <StatBars stats={life.stats} />
          <Status data={data} life={life} onLifestyle={(s) => commit(setLifestyle(life, s))} />
          <button type="button" className="btn-primary fixed inset-x-4 bottom-4 z-20 min-h-14 text-base shadow-lg lg:static lg:shadow-none" onClick={() => { commit(ageUp(data, life)); setTab("Life"); }} data-testid="age-up">
            Age up → {life.age + 1}
          </button>
          <p className="text-center text-xs text-muted lg:-mt-2">
            {life.actionsLeft} of {ACTIONS_PER_YEAR} free-time actions left this year
          </p>
        </aside>

        <section className="min-w-0">
          {toast && (
            <p role="status" className={`mb-3 rounded-lg border px-3 py-2 text-sm ${toast.ok ? "border-line text-ink-soft" : "border-danger/60 text-danger"}`} data-testid="toast">
              {toast.text}
            </p>
          )}
          <nav className="flex gap-1 overflow-x-auto border-b border-line pb-px" aria-label="Game sections">
            {TABS.map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t}
                className={`shrink-0 rounded-t-md px-3 py-2 text-sm ${tab === t ? "border-b-2 border-gold text-gold" : "text-ink-soft hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </nav>
          <div className="pt-4">
            {tab === "Life" && <LifeLog life={life} />}
            {tab === "Jobs" && <Jobs data={data} life={life} commit={commit} />}
            {tab === "School" && <School life={life} commit={commit} />}
            {tab === "Home" && <HomeTab data={data} life={life} commit={commit} />}
            {tab === "Car" && <Garage data={data} life={life} commit={commit} />}
            {tab === "Activities" && <Activities data={data} life={life} commit={commit} />}
            {tab === "Outdoors" && <Outdoors data={data} life={life} commit={commit} />}
            {tab === "Health" && <Health life={life} commit={commit} />}
          </div>
        </section>
      </div>
      <Sources data={data} />
    </div>
  );
}

// ------------------------------------------------------------------ new life
function NewLife({ data, onStart }: { data: GameData; onStart: (l: Life) => void }) {
  const [gender, setGender] = useState<"male" | "female">("female");
  const [name, setName] = useState("Olivia Garcia");
  const [metro, setMetro] = useState("jacksonville");
  const [difficulty, setDifficulty] = useState<Difficulty>("relaxed");
  return (
    <div className="container-page pt-8" data-testid="new-life">
      <p className="eyebrow">America 360: Life</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Live a life in Florida.</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        You start at 18 in 2026. Every year you choose what to do; then you age up and life happens. Real wages, rents, taxes, hurricanes and
        life expectancy. Real places to go, fish and hunt.
      </p>
      <div className="card mt-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
          Name
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} data-testid="name-input" />
        </label>
        <fieldset className="flex gap-2">
          <legend className="mb-1 text-xs text-muted">Sex (for life tables)</legend>
          {(["female", "male"] as const).map((g) => (
            <button key={g} type="button" className={gender === g ? "btn-primary" : "btn"} aria-pressed={gender === g}
              onClick={() => { setGender(g); setName(randomName(g)); }}>
              {g === "female" ? "Female" : "Male"}
            </button>
          ))}
        </fieldset>
        <button type="button" className="btn" onClick={() => setName(randomName(gender))}>Random name</button>
      </div>
      <fieldset className="mt-4 flex flex-wrap items-center gap-2">
        <legend className="mb-1 text-xs text-muted">Difficulty</legend>
        {([["relaxed", "Relaxed", "Lower living costs, 4% debt interest, easier hiring"], ["realistic", "Realistic", "Full costs, 7% debt interest"]] as const).map(([k, label, hint]) => (
          <button key={k} type="button" className={difficulty === k ? "btn-primary" : "btn"} aria-pressed={difficulty === k} onClick={() => setDifficulty(k)} title={hint}>
            {label}
          </button>
        ))}
        <span className="text-xs text-muted">{difficulty === "relaxed" ? "Lower living costs, 4% debt interest, easier hiring." : "Full costs, 7% debt interest."}</span>
      </fieldset>
      <h2 className="mt-8 font-serif text-2xl">Where do you grow up?</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.metros.map((x) => (
          <li key={x.slug}>
            <button type="button" onClick={() => setMetro(x.slug)} aria-pressed={metro === x.slug} data-testid="city-option"
              className={`card w-full p-4 text-left transition-colors ${metro === x.slug ? "border-gold" : "hover:border-gold-soft"}`}>
              <span className="font-serif text-xl">{x.name}</span>
              <span className="mt-1 block text-sm text-ink-soft">{x.tagline}</span>
              <span className="mt-3 block text-xs text-muted">
                1-bedroom {fmtMoney(x.rent.br1)}/mo · hurricane in {Math.round(x.hurricaneAnnualProbability * 100)}% of years · {x.jobs.length} jobs
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-primary mt-6 min-h-12 px-8 text-base" data-testid="start-life"
        onClick={() => onStart(newLife(data, { name, gender, metro, difficulty, seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0 }))}>
        Start life
      </button>
      <Sources data={data} />
    </div>
  );
}

// ------------------------------------------------------------------ panels
const STAT_LABELS: Record<keyof Stats, string> = { vitality: "Vitality", mood: "Mood", smarts: "Smarts", drive: "Drive", charisma: "Charisma" };
function StatBars({ stats }: { stats: Stats }) {
  return (
    <div className="card p-4" data-testid="stats">
      {(Object.keys(STAT_LABELS) as (keyof Stats)[]).map((k) => (
        <div key={k} className="mb-2 last:mb-0">
          <div className="flex justify-between text-xs"><span className="text-ink-soft">{STAT_LABELS[k]}</span><span>{stats[k]}</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-700" role="meter" aria-valuenow={stats[k]} aria-valuemin={0} aria-valuemax={100} aria-label={STAT_LABELS[k]}>
            <div className={`h-full rounded-full ${stats[k] < 30 ? "bg-danger" : stats[k] < 55 ? "bg-warn" : "bg-mint"}`} style={{ width: `${stats[k]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Status({ data, life, onLifestyle }: { data: GameData; life: Life; onLifestyle: (s: Lifestyle) => void }) {
  const ly = life.lastYear;
  return (
    <div className="card p-4 text-sm" data-testid="status">
      <Row k="Job" v={life.job ? `${life.job.title} at ${life.job.employer} · ${fmtMoney(life.job.salary)}/yr` : life.retirementIncome ? `Retired · ${fmtMoney(life.retirementIncome)}/yr` : "Unemployed"} />
      <Row k="Education" v={EDUCATION_LABELS[life.education]} />
      {life.study && <Row k="Studying" v={`${life.study.label} · ${life.study.yearsLeft} yr left`} />}
      <Row k="Home" v={life.home.kind === "parents" ? "With parents" : `${["Studio", "1-bedroom", "2-bedroom", "3-bedroom", "4-bedroom"][life.home.bedrooms]} · ${fmtMoney(life.home.monthlyRent)}/mo${life.home.roommate ? " (with roommate)" : ""}`} />
      <Row k="Car" v={life.car ? life.car.name : "No car"} />
      {life.conditions.length > 0 && <Row k="Health" v={life.conditions.join(", ")} />}
      <div className="mt-3">
        <p className="text-xs text-muted">Lifestyle</p>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["frugal", "normal", "lavish"] as const).map((s) => (
            <button key={s} type="button" onClick={() => onLifestyle(s)} aria-pressed={life.lifestyle === s}
              className={`rounded-md border px-2 py-1 text-xs capitalize ${life.lifestyle === s ? "border-gold text-gold" : "border-line text-ink-soft"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {ly && (
        <details className="mt-3 text-xs text-ink-soft">
          <summary className="cursor-pointer text-muted">Last year&apos;s money</summary>
          <Row k="Income (gross)" v={fmtMoney(ly.income)} />
          <Row k="Take-home (after IRS 2026 + FICA)" v={fmtMoney(ly.takeHome)} />
          <Row k="Rent (HUD FMR)" v={`−${fmtMoney(ly.housing)}`} />
          <Row k="Living & lifestyle (estimate)" v={`−${fmtMoney(ly.living)}`} />
          {ly.car > 0 && <Row k="Car: insurance, gas, payments" v={`−${fmtMoney(ly.car)}`} />}
          {ly.tuition > 0 && <Row k="Tuition (estimate)" v={`−${fmtMoney(ly.tuition)}`} />}
          {ly.other > 0 && <Row k="Activities & purchases" v={`−${fmtMoney(ly.other)}`} />}
          {ly.interest > 0 && <Row k={`Interest on debt (${ASSUME.debtInterest[life.difficulty] * 100}%)`} v={`+${fmtMoney(ly.interest)} debt`} />}
          <p className="mt-1 text-muted">{data.metros.find((x) => x.slug === life.metro)?.name} costs index {metroOf(data, life).costIndex} (estimate)</p>
        </details>
      )}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-3 py-0.5">
      <span className="shrink-0 text-muted">{k}</span>
      <span className="min-w-0 text-right">{v}</span>
    </p>
  );
}

function LifeLog({ life }: { life: Life }) {
  const byYear = useMemo(() => {
    const groups: { age: number; year: number; items: Life["log"] }[] = [];
    for (const e of life.log) {
      if (e.text.startsWith("— ")) continue;
      const g = groups[groups.length - 1];
      if (g && g.age === e.age) g.items.push(e);
      else groups.push({ age: e.age, year: e.year, items: [e] });
    }
    return groups.reverse();
  }, [life.log]);
  return (
    <ol className="flex flex-col gap-3" data-testid="life-log">
      {byYear.map((g) => (
        <li key={`${g.age}-${g.year}`} className="card p-3">
          <p className="text-xs font-semibold text-gold">Age {g.age} · {g.year}</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {g.items.map((e, i) => (
              <li key={i} className={e.tone === "bad" ? "text-danger" : e.tone === "good" ? "text-mint" : "text-ink-soft"}>{e.text}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

type TabProps = { data: GameData; life: Life; commit: (r: Result) => void };

function Jobs({ data, life, commit }: TabProps) {
  const [q, setQ] = useState("");
  const [qualified, setQualified] = useState(true);
  const m = metroOf(data, life);
  const list = m.jobs
    .map((j) => ({ j, c: jobCheck(life, j) }))
    .filter(({ j, c }) => (!qualified || c.ok) && (!q || j.title.toLowerCase().includes(q.toLowerCase())))
    .slice(0, 50);
  return (
    <div data-testid="jobs">
      {life.job && (
        <div className="card mb-4 p-4">
          <p className="font-serif text-lg">{life.job.title}</p>
          <p className="text-sm text-gold">{life.job.employer}</p>
          <p className="text-sm text-ink-soft">{fmtMoney(life.job.salary)}/yr · {life.job.years} yr here · performance {Math.round(life.job.performance)}/100</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => commit(workHarder(life))}>Work harder</button>
            <button type="button" className="btn" onClick={() => commit(askForRaise(life))}>Ask for a raise</button>
            <button type="button" className="btn" onClick={() => commit(quitJob(life))}>Quit</button>
            {life.age >= 62 && <button type="button" className="btn" onClick={() => commit(retire(life))}>Retire</button>}
          </div>
        </div>
      )}
      <div className="card mb-4 flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Side gig</p>
          <p className="text-xs text-muted">{life.car && life.age >= 21 ? "Drive for Uber / DoorDash: about $3,000–6,000" : "Deliver for DoorDash: about $1,200–2,500"} (one action, taxed as self-employment)</p>
        </div>
        <button type="button" className="btn shrink-0" onClick={() => commit(sideGig(life))} data-testid="side-gig">Work a side gig</button>
      </div>
      <p className="mb-3 text-xs text-muted">Big employers in {metroOf(data, life).name}: {metroOf(data, life).employers.map((e) => e.name).join(" · ")}</p>
      {!life.job && life.age >= 62 && !life.retirementIncome && <button type="button" className="btn mb-4" onClick={() => commit(retire(life))}>Claim Social Security</button>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input className="field sm:max-w-xs" placeholder="Search jobs in this city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search jobs" />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={qualified} onChange={(e) => setQualified(e.target.checked)} /> Only jobs I qualify for
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">Pay ranges are real {m.name} wages (BLS OEWS May 2024, 10th–90th percentile). Requirements: BLS typical entry-level education.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {list.map(({ j, c }) => (
          <li key={j.soc} className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between" data-testid="job-row">
            <div className="min-w-0">
              <p className="font-medium">{j.title}</p>
              <p className="text-xs text-muted">
                Median {fmtMoney(j.wage.p50)} · range {fmtMoney(j.wage.p10)}–{fmtMoney(j.wage.p90)} · {EDUCATION_LABELS[j.education]}
                {j.experienceYears ? ` · ${j.experienceYears}+ yrs experience` : ""} · {j.employment.toLocaleString("en-US")} employed here
              </p>
            </div>
            {c.ok ? (
              <button type="button" className="btn shrink-0" onClick={() => commit(applyForJob(data, life, j.soc))}>Apply ({Math.round(c.odds * 100)}%)</button>
            ) : (
              <span className="shrink-0 text-xs text-danger">{c.reason}</span>
            )}
          </li>
        ))}
        {!list.length && <li className="text-sm text-muted">No matching jobs.</li>}
      </ul>
    </div>
  );
}

function School({ life, commit }: { life: Life; commit: (r: Result) => void }) {
  return (
    <div data-testid="school">
      {life.study ? (
        <div className="card p-4">
          <p className="font-serif text-lg">{life.study.label}</p>
          <p className="text-sm text-ink-soft">{life.study.yearsLeft} year(s) left · tuition {fmtMoney(life.study.tuitionPerYear)}/yr</p>
          <button type="button" className="btn mt-3" onClick={() => commit(dropOut(life))}>Drop out</button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {programs(life).map((p) => (
            <li key={p.id} className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-muted">
                  → {EDUCATION_LABELS[p.target]} · {p.years} yr · ~{fmtMoney(p.tuition)}/yr tuition (estimate){life.brightFutures && p.target <= 5 ? " · covered by Bright Futures" : ""}
                  {life.education < p.requires ? ` · requires ${EDUCATION_LABELS[p.requires]}` : ""}
                </p>
              </div>
              <button type="button" className="btn shrink-0" disabled={life.education < p.requires} onClick={() => commit(enroll(life, p.id))}>Apply</button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">While studying, work performance suffers. Unpaid tuition becomes student-loan debt. Tuition figures are estimates until College Scorecard data is added.</p>
    </div>
  );
}

function HomeTab({ data, life, commit }: TabProps) {
  const m = metroOf(data, life);
  return (
    <div data-testid="home">
      <h3 className="font-serif text-xl">Rent in {m.name}</h3>
      <p className="text-xs text-muted">HUD Fair Market Rents FY2026 (rent + utilities, ~40th percentile).</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {BEDROOMS.map((b) => {
          const monthly = m.rent[b.key];
          const c = rentCheck(life, monthly);
          const current = life.home.kind === "rent" && life.home.bedrooms === b.bedrooms;
          return (
            <li key={b.key} className="card flex items-center justify-between gap-2 p-3">
              <div>
                <p className="font-medium">{b.label}</p>
                <p className="text-xs text-muted">{fmtMoney(monthly)}/month</p>
                {!c.ok && <p className="text-xs text-danger">{c.reason}</p>}
              </div>
              {current && !(life.home.kind === "rent" && life.home.roommate) ? <span className="chip">Current</span> : <button type="button" className="btn" disabled={!c.ok} onClick={() => commit(rentHome(data, life, b.bedrooms))}>Rent</button>}
            </li>
          );
        })}
      </ul>
      {(() => {
        const share = Math.round(m.rent.br2 / 2);
        const c = rentCheck(life, share);
        const current = life.home.kind === "rent" && !!life.home.roommate;
        return (
          <div className="card mt-2 flex items-center justify-between gap-2 p-3">
            <div>
              <p className="font-medium">2-bedroom with a roommate</p>
              <p className="text-xs text-muted">Your half: {fmtMoney(share)}/month</p>
              {!c.ok && <p className="text-xs text-danger">{c.reason}</p>}
            </div>
            {current ? <span className="chip">Current</span> : <button type="button" className="btn" disabled={!c.ok} onClick={() => commit(rentHome(data, life, 2, true))} data-testid="roommate">Find a roommate</button>}
          </div>
        );
      })()}
      {life.home.kind === "rent" && <button type="button" className="btn mt-3" onClick={() => commit(moveBackHome(life))}>Move back in with parents</button>}

      <h3 className="mt-8 font-serif text-xl">Move to another city</h3>
      <p className="text-xs text-muted">Movers about {fmtMoney(ASSUME.movingCost)} (estimate) plus a deposit. You leave your job and school.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {data.metros.filter((x) => x.slug !== m.slug).map((x) => (
          <li key={x.slug} className="card flex items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="font-medium">{x.name}</p>
              <p className="text-xs text-muted">1BR {fmtMoney(x.rent.br1)} · hurricanes {Math.round(x.hurricaneAnnualProbability * 100)}%/yr</p>
            </div>
            <button type="button" className="btn shrink-0" onClick={() => commit(moveCity(data, life, x.slug))}>Move</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Garage({ data, life, commit }: TabProps) {
  const [financed, setFinanced] = useState(true);
  return (
    <div data-testid="garage">
      {life.car ? (
        <div className="card mb-4 p-4">
          <p className="font-serif text-lg">{life.car.name}</p>
          <p className="text-sm text-ink-soft">
            Worth about {fmtMoney(life.car.value)}{life.car.loan > 0 ? ` · loan balance ${fmtMoney(life.car.loan)} (${fmtMoney(life.car.annualPayment / 12)}/month)` : " · paid off"}
          </p>
          <button type="button" className="btn mt-3" onClick={() => commit(sellCar(life))}>Sell it</button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-ink-soft">No car. In Florida that means buses, rides and a lot of waiting (about {fmtMoney(ASSUME.noCarTransport)}/yr).</p>
      )}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Pay with</span>
        <button type="button" className={financed ? "btn-primary" : "btn"} onClick={() => setFinanced(true)}>Auto loan (60 mo, {ASSUME.carLoanRate[life.difficulty] * 100}%)</button>
        <button type="button" className={!financed ? "btn-primary" : "btn"} onClick={() => setFinanced(false)}>Cash</button>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {data.cars.map((c) => {
          const q = carQuote(data, life, c.id);
          return (
            <li key={c.id} className="card flex flex-col gap-1 p-3" data-testid="car">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted">
                {fmtMoney(c.price)} · {fmtMoney(q.total)} with tax and fees{q.tradeIn ? ` · trade-in ${fmtMoney(q.tradeIn)}` : ""}
              </p>
              <p className="text-xs text-ink-soft">
                {financed ? `${fmtMoney(q.down)} down + ${fmtMoney(q.monthly)}/month · ` : ""}insurance + gas ~{fmtMoney(q.yearlyRunning)}/yr
              </p>
              <button type="button" className="btn mt-1 min-h-8 self-start px-3 py-1 text-xs" onClick={() => commit(buyCar(data, life, c.id, financed))}>Buy</button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Prices are approximate 2026 starting prices; insurance and running costs are estimates (Florida insurance is among the priciest in the US; drivers under 25 pay more).</p>
    </div>
  );
}

function ActivityCard({ a, life, onGo }: { a: GameActivity & { distanceKm?: number }; life: Life; onGo: () => void }) {
  const cost = activityCost(a);
  return (
    <li className="card flex overflow-hidden" data-testid="activity">
      {a.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- Wikimedia serves sized thumbnails
        <img src={a.image} alt="" loading="lazy" className="h-auto w-24 shrink-0 object-cover sm:w-28" />
      ) : (
        <div className="w-24 shrink-0 bg-navy-700 sm:w-28" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <p className="font-medium leading-tight">{a.name}{life.visited.includes(a.slug) && <span className="ml-1 text-xs text-mint">✓</span>}</p>
        {a.blurb && <p className="line-clamp-2 text-xs text-muted">{a.blurb}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-ink-soft">{a.distanceKm ? `${a.distanceKm} km · ` : ""}{cost ? fmtMoney(cost) : "Free"}</span>
          <button type="button" className="btn min-h-8 px-3 py-1 text-xs" onClick={onGo}>Go</button>
        </div>
      </div>
    </li>
  );
}

function Activities({ data, life, commit }: TabProps) {
  const m = metroOf(data, life);
  return (
    <div data-testid="activities">
      <h3 className="font-serif text-xl">Go to a game</h3>
      <p className="text-xs text-muted">Local teams. Ticket prices are estimates (cheap seats + parking and food).</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {m.teams.map((t) => (
          <li key={t.name} className="card flex items-center justify-between gap-2 p-3" data-testid="team">
            <div className="min-w-0">
              <p className="font-medium">{t.name}{life.gamesSeen.includes(t.name) && <span className="ml-1 text-xs text-mint">✓</span>}</p>
              <p className="text-xs text-muted">{t.league}{t.venue ? ` · ${t.venue}` : ""}{t.distanceKm ? ` · ${t.distanceKm} km` : ""} · ~{fmtMoney(gameCost(t))}</p>
            </div>
            <button type="button" className="btn min-h-8 shrink-0 px-3 py-1 text-xs" onClick={() => commit(attendGame(data, life, t.name))}>Go</button>
          </li>
        ))}
      </ul>
      <h3 className="mt-8 font-serif text-xl">Around {m.name}</h3>
      <p className="text-xs text-muted">Real places (Wikidata/Wikipedia). Costs and effects are game estimates.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {m.activities.map((a) => <ActivityCard key={a.slug} a={a} life={life} onGo={() => commit(doActivity(data, life, a.slug))} />)}
      </ul>
      <h3 className="mt-8 font-serif text-xl">Trips: national parks and protected areas</h3>
      <p className="text-xs text-muted">Distances are real, from {m.name}.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {m.trips.map((a) => <ActivityCard key={a.slug} a={a} life={life} onGo={() => commit(doActivity(data, life, a.slug))} />)}
      </ul>
    </div>
  );
}

function Outdoors({ data, life, commit }: TabProps) {
  const m = metroOf(data, life);
  const fishOk = !needsFishingLicense(life) || life.licenses.fishing === life.year;
  const huntOk = life.licenses.hunting === life.year;
  const safetyNeeded = life.birthYear > data.licenses.hunterSafetyBornAfter && !life.hunterSafety;
  const lifeList = Object.entries(life.lifeList).sort((a, b) => b[1] - a[1]);
  return (
    <div data-testid="outdoors">
      <div className="card p-4 text-sm">
        <p className="font-serif text-lg">Licenses ({life.year})</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {needsFishingLicense(life) ? (
            fishOk ? <span className="chip border-mint text-mint">Fishing license ✓</span> : <button type="button" className="btn" onClick={() => commit(buyLicense(data, life, "fishing"))}>Buy fishing license ({fmtMoney(data.licenses.fishing)})</button>
          ) : <span className="chip">Fishing: exempt (65+)</span>}
          {safetyNeeded ? (
            <button type="button" className="btn" onClick={() => commit(takeHunterSafety(life))}>Take hunter safety course ({fmtMoney(ASSUME.hunterSafetyCourse)})</button>
          ) : huntOk ? <span className="chip border-mint text-mint">Hunting license ✓</span> : (
            <button type="button" className="btn" onClick={() => commit(buyLicense(data, life, "hunting"))}>Buy hunting license ({fmtMoney(data.licenses.hunting)})</button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">Florida requires hunter safety for anyone born after {data.licenses.hunterSafetyBornAfter}. License prices are estimates until checked with FWC.</p>
      </div>

      <h3 className="mt-6 font-serif text-xl">Spots near {m.name}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {m.spots.map((s) => {
          const fish = spotSpecies(data, s, "fish");
          const game = spotSpecies(data, s, "hunt");
          const canFish = s.habitats.some((h) => h !== "hunting");
          return (
            <li key={s.name} className="card p-3" data-testid="spot">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted">{s.distanceKm ? `${s.distanceKm} km away · ` : ""}{s.habitats.join(", ")}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {canFish && <button type="button" className="btn min-h-8 px-3 py-1 text-xs" disabled={!fishOk} onClick={() => commit(goOutdoors(data, life, s.name, "fish"))}>Fish</button>}
                  {s.habitats.includes("hunting") && <button type="button" className="btn min-h-8 px-3 py-1 text-xs" disabled={!huntOk} onClick={() => commit(goOutdoors(data, life, s.name, "hunt"))}>Hunt</button>}
                </div>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                {canFish && fish.length > 0 && <>Fish: {fish.map((f) => f.common).join(", ")}. </>}
                {s.habitats.includes("hunting") && game.length > 0 && <>Game: {game.map((f) => f.common).join(", ")}.</>}
              </p>
            </li>
          );
        })}
      </ul>
      <h3 className="mt-6 font-serif text-xl">Your life list</h3>
      {lifeList.length ? (
        <ul className="mt-2 flex flex-wrap gap-2" data-testid="life-list">
          {lifeList.map(([name, n]) => {
            const sp = data.species.find((s) => s.common === name);
            return (
              <li key={name} className="chip">
                {sp?.wikipedia ? <a href={sp.wikipedia} target="_blank" rel="noreferrer">{name}</a> : name} <span className="text-muted">×{n}</span>
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-2 text-sm text-muted">Nothing caught yet.</p>}
      <p className="mt-3 text-xs text-muted">Species are real (verified on Wikidata by scientific name); which spot holds which species and catch odds are game assumptions. American alligator harvest requires a limited-entry permit (coming later).</p>
    </div>
  );
}

function Health({ life, commit }: { life: Life; commit: (r: Result) => void }) {
  const actions: { label: string; run: () => Result; hint: string }[] = [
    { label: "Work out", run: () => workout(life), hint: `+Vitality · ${fmtMoney(ASSUME.gymCost)}` },
    { label: "See a doctor", run: () => seeDoctor(life), hint: life.job ? `${fmtMoney(ASSUME.doctorVisitInsured)} copay` : `${fmtMoney(ASSUME.doctorVisitUninsured)} uninsured` },
    { label: "Study on your own", run: () => study(life), hint: "+Smarts" },
    { label: "Hang out with friends", run: () => socialize(life), hint: "+Charisma, +Mood" },
    { label: "Night out", run: () => nightOut(life), hint: `21+ · ${fmtMoney(ASSUME.nightOutCost)} · risky` },
  ];
  return (
    <ul className="grid gap-2 sm:grid-cols-2" data-testid="health">
      {actions.map((a) => (
        <li key={a.label} className="card flex items-center justify-between gap-2 p-3">
          <div><p className="font-medium">{a.label}</p><p className="text-xs text-muted">{a.hint}</p></div>
          <button type="button" className="btn shrink-0" onClick={() => commit(a.run())}>Do it</button>
        </li>
      ))}
    </ul>
  );
}

function Obituary({ data, life, onRestart }: { data: GameData; life: Life; onRestart: () => void }) {
  const m = metroOf(data, life);
  const jobs = life.log.filter((e) => e.text.startsWith("Hired!")).length;
  return (
    <div className="container-page pt-8" data-testid="obituary">
      <p className="eyebrow">Obituary</p>
      <h1 className="mt-2 text-4xl">{life.name}</h1>
      <p className="mt-1 text-ink-soft">{life.birthYear} – {life.year} · died at {life.age} in {m.name}, Florida, of {life.causeOfDeath}.</p>
      <div className="card mt-6 grid gap-1 p-4 text-sm sm:max-w-md">
        <Row k="Education" v={EDUCATION_LABELS[life.education]} />
        <Row k="Years worked" v={String(life.workYears)} />
        <Row k="Jobs held" v={String(jobs)} />
        <Row k="Net worth" v={fmtMoney(netWorth(life))} />
        <Row k="Places visited" v={String(life.visited.length)} />
        <Row k="Teams seen live" v={String(life.gamesSeen.length)} />
        <Row k="Species on life list" v={String(Object.keys(life.lifeList).length)} />
        <Row k="Arrests / tickets" v={`${life.record.arrests} / ${life.record.tickets}`} />
      </div>
      <button type="button" className="btn-primary mt-6 min-h-12 px-8" onClick={onRestart} data-testid="new-life-button">Live another life</button>
      <h2 className="mt-10 font-serif text-2xl">The story</h2>
      <div className="mt-3"><LifeLog life={life} /></div>
    </div>
  );
}

function Sources({ data }: { data: GameData }) {
  return (
    <footer className="mt-10 border-t border-line pt-4 text-xs text-muted">
      <p>Real data: {data.sources.map((s, i) => <span key={s.url}>{i ? " · " : ""}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}.</p>
      <p className="mt-1">Event odds, living costs, tuition and stat effects are game estimates. Your life is saved in this browser only.</p>
    </footer>
  );
}
