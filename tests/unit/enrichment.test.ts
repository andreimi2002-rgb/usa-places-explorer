import { describe, expect, it } from "vitest";
import { buildDataset, DatasetError } from "@/lib/data/build";
import { FixtureProvider, haversineKm } from "@/lib/data/fixture-provider";
import type { EnrichedEntity, EnrichmentBundle } from "@/lib/domain/schemas";
import type { SeedInputs } from "@/lib/data/inputs";
import { commonsThumb } from "@/lib/media";
import { inputs } from "./helpers";

const T = "2026-11-27T12:00:00.000Z";

function rec(over: Partial<EnrichedEntity> & Pick<EnrichedEntity, "qid" | "slug" | "name">): EnrichedEntity {
  return {
    aliases: [], entityType: "museum", status: "active", origin: "wikidata-place",
    categories: [{ slug: "museums", primary: true }], areas: [{ slug: "jacksonville-fl", relation: "located_in" }],
    facts: [], relations: [], externalIds: [{ provider: "wikidata", id: over.qid }], media: [], ...over,
  };
}

function withBundle(entities: EnrichedEntity[]): SeedInputs {
  const bundle: EnrichmentBundle = {
    generatedAt: T, generator: "test", areaSlug: "jacksonville-fl", stats: {},
    sources: [
      { id: "wikidata", kind: "reference", title: "Wikidata", publisher: "WMF", url: "https://www.wikidata.org/", license: "CC0", redisplayPermitted: true, expectedFields: [] },
      { id: "openstreetmap-overpass", kind: "dataset", title: "OSM", publisher: "OSM", url: "https://www.openstreetmap.org/copyright", license: "ODbL", redisplayPermitted: true, expectedFields: [] },
    ],
    entities,
  };
  return { ...inputs(), enrichments: [bundle] };
}

describe("enrichment bundles", () => {
  const ds = buildDataset(withBundle([
    rec({ qid: "Q1", slug: "test-museum", name: "Test Museum", coords: { lat: 30.33, lon: -81.66 }, wikipedia: { title: "Test Museum", url: "https://en.wikipedia.org/wiki/Test_Museum", extract: "A museum.", retrievedAt: T },
      facts: [{ key: "opened", value: "1999-05-01", sourceId: "wikidata", sourceRef: "Q1 P1619" }],
      media: [{ kind: "photo", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/1600px-X.jpg", pageUrl: "https://commons.wikimedia.org/wiki/File:X.jpg", alt: "Photograph of Test Museum", credit: "Someone", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" }],
      relations: [{ type: "operated_by", targetQid: "Q2" }] }),
    rec({ qid: "Q2", slug: "test-operator", name: "Test Operator", entityType: "organization", categories: [{ slug: "community-organizations", primary: true }], coords: { lat: 30.331, lon: -81.661 } }),
    // enriches the curated EverBank Stadium instead of creating a duplicate
    rec({ qid: "Q3", slug: "everbank-stadium", curatedSlug: "everbank-stadium", name: "EverBank Stadium", entityType: "venue", categories: [{ slug: "stadiums-arenas", primary: true }], coords: { lat: 30.3239, lon: -81.6373 } }),
    rec({ qid: "Q4", slug: "test-burger", name: "Test Burger", entityType: "brand", origin: "osm-brand", categories: [{ slug: "restaurant-chains", primary: true }, { slug: "fast-food", primary: false }],
      areas: [{ slug: "jacksonville-fl", relation: "operates_in" }],
      facts: [{ key: "osm-location-count", value: 12, unit: "locations", asOf: "2026-11-27", sourceId: "openstreetmap-overpass", sourceRef: "brand:wikidata=Q4", scopeAreaSlug: "jacksonville-fl" }] }),
  ]));
  const db = new FixtureProvider(ds);

  it("creates new entities with sourced coordinates, Wikipedia text, facts and media", async () => {
    const e = await db.getEntity("test-museum");
    expect(e?.lat).toBe(30.33);
    expect(e?.wikipedia?.extract).toBe("A museum.");
    expect(e?.facts.find((f) => f.key === "opened")).toMatchObject({ valueText: "1999-05-01", reviewStatus: "imported", sourceId: "wikidata" });
    expect(e?.media[0]?.license).toBe("CC BY-SA 4.0");
    expect(e?.image?.url).toContain("upload.wikimedia.org");
    expect(e?.externalIds).toContainEqual({ provider: "wikidata", externalId: "Q1" });
  });

  it("enriches curated entities instead of duplicating them", () => {
    expect(ds.entities.filter((x) => x.name === "EverBank Stadium")).toHaveLength(1);
    const stadium = ds.entities.find((x) => x.slug === "everbank-stadium")!;
    expect(stadium.wikidataId).toBe("Q3");
    expect(stadium.lat).toBeCloseTo(30.3239);
    expect(stadium.reviewStatus).not.toBe("imported"); // curated verification status is kept
  });

  it("resolves Wikidata relations to entity ids when both ends are in the dataset", async () => {
    const e = await db.getEntity("test-museum");
    expect(e?.relations.some((r) => r.relationType === "operated_by" && r.entity.slug === "test-operator")).toBe(true);
  });

  it("lists brand presence for an area from OSM counts", async () => {
    const brands = await db.listBrandPresence("jacksonville-fl");
    expect(brands).toHaveLength(1);
    expect(brands[0]).toMatchObject({ count: 12, asOf: "2026-11-27" });
    expect(await db.listBrandPresence("jacksonville-fl", { categorySlug: "fast-food" })).toHaveLength(1);
    expect(await db.listBrandPresence("jacksonville-fl", { categorySlug: "supermarkets" })).toHaveLength(0);
    expect((await db.getEntity("test-burger"))?.presence).toEqual([{ areaSlug: "jacksonville-fl", areaName: "Jacksonville", count: 12, asOf: "2026-11-27" }]);
  });

  it("finds nearby entities by real distance and never uses sensitive locations", async () => {
    const near = await db.nearbyEntities("test-museum", { radiusKm: 1 });
    expect(near.map((n) => n.slug)).toEqual(["test-operator"]);
    expect(near[0]!.distanceKm).toBeLessThan(0.2);
    expect(await db.nearbyEntities("american-alligator")).toEqual([]);
    expect(haversineKm(30, -81, 31, -81)).toBeCloseTo(111.2, 0);
  });

  it("rejects enrichment records pointing at unknown categories or colliding slugs", () => {
    expect(() => buildDataset(withBundle([rec({ qid: "Q9", slug: "x-museum", name: "X", categories: [{ slug: "nope", primary: true }] })]))).toThrow(/unknown category/);
    expect(() => buildDataset(withBundle([rec({ qid: "Q9", slug: "jacksonville-jaguars", name: "X" })]))).toThrow(DatasetError);
  });

  it("requests smaller standard Commons thumbnails and leaves originals alone", () => {
    expect(commonsThumb("https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/1600px-X.jpg", 500)).toBe("https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/500px-X.jpg");
    expect(commonsThumb("https://upload.wikimedia.org/wikipedia/commons/a/ab/X.jpg", 500)).toBe("https://upload.wikimedia.org/wikipedia/commons/a/ab/X.jpg");
  });
});
