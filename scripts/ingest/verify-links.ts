/**
 * Evidence checker for curated sources.
 *
 * For each source referenced by the curated seed (official websites and
 * directories), perform ONE polite GET (robots.txt respected, ~1 req/s),
 * record HTTP status, final URL, <title> and a body checksum, and test whether
 * each expected evidence string occurs in the page text. Results are written to
 * seed/generated/link-checks.json and decide what the site may present as a
 * verified fact (see src/lib/data/build.ts). Page content itself is not stored.
 *
 * Usage: npm run ingest:links [-- --only=<sourceId>]
 */
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { collectEvidenceRequests, countyShortName, countyWebsiteSourceId } from "../../src/lib/data/build";
import { entitySeedFileSchema, geographyBundleSchema, linkCheckFileSchema, sourceSchema, type LinkCheck } from "../../src/lib/domain/schemas";
import { SEED_DIR, sha256, USER_AGENT, writeJson } from "./lib";
import { z } from "zod";

const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const only = onlyArg ? new Set(onlyArg.split(",")) : null;
const BROWSER_LIKE_ACCEPT = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8";

const robotsCache = new Map<string, string[]>();

async function disallowedPrefixes(origin: string): Promise<string[]> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  let rules: string[] = [];
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      let applies = false;
      for (const raw of (await res.text()).split(/\r?\n/)) {
        const line = raw.replace(/#.*/, "").trim();
        const [k, ...rest] = line.split(":");
        const v = rest.join(":").trim();
        if (/^user-agent$/i.test(k ?? "")) applies = v === "*" || /america360/i.test(v);
        else if (applies && /^disallow$/i.test(k ?? "") && v) rules.push(v);
      }
    }
  } catch {
    rules = [];
  }
  robotsCache.set(origin, rules);
  return rules;
}

function pageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ");

async function check(sourceId: string, url: string, evidence: string[]): Promise<LinkCheck> {
  const checkedAt = new Date().toISOString();
  const base = { sourceId, url, checkedAt };
  const u = new URL(url);
  const disallow = await disallowedPrefixes(u.origin);
  if (disallow.some((p) => p !== "/" ? u.pathname.startsWith(p) : true)) {
    return { ...base, httpStatus: null, finalUrl: null, pageTitle: null, outcome: "blocked", bodySha256: null, evidence: evidence.map((text) => ({ text, found: false })) };
  }
  try {
    const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: BROWSER_LIKE_ACCEPT }, redirect: "follow", signal: AbortSignal.timeout(25_000) });
    const body = await res.text();
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 200) ?? null;
    const finalUrl = res.url || url;
    const offsite = new URL(finalUrl).hostname.replace(/^www\./, "") !== u.hostname.replace(/^www\./, "");
    let outcome: LinkCheck["outcome"] = "ok";
    if (res.status === 401 || res.status === 403 || res.status === 429) outcome = "blocked";
    else if (res.status === 404 || res.status === 410) outcome = "not_found";
    else if (!res.ok) outcome = "error";
    else if (offsite) outcome = "redirected_offsite";
    const text = norm(pageText(body) + " " + body);
    return {
      ...base, httpStatus: res.status, finalUrl, pageTitle: title, outcome, bodySha256: sha256(body),
      evidence: evidence.map((t) => ({ text: t, found: outcome === "ok" && text.includes(norm(t)) })),
    };
  } catch (err) {
    console.warn(`  ${sourceId}: ${(err as Error).message}`);
    return { ...base, httpStatus: null, finalUrl: null, pageTitle: null, outcome: "error", bodySha256: null, evidence: evidence.map((text) => ({ text, found: false })) };
  }
}

async function main() {
  const curated = entitySeedFileSchema.parse(JSON.parse(readFileSync(path.join(SEED_DIR, "curated", "jacksonville.json"), "utf8")));
  const curatedSources = z.object({ sources: z.array(sourceSchema) }).parse(JSON.parse(readFileSync(path.join(SEED_DIR, "curated", "sources.json"), "utf8"))).sources;
  const requests = collectEvidenceRequests({ curated, curatedSources });
  // County official websites from the Phase 2 geography bundle: evidence = the county's short name.
  const geoPath = path.join(SEED_DIR, "generated", "florida-geography.json");
  if (existsSync(geoPath)) {
    const geo = geographyBundleSchema.parse(JSON.parse(readFileSync(geoPath, "utf8")));
    for (const f of geo.facts.filter((x) => x.key === "official-website" && typeof x.value === "string")) {
      requests.set(countyWebsiteSourceId(f.subjectSlug), { url: f.value as string, evidence: new Set([countyShortName(f.subjectSlug)]) });
    }
  }
  const outFile = path.join(SEED_DIR, "generated", "link-checks.json");

  let previous: LinkCheck[] = [];
  try {
    previous = linkCheckFileSchema.parse(JSON.parse(readFileSync(outFile, "utf8"))).checks;
  } catch {
    previous = [];
  }

  const results: LinkCheck[] = [];
  for (const [sourceId, req] of requests) {
    if (only && !only.has(sourceId)) {
      const prev = previous.find((p) => p.sourceId === sourceId);
      if (prev) results.push(prev);
      continue;
    }
    const r = await check(sourceId, req.url, [...req.evidence]);
    const found = r.evidence.filter((e) => e.found).length;
    console.log(`${r.outcome.padEnd(18)} ${String(r.httpStatus ?? "-").padEnd(4)} ${sourceId.padEnd(58)} evidence ${found}/${r.evidence.length}`);
    results.push(r);
    await new Promise((res) => setTimeout(res, 1000));
  }

  const file = linkCheckFileSchema.parse({ generatedAt: new Date().toISOString(), userAgent: USER_AGENT, checks: results });
  writeJson(outFile, file);
  const by = results.reduce<Record<string, number>>((acc, r) => ((acc[r.outcome] = (acc[r.outcome] ?? 0) + 1), acc), {});
  console.log("summary", by);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
