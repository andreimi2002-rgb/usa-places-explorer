import { describe, expect, it } from "vitest";
import { clampPage, scoreText } from "@/lib/data/fixture-provider";
import { fixture } from "./helpers";

const db = fixture();

describe("fixture provider — geography", () => {
  it("builds breadcrumbs United States › Florida › Duval County for Jacksonville", async () => {
    const jax = await db.getArea("jacksonville-fl");
    expect(jax?.breadcrumbs.map((c) => c.slug)).toEqual(["united-states", "florida", "duval-county-fl"]);
    expect(jax?.facts.find((f) => f.key === "population-estimate")?.valueNum).toBeGreaterThan(900_000);
    expect(jax?.media[0]?.license).toBe("CC BY-SA 4.0");
  });

  it("lists Duval municipalities and deep-lists all Florida municipalities", async () => {
    expect((await db.listChildAreas("duval-county-fl", { areaType: "municipality" })).total).toBe(5);
    expect((await db.listChildAreas("florida", { areaType: "municipality", deep: true, pageSize: 1 })).total).toBe(411);
    const filtered = await db.listChildAreas("florida", { areaType: "county", q: "dade" });
    expect(filtered.items.map((a) => a.name)).toEqual(["Miami-Dade County"]);
  });

  it("records overlapping county relations for multi-county municipalities", async () => {
    const all = await db.listChildAreas("florida", { areaType: "municipality", deep: true, pageSize: 500 });
    let multi = 0;
    for (const m of all.items) {
      const a = await db.getArea(m.slug);
      if (a!.related.filter((r) => r.relationType === "intersects").length > 1) multi++;
    }
    expect(multi).toBeGreaterThan(0);
  });

  it("returns null for unknown places", async () => {
    expect(await db.getArea("no-such-place-xyz")).toBeNull();
  });
});

describe("fixture provider — entities, filters, search", () => {
  it("includes entities linked to descendant areas (neighborhoods) in a city scope", async () => {
    const jax = await db.listEntities({ areaSlug: "jacksonville-fl", pageSize: 100 });
    expect(jax.total).toBeGreaterThan(30);
    const southside = await db.listEntities({ areaSlug: "southside-jacksonville-fl", pageSize: 100 });
    expect(southside.total).toBeGreaterThan(0);
    for (const e of southside.items) expect((await db.listEntities({ areaSlug: "jacksonville-fl", q: e.name })).items.some((x) => x.slug === e.slug)).toBe(true);
  });

  it("filters by a domain including all nested subcategories", async () => {
    const inRetail = async (q: string) => (await db.listEntities({ categorySlug: "retail", areaSlug: "jacksonville-fl", q })).items.map((e) => e.slug);
    expect(await inRetail("IKEA Jacksonville")).toContain("ikea-jacksonville");
    expect(await inRetail("St. Johns Town Center")).toContain("st-johns-town-center"); // open-air-centers ⊂ shopping-centers ⊂ retail
    expect(await inRetail("Jacksonville Jaguars")).not.toContain("jacksonville-jaguars");
  });

  it("paginates with bounded page sizes", async () => {
    const p1 = await db.listEntities({ areaSlug: "jacksonville-fl", page: 1, pageSize: 5 });
    const p2 = await db.listEntities({ areaSlug: "jacksonville-fl", page: 2, pageSize: 5 });
    expect(p1.items).toHaveLength(5);
    expect(p1.items.map((e) => e.slug)).not.toEqual(p2.items.map((e) => e.slug));
    expect(clampPage(0, 10_000)).toEqual({ page: 1, pageSize: 100, offset: 0 });
  });

  it("ranks exact names first and finds aliases", async () => {
    expect((await db.search("Jacksonville Jaguars"))[0]?.slug).toBe("jacksonville-jaguars");
    expect((await db.search("jaguars"))[0]?.slug).toBe("jacksonville-jaguars"); // exact alias beats a name that merely starts with it
    expect((await db.search("JSO")).some((h) => h.slug === "jacksonville-sheriffs-office")).toBe(true);
    expect((await db.search("duval"))[0]?.slug).toBe("duval-county-fl");
    expect(await db.search("   ")).toEqual([]);
  });

  it("searches categories too", async () => {
    expect((await db.search("supermarkets")).some((h) => h.kind === "category" && h.slug === "supermarkets")).toBe(true);
  });

  it("shows a relation from both sides (team → venue, venue ← team)", async () => {
    const venue = await db.getEntity("everbank-stadium");
    expect(venue?.relations.some((r) => r.entity.slug === "jacksonville-jaguars" && r.direction === "in")).toBe(true);
  });

  it("never marks prototype-only neighborhood placements as trusted", async () => {
    const e = await db.getEntity("st-johns-town-center");
    expect(e?.areas.find((a) => a.slug === "southside-jacksonville-fl")?.reviewStatus).toBe("unreviewed");
  });
});

describe("fixture provider — coverage", () => {
  it("computes registry completeness only from documented universes", async () => {
    const c = await db.getCoverage("florida");
    expect(c!.universes.find((u) => u.id === "fl-counties-2026")).toMatchObject({ numerator: 67, denominator: 67 });
    const munis = c!.universes.find((u) => u.id === "fl-municipalities-2026")!;
    expect(munis.numerator).toBe(munis.denominator);
  });

  it("reports honest zeros for domains with no records", async () => {
    const c = await db.getCoverage("jacksonville-fl");
    expect(c!.cells).toHaveLength(24);
    expect(c!.cells.find((x) => x.domain.slug === "automotive")!.total).toBe(0);
    expect(c!.totals.all).toBe(c!.cells.reduce((s, x) => s + x.total, 0));
    expect(c!.universes).toHaveLength(0); // no denominator for Jacksonville yet
  });
});

describe("scoreText", () => {
  it("orders exact > prefix > word-prefix > anywhere > none", () => {
    expect(scoreText("publix", "Publix", "publix")).toBe(100);
    expect(scoreText("pub", "Publix", "publix")).toBe(70);
    expect(scoreText("jaguars jack", "Jacksonville Jaguars", "")).toBe(50);
    expect(scoreText("nfl", "Jacksonville Jaguars", "national football league nfl")).toBe(25);
    expect(scoreText("zzz", "Publix", "publix")).toBe(0);
  });
});
