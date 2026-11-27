import { describe, expect, it } from "vitest";
import { buildDataset, collectEvidenceRequests, DatasetError } from "@/lib/data/build";
import type { LinkCheck } from "@/lib/domain/schemas";
import type { SeedInputs } from "@/lib/data/inputs";
import { inputs } from "./helpers";

/** A minimal synthetic seed with one entity whose website is "checked" by a fake link check. */
function synthetic(check: Partial<LinkCheck> | null, evidenceFound: Record<string, boolean> = {}): SeedInputs {
  const base = inputs();
  const entity = {
    slug: "test-store", name: "Test Store", aliases: [], entityType: "store" as const, status: "active" as const,
    officialUrl: "https://example.org/store", categories: [{ slug: "supermarkets", primary: true }],
    areas: [{ slug: "jacksonville-fl", relation: "located_in" as const, reviewStatus: "unreviewed" as const, evidence: "Jacksonville" }],
    relations: [], claims: [{ key: "street-address", value: "1 Main St", evidence: "1 Main St" }],
    sourceIds: [], externalIds: [], sensitiveLocation: false, visibility: "public" as const,
  };
  return {
    ...base,
    geography: null, // isolate entity logic from the Phase 2 geography bundle
    enrichments: [], // ...and from Wikidata/OSM enrichment
    curated: { ...base.curated, entities: [entity], neighborhoods: [] },
    media: [],
    linkChecks: check
      ? {
          generatedAt: "2026-11-27T00:00:00.000Z",
          userAgent: "test",
          checks: [
            {
              sourceId: "site-test-store", url: entity.officialUrl, checkedAt: "2026-11-27T00:00:00.000Z", httpStatus: 200, finalUrl: entity.officialUrl,
              pageTitle: "Test", outcome: "ok", bodySha256: null,
              evidence: Object.entries(evidenceFound).map(([text, found]) => ({ text, found })),
              ...check,
            },
          ],
        }
      : null,
  };
}

describe("evidence-based verification", () => {
  it("turns found evidence into a verified fact and a verified location", () => {
    const ds = buildDataset(synthetic({}, { Jacksonville: true, "1 Main St": true }));
    const e = ds.entities[0]!;
    expect(e.reviewStatus).toBe("verified");
    expect(ds.facts.filter((f) => f.entityId === e.id).map((f) => f.valueText)).toEqual(["1 Main St"]);
    expect(ds.entityAreas[0]!.reviewStatus).toBe("verified");
    expect(ds.reviewIssues).toHaveLength(0);
  });

  it("keeps an unconfirmed claim out of facts and opens a review issue instead", () => {
    const ds = buildDataset(synthetic({}, { Jacksonville: true, "1 Main St": false }));
    expect(ds.facts.filter((f) => f.entityId)).toHaveLength(0);
    expect(ds.reviewIssues.map((i) => i.kind)).toEqual(["claim_unverified"]);
  });

  it("treats a blocked source as unreviewed, not as verified or failed", () => {
    const ds = buildDataset(synthetic({ outcome: "blocked", httpStatus: 403 }, { Jacksonville: false, "1 Main St": false }));
    expect(ds.entities[0]!.reviewStatus).toBe("unreviewed");
    expect(ds.entityAreas[0]!.reviewStatus).toBe("unreviewed");
    expect(ds.reviewIssues.every((i) => i.kind === "source_blocked")).toBe(true);
  });

  it("marks an entity stale when its source page is gone", () => {
    const ds = buildDataset(synthetic({ outcome: "not_found", httpStatus: 404 }, { Jacksonville: false, "1 Main St": false }));
    expect(ds.entities[0]!.reviewStatus).toBe("stale");
  });

  it("verifies nothing without a link check", () => {
    const ds = buildDataset(synthetic(null));
    expect(ds.entities[0]!.reviewStatus).toBe("unreviewed");
    expect(ds.facts.filter((f) => f.entityId)).toHaveLength(0);
  });

  it("rejects references to unknown areas and categories", () => {
    const bad = synthetic(null);
    bad.curated.entities[0]!.areas[0]!.slug = "no-such-place-xyz";
    expect(() => buildDataset(bad)).toThrow(DatasetError);
    const bad2 = synthetic(null);
    bad2.curated.entities[0]!.categories[0]!.slug = "not-a-category";
    expect(() => buildDataset(bad2)).toThrow(/unknown category/);
  });

  it("collects every evidence string the link checker must look for", () => {
    const req = collectEvidenceRequests(synthetic(null));
    expect([...req.get("site-test-store")!.evidence].sort()).toEqual(["1 Main St", "Jacksonville"]);
  });

  it("produces stable ids across builds (idempotent seeds)", () => {
    expect(buildDataset(inputs()).entities.map((e) => e.id)).toEqual(buildDataset(inputs()).entities.map((e) => e.id));
  });
});
