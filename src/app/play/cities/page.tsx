import type { Metadata } from "next";
import Link from "next/link";
import { takeHomePay } from "@/features/lifesim/engine/tax";
import { GAME_METROS, loadHurricanes, loadTaxes, loadWages, sharedOccupations } from "@/features/lifesim/data";
import { param } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose your city — America 360: Life" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const usd = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `$${Math.round(n).toLocaleString("en-US")}`);
const FEATURED = ["29-1141", "41-2011", "15-1252", "47-2111", "25-2031", "53-3032", "33-3051", "13-2011", "35-2014", "43-4051"];

export default async function CitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const wages = loadWages();
  const hurricanes = loadHurricanes();
  const taxes = loadTaxes();
  const occupations = sharedOccupations(wages);
  const soc = param(sp, "job") ?? "29-1141";
  const job = occupations.find((o) => o.soc === soc) ?? occupations[0]!;
  const featured = FEATURED.map((s) => occupations.find((o) => o.soc === s)).filter((o) => !!o);

  return (
    <div className="container-page pt-8">
      <p className="eyebrow">America 360: Life · preview</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Where will you live?</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Six Florida metros, real numbers. Pick a job to see what it actually pays in each city, what you keep after 2026 taxes, and how
        often hurricanes come through.
      </p>

      <form action="/play/cities" method="get" className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
          Job ({occupations.length} occupations reported in all six metros)
          <select name="job" defaultValue={job.soc} className="field">
            {occupations.map((o) => (
              <option key={o.soc} value={o.soc}>{o.title}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">Compare</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {featured.map((o) => (
          <Link key={o.soc} href={`/play/cities?job=${o.soc}`} className={`chip no-underline hover:no-underline ${o.soc === job.soc ? "border-gold text-gold" : ""}`}>
            {o.title.replace(/, Except.*$/, "")}
          </Link>
        ))}
      </div>

      <h2 className="mt-8 font-serif text-2xl">{job.title}</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="city-cards">
        {GAME_METROS.map((m) => {
          const area = wages.metros[m.slug]!;
          const occ = area.occupations.find((o) => o.soc === job.soc);
          const all = area.occupations.find((o) => o.group === "total");
          const median = occ?.annual.p50 ?? null;
          const pay = median !== null ? takeHomePay(median, taxes) : null;
          const h = hurricanes.metros[m.slug]!;
          const majors = (h.stormsByCategory.cat3 ?? 0) + (h.stormsByCategory.cat4 ?? 0) + (h.stormsByCategory.cat5 ?? 0);
          return (
            <li key={m.slug} className="card flex flex-col gap-3 p-5" data-testid="city-card">
              <div>
                <h3 className="font-serif text-2xl">{m.name}</h3>
                <p className="text-xs text-muted">{m.tagline}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Median pay</p>
                <p className="font-serif text-3xl text-gold tabular-nums">{usd(median)}<span className="text-sm text-muted">/yr</span></p>
                <p className="text-xs text-muted">
                  Range {usd(occ?.annual.p10)} – {occ?.annualTopCoded ? "$239,200+" : usd(occ?.annual.p90)} (10th–90th percentile)
                </p>
              </div>
              {pay && (
                <div className="rounded-lg bg-navy-900 p-3 text-sm">
                  <p className="flex justify-between"><span className="text-muted">Take-home</span><span className="font-medium tabular-nums">{usd(pay.takeHome)}/yr · {usd(pay.takeHome / 12)}/mo</span></p>
                  <p className="flex justify-between text-xs text-muted"><span>Federal tax + FICA</span><span className="tabular-nums">{usd(pay.federalIncomeTax + pay.socialSecurity + pay.medicare)} ({(pay.effectiveRate * 100).toFixed(1)}%)</span></p>
                  <p className="flex justify-between text-xs text-muted"><span>Florida income tax</span><span>$0</span></p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-muted">Workers in this job</dt><dd className="tabular-nums text-ink">{occ?.employment?.toLocaleString("en-US") ?? "—"}</dd></div>
                <div><dt className="text-muted">All-jobs median</dt><dd className="tabular-nums text-ink">{usd(all?.annual.p50)}</dd></div>
                <div><dt className="text-muted">Hurricane year odds</dt><dd className="tabular-nums text-ink">{(h.annualProbability * 100).toFixed(1)}% / yr</dd></div>
                <div><dt className="text-muted">Major hurricanes since 1950</dt><dd className="tabular-nums text-ink">{majors}</dd></div>
              </dl>
              <p className="text-[11px] text-muted">Rent: coming next (HUD Fair Market Rents).</p>
            </li>
          );
        })}
      </ul>

      <section className="prose-note mt-8 max-w-3xl space-y-1">
        <p>Wages: <a href={wages.source.url} target="_blank" rel="noopener noreferrer">{wages.source.title}</a>. Take-home is for a single filer with the 2026 standard deduction (<a href={taxes.federalIncomeTax.source.url} target="_blank" rel="noopener noreferrer">IRS</a>); FICA included; Florida has no state income tax.</p>
        <p>Hurricanes: <a href={hurricanes.source.url} target="_blank" rel="noopener noreferrer">{hurricanes.source.title}</a>. {hurricanes.source.method}</p>
      </section>
    </div>
  );
}
