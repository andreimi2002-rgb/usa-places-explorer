import { describe, expect, it } from "vitest";
import { loadGeometry } from "@/lib/data/inputs";
import { dataset, inputs } from "./helpers";

describe("seed integrity", () => {
  const ds = dataset();
  const areaBySlug = new Map(ds.areas.map((a) => [a.slug, a]));
  const florida = areaBySlug.get("florida")!;

  it("has exactly 67 Florida counties with unique official GEOIDs", () => {
    const counties = ds.areas.filter((a) => a.areaType === "county" && a.parentId === florida.id);
    expect(counties).toHaveLength(67);
    expect(new Set(counties.map((c) => c.geoid)).size).toBe(67);
    for (const c of counties) expect(c.geoid).toMatch(/^12\d{3}$/);
    expect(counties.map((c) => c.name)).toContain("Duval County");
    expect(counties.map((c) => c.name)).toContain("Miami-Dade County");
  });

  it("has a display geometry for every county and every state record", () => {
    const geo = loadGeometry();
    const slugs = new Set(geo.floridaCounties.features.map((f) => f.properties.slug));
    for (const c of ds.areas.filter((a) => a.areaType === "county")) expect(slugs.has(c.slug)).toBe(true);
    expect(geo.states.features.length).toBe(52);
  });

  it("links every incorporated municipality to a Florida county", () => {
    const munis = ds.areas.filter((a) => a.areaType === "municipality");
    expect(munis.length).toBe(411);
    for (const m of munis) expect(ds.areas.find((a) => a.id === m.parentId)?.areaType).toBe("county");
    const duvalMunis = munis.filter((m) => m.parentId === areaBySlug.get("duval-county-fl")!.id).map((m) => m.name).sort();
    expect(duvalMunis).toEqual(["Atlantic Beach", "Baldwin", "Jacksonville", "Jacksonville Beach", "Neptune Beach"]);
  });

  it("registers 50 states plus DC and Puerto Rico, with only Florida active", () => {
    expect(ds.areas.filter((a) => a.areaType === "state")).toHaveLength(50);
    expect(areaBySlug.get("district-of-columbia")?.areaType).toBe("federal_district");
    expect(areaBySlug.get("puerto-rico")?.areaType).toBe("territory");
    const activeStates = ds.areas.filter((a) => ["state", "territory", "federal_district"].includes(a.areaType) && a.programStatus === "active");
    expect(activeStates.map((a) => a.slug)).toEqual(["florida"]);
  });

  it("has unique slugs and ids everywhere", () => {
    for (const rows of [ds.areas, ds.entities, ds.categories]) {
      expect(new Set(rows.map((r) => r.slug)).size).toBe(rows.length);
      expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    }
    expect(new Set(ds.facts.map((f) => f.id)).size).toBe(ds.facts.length);
  });

  it("cites a registered source for every fact, area and relation", () => {
    const sources = new Set(ds.sources.map((s) => s.id));
    for (const f of ds.facts) expect(sources.has(f.sourceId)).toBe(true);
    for (const a of ds.areas) for (const s of a.sourceIds) expect(sources.has(s)).toBe(true);
    for (const r of ds.areaRelations) expect(sources.has(r.sourceId)).toBe(true);
    for (const r of ds.entityRelations) if (r.sourceId) expect(sources.has(r.sourceId)).toBe(true);
  });

  it("dates every population fact and never stores zero for a missing value", () => {
    for (const f of ds.facts.filter((x) => x.key.startsWith("population"))) {
      expect(f.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.valueNum).toBeGreaterThan(0);
    }
  });

  it("publishes entity facts only when the evidence was verified", () => {
    for (const f of ds.facts.filter((x) => x.entityId)) {
      expect(f.reviewStatus).toBe("verified");
      expect(f.verifiedAt).not.toBeNull();
    }
  });

  it("gives each entity exactly one primary category in the 24-domain taxonomy", () => {
    expect(inputs().taxonomy.domains).toHaveLength(24);
    for (const e of ds.entities) expect(ds.entityCategories.filter((c) => c.entityId === e.id && c.isPrimary)).toHaveLength(1);
  });

  it("never attaches precise locations to sensitive entities and never labels AI media as photos", () => {
    for (const e of ds.entities.filter((x) => x.entityType === "species")) expect(e.sensitiveLocation).toBe(true);
    for (const m of ds.media) expect(m.aiGenerated && m.kind === "photo").toBe(false);
  });

  it("records a checksum and retrieval time for every dataset source", () => {
    for (const s of ds.sources.filter((x) => x.kind === "dataset")) {
      expect(s.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(s.retrievedAt).toBeTruthy();
    }
  });
});
