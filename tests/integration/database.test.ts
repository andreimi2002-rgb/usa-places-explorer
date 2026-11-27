/**
 * Integration tests against a real PostgreSQL + PostGIS (docker compose).
 * Uses a separate database (america360_test) so dev data is never touched.
 * Requires `npm run db:up`. If the server is unreachable the suite is SKIPPED
 * and vitest reports it as skipped — never as passed.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "../../scripts/db/migrate";
import { seed } from "../../scripts/db/seed";
import { LOCAL_OWNER_URL } from "../../scripts/db/common";
import { PostgresProvider } from "@/lib/data/postgres-provider";
import { fixture } from "../unit/helpers";

const ownerBase = process.env.DATABASE_URL ?? LOCAL_OWNER_URL;
const TEST_DB = "america360_test";
const withDb = (url: string, db: string) => {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u.toString();
};
const ownerUrl = withDb(ownerBase, TEST_DB);
const readerUrl = (() => {
  const u = new URL(ownerUrl);
  u.username = "a360_reader";
  u.password = process.env.A360_READER_PASSWORD && process.env.A360_READER_PASSWORD !== "CHANGE_ME" ? process.env.A360_READER_PASSWORD : "a360_reader_local_dev";
  return u.toString();
})();

async function reachable(): Promise<boolean> {
  const c = new pg.Client({ connectionString: ownerBase, connectionTimeoutMillis: 3000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}

const available = await reachable();
const quiet = () => {};

describe.skipIf(!available)("database mode (PostgreSQL + PostGIS)", () => {
  let reader: PostgresProvider;
  let firstSeed: Record<string, number>;
  let secondSeed: Record<string, number>;

  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: ownerBase });
    await admin.connect();
    await admin.query(`drop database if exists ${TEST_DB} with (force)`);
    await admin.query(`create database ${TEST_DB}`);
    await admin.end();
    await migrate(ownerUrl, quiet);
    firstSeed = (await seed(ownerUrl, { log: quiet })).counts;
    secondSeed = (await seed(ownerUrl, { log: quiet })).counts;
    reader = new PostgresProvider(readerUrl);
  });

  afterAll(async () => {
    await reader?.close();
  });

  it("re-running migrations is a no-op", async () => {
    const r = await migrate(ownerUrl, quiet);
    expect(r.applied).toBe(0);
  });

  it("re-running the seed changes nothing (idempotent import)", () => {
    expect(firstSeed.entities).toBeGreaterThan(0);
    expect(firstSeed.areas).toBeGreaterThan(1000);
    for (const [k, v] of Object.entries(secondSeed)) expect({ [k]: v }).toEqual({ [k]: 0 });
  });

  it("stores all 67 Florida counties once, with valid PostGIS geometries", async () => {
    const c = new pg.Client({ connectionString: ownerUrl });
    await c.connect();
    const r = await c.query(`select count(*)::int n, count(distinct geoid)::int g, count(*) filter (where st_isvalid(geom))::int v
      from a360.areas where area_type = 'county' and parent_id = (select id from a360.areas where slug = 'florida')`);
    const spatial = await c.query(`select a.name from a360.areas a, a360.areas d where d.slug = 'duval-county-fl'
      and a.area_type = 'municipality' and st_intersects(a.internal_point::geometry, d.geom) order by 1`);
    const runs = await c.query("select status from a360.import_runs order by started_at");
    await c.end();
    expect(r.rows[0]).toEqual({ n: 67, g: 67, v: 67 });
    expect(spatial.rows.map((x) => x.name)).toEqual(["Atlantic Beach", "Baldwin", "Jacksonville", "Jacksonville Beach", "Neptune Beach"]);
    expect(runs.rows.map((x) => x.status)).toEqual(["succeeded", "succeeded"]);
  });

  it("the website role is read-only and row-level security hides non-public rows", async () => {
    const owner = new pg.Client({ connectionString: ownerUrl });
    await owner.connect();
    await owner.query("update a360.entities set visibility = 'hidden' where slug = 'csx'");
    const r = new pg.Client({ connectionString: readerUrl });
    await r.connect();
    try {
      const visible = await r.query("select count(*)::int n from a360.entities where slug = 'csx'");
      expect(visible.rows[0].n).toBe(0);
      expect(await reader.getEntity("csx")).toBeNull();
      await expect(r.query("insert into a360.categories (id, slug, name, domain_number, depth) values (gen_random_uuid(), 'x', 'x', 1, 0)")).rejects.toThrow(/permission denied/);
      await expect(r.query("select * from a360.review_issues")).rejects.toThrow(/permission denied/);
    } finally {
      await owner.query("update a360.entities set visibility = 'public' where slug = 'csx'");
      await owner.end();
      await r.end();
    }
  });

  it("resolves merged slugs through slug_redirects", async () => {
    const owner = new pg.Client({ connectionString: ownerUrl });
    await owner.connect();
    await owner.query("insert into a360.slug_redirects (kind, old_slug, target_id) select 'entity', 'jaguars-old', id from a360.entities where slug = 'jacksonville-jaguars' on conflict do nothing");
    await owner.end();
    expect(await reader.resolveRedirect("entity", "jaguars-old")).toBe("jacksonville-jaguars");
    expect(await reader.resolveRedirect("entity", "nope")).toBeNull();
  });

  describe("parity with fixture mode", () => {
    const fx = fixture();
    const strip = <T>(x: T) => JSON.parse(JSON.stringify(x)) as T;

    it("same stats", async () => {
      const [a, b] = [await fx.getStats(), await reader.getStats()];
      expect(b.areasByType).toEqual(a.areasByType);
      expect([b.entities, b.verifiedEntities, b.facts, b.sources, b.categories]).toEqual([a.entities, a.verifiedEntities, a.facts, a.sources, a.categories]);
    });

    it.each(["florida", "duval-county-fl", "jacksonville-fl", "southside-jacksonville-fl", "midway-cdp-seminole-fl"])("same area detail: %s", async (slug) => {
      const [a, b] = [await fx.getArea(slug), await reader.getArea(slug)];
      expect(b!.breadcrumbs).toEqual(a!.breadcrumbs);
      expect(b!.childCounts).toEqual(a!.childCounts);
      expect(b!.entityCount).toBe(a!.entityCount);
      expect(b!.populationEstimate).toBe(a!.populationEstimate);
      expect(b!.lat).toBeCloseTo(a!.lat ?? 0, 5);
      expect(new Set(b!.facts.map((f) => `${f.key}=${f.valueNum ?? f.valueText}`))).toEqual(new Set(a!.facts.map((f) => `${f.key}=${f.valueNum ?? f.valueText}`)));
      expect(new Set(b!.related.map((r) => `${r.direction}:${r.relationType}:${r.area.slug}`))).toEqual(new Set(a!.related.map((r) => `${r.direction}:${r.relationType}:${r.area.slug}`)));
      expect(new Set(b!.sources.map((s) => s.id))).toEqual(new Set(a!.sources.map((s) => s.id)));
    });

    it.each(["jacksonville-jaguars", "ikea-jacksonville", "everbank-stadium", "american-alligator", "st-johns-town-center"])("same entity detail: %s", async (slug) => {
      const [a, b] = [strip(await fx.getEntity(slug)), strip(await reader.getEntity(slug))];
      expect(b!.breadcrumbs).toEqual(a!.breadcrumbs);
      expect(b!.primaryCategory).toEqual(a!.primaryCategory);
      expect(b!.placeLabel).toBe(a!.placeLabel);
      expect(b!.reviewStatus).toBe(a!.reviewStatus);
      expect(b!.openIssues).toBe(a!.openIssues);
      expect(new Set(b!.areas.map((x) => `${x.slug}:${x.relationType}:${x.reviewStatus}`))).toEqual(new Set(a!.areas.map((x) => `${x.slug}:${x.relationType}:${x.reviewStatus}`)));
      expect(new Set(b!.relations.map((x) => `${x.direction}:${x.relationType}:${x.entity.slug}:${x.reviewStatus}`))).toEqual(new Set(a!.relations.map((x) => `${x.direction}:${x.relationType}:${x.entity.slug}:${x.reviewStatus}`)));
      expect(new Set(b!.facts.map((f) => f.id))).toEqual(new Set(a!.facts.map((f) => f.id)));
      expect(new Set(b!.sources.map((s) => `${s.id}:${s.lastCheck?.outcome}`))).toEqual(new Set(a!.sources.map((s) => `${s.id}:${s.lastCheck?.outcome}`)));
    });

    it.each([
      { areaSlug: "jacksonville-fl" },
      { areaSlug: "jacksonville-fl", categorySlug: "retail" },
      { areaSlug: "florida", categorySlug: "sports" },
      { q: "jacksonville university" },
      { reviewStatus: "verified" as const },
      { areaSlug: "southside-jacksonville-fl" },
    ])("same entity listing: %o", async (query) => {
      const [a, b] = [await fx.listEntities({ ...query, pageSize: 100 }), await reader.listEntities({ ...query, pageSize: 100 })];
      expect(b.total).toBe(a.total);
      expect(new Set(b.items.map((e) => e.slug))).toEqual(new Set(a.items.map((e) => e.slug)));
      if (query.q) expect(b.items[0]?.slug).toBe(a.items[0]?.slug);
    });

    it.each(["jaguars", "duval", "JSO", "st johns", "supermarkets", "big talbot"])("same top search hit: %s", async (q) => {
      const [a, b] = [await fx.search(q), await reader.search(q)];
      expect(b[0]?.slug).toBe(a[0]?.slug);
      expect(new Set(b.map((h) => `${h.kind}:${h.slug}`))).toEqual(new Set(a.map((h) => `${h.kind}:${h.slug}`)));
    });

    it("same category tree counts (scoped to Jacksonville)", async () => {
      const flat = (n: { slug: string; entityCount: number; children: unknown[] }[]): string[] =>
        n.flatMap((x) => [`${x.slug}:${x.entityCount}`, ...flat(x.children as typeof n)]);
      expect(flat(await reader.getCategoryTree("jacksonville-fl"))).toEqual(flat(await fx.getCategoryTree("jacksonville-fl")));
    });

    it.each(["florida", "jacksonville-fl"])("same coverage report: %s", async (slug) => {
      const [a, b] = [await fx.getCoverage(slug), await reader.getCoverage(slug)];
      expect(b!.totals).toEqual(a!.totals);
      expect(b!.cells).toEqual(a!.cells);
      expect(new Set(b!.universes.map((u) => `${u.id}:${u.numerator}/${u.denominator}`))).toEqual(new Set(a!.universes.map((u) => `${u.id}:${u.numerator}/${u.denominator}`)));
      expect(new Set(b!.openIssues.map((i) => `${i.kind}:${i.n}`))).toEqual(new Set(a!.openIssues.map((i) => `${i.kind}:${i.n}`)));
    });

    it("same localities paging", async () => {
      const q = { areaType: "municipality" as const, deep: true, page: 2, pageSize: 50 };
      const [a, b] = [await fx.listChildAreas("florida", q), await reader.listChildAreas("florida", q)];
      expect(b.total).toBe(a.total);
      expect(b.items.length).toBe(a.items.length);
    });

    it("same source registry usage counts", async () => {
      const [a, b] = [await fx.listSources(), await reader.listSources()];
      expect(new Map(b.map((s) => [s.id, s.usage]))).toEqual(new Map(a.map((s) => [s.id, s.usage])));
    });
  });
});
