import { describe, expect, it } from "vitest";
import { countyShortName } from "@/lib/data/build";
import { loadPlaceGeometry } from "@/lib/data/inputs";
import { dataset, fixture, inputs } from "./helpers";

const geo = inputs().geography;
const ds = dataset();
const bySlug = new Map(ds.areas.map((a) => [a.slug, a]));
const byId = new Map(ds.areas.map((a) => [a.id, a]));

describe.skipIf(!geo)("Phase 2 geography bundle", () => {
  it("has a 2025 boundary polygon for every incorporated place and CDP", () => {
    const places = ds.areas.filter((a) => a.areaType === "municipality" || a.areaType === "cdp");
    const shapes = loadPlaceGeometry();
    expect(places.length).toBe(958);
    for (const p of places) expect(shapes.has(p.slug), p.slug).toBe(true);
  });

  it("puts every CDP under the county holding its largest area share", () => {
    for (const cdp of ds.areas.filter((a) => a.areaType === "cdp")) {
      expect(byId.get(cdp.parentId!)?.areaType, cdp.slug).toBe("county");
      const shares = ds.areaRelations.filter((r) => r.areaId === cdp.id && r.relationType === "intersects");
      const best = shares.sort((a, b) => (b.share ?? 0) - (a.share ?? 0))[0]!;
      expect(best.relatedAreaId).toBe(cdp.parentId);
    }
  });

  it("stores area shares that sum to ~100% for each place", () => {
    const byPlace = new Map<string, number>();
    for (const r of ds.areaRelations.filter((x) => x.relationType === "intersects" && x.share !== null)) byPlace.set(r.areaId, (byPlace.get(r.areaId) ?? 0) + r.share!);
    for (const [id, total] of byPlace) expect(total, byId.get(id)!.slug).toBeGreaterThan(0.97);
    expect([...byPlace.values()].every((t) => t < 1.03)).toBe(true);
  });

  it("drops the bundle-1 internal-point approximations once geometry exists", () => {
    expect(ds.areaRelations.filter((r) => r.relationType === "contains_internal_point_of")).toHaveLength(0);
  });

  it("links county seats to real places (Duval → Jacksonville, Leon → Tallahassee)", () => {
    const seatOf = (county: string) => {
      const rel = ds.areaRelations.find((r) => r.areaId === bySlug.get(county)!.id && r.relationType === "county_seat");
      return rel ? byId.get(rel.relatedAreaId)!.slug : null;
    };
    expect(seatOf("duval-county-fl")).toBe("jacksonville-fl");
    expect(seatOf("leon-county-fl")).toBe("tallahassee-fl");
    expect(seatOf("st-johns-county-fl")).toBe("st-augustine-fl");
    expect(ds.areaRelations.filter((r) => r.relationType === "county_seat").length).toBeGreaterThanOrEqual(66);
  });

  it("never marks a county website verified without a successful link check", () => {
    const checked = new Map((inputs().linkChecks?.checks ?? []).map((c) => [c.sourceId, c]));
    for (const f of ds.facts.filter((x) => x.key === "official-website")) {
      const county = byId.get(f.areaId!)!;
      const c = checked.get(`site-${county.slug}`);
      if (f.reviewStatus === "verified") expect(c?.outcome).toBe("ok");
      if (!c || c.outcome !== "ok") expect(f.reviewStatus).not.toBe("verified");
    }
  });

  it("imports GNIS named places with official ids, points and no fake boundaries", () => {
    const communities = ds.areas.filter((a) => a.areaType === "community");
    expect(communities.length).toBeGreaterThan(5000);
    for (const c of communities) {
      expect(c.ansi).toMatch(/^\d{8}$/);
      expect(c.lat).not.toBeNull();
      expect(c.landAreaSqMi).toBeNull();
      expect(["county", "municipality"]).toContain(byId.get(c.parentId!)!.areaType);
    }
    const ansis = ds.areas.map((a) => a.ansi).filter(Boolean);
    expect(new Set(ansis).size).toBe(ansis.length);
  });

  it("gives curated Jacksonville neighborhoods their GNIS point instead of duplicating them", () => {
    const mandarin = bySlug.get("mandarin-jacksonville-fl")!;
    expect(mandarin.lat).not.toBeNull();
    expect(mandarin.sourceIds).toContain("usgs-gnis-domestic-names-fl");
    expect(ds.areas.filter((a) => a.name === "Mandarin" && a.parentId === bySlug.get("jacksonville-fl")!.id)).toHaveLength(1);
  });

  it("computes relation-based coverage (county seats) from records", async () => {
    const c = await fixture().getCoverage("florida");
    const seats = c!.universes.find((u) => u.id === "fl-county-seats")!;
    expect(seats.denominator).toBe(67);
    expect(seats.numerator).toBe(ds.areaRelations.filter((r) => r.relationType === "county_seat").length);
  });

  it("keeps real jurisdictions above same-named GNIS points in search", async () => {
    expect((await fixture().search("duval"))[0]?.slug).toBe("duval-county-fl");
    expect((await fixture().search("Jacksonville"))[0]?.slug).toBe("jacksonville-fl");
  });

  it("derives county short names for link-check evidence", () => {
    expect(countyShortName("st-johns-county-fl")).toBe("St. Johns");
    expect(countyShortName("miami-dade-county-fl")).toBe("Miami-Dade");
    expect(countyShortName("desoto-county-fl")).toBe("DeSoto");
  });
});
