import { describe, expect, it } from "vitest";
import { brandCategory, classify } from "../../scripts/ingest/type-map";
import { byScore } from "@/lib/data/fixture-provider";
import type { SearchHit } from "@/lib/data/types";

const cat = (labels: string[]) => classify(labels)?.rule.category ?? null;

describe("Wikidata class mapping", () => {
  it("keeps well-known places that the first statewide run dropped", () => {
    expect(cat(["NASA facility", "spaceport", "research institute"])).toBe("landmarks"); // Kennedy Space Center
    expect(cat(["steel roller coaster"])).toBe("theme-parks");
    expect(cat(["amusement ride"])).toBe("theme-parks");
    expect(cat(["airbase"])).toBe("military-installations");
    expect(cat(["coral reef"])).toBe("wetlands-ecosystems");
    expect(cat(["Rathaus"])).toBe("local-government");
    expect(cat(["motorsport racing track"])).toBe("stadiums-arenas");
  });

  it("maps the main kinds of notable places", () => {
    expect(cat(["resort", "theme park"])).toBe("theme-parks"); // Walt Disney World
    expect(cat(["art museum"])).toBe("museums");
    expect(cat(["business school"])).toBe("colleges");
    expect(cat(["high school"])).toBe("k12-schools");
    expect(cat(["business park"])).not.toBe("municipal-parks");
    expect(cat(["power station"])).toBe("utilities");
  });

  it("leaves unknown classes unmapped instead of guessing", () => {
    expect(cat(["mass shooting"])).toBeNull();
  });

  it("classifies brands from the tags of their mapped locations", () => {
    expect(brandCategory({ amenity: "fast_food" })).toEqual({ primary: "restaurant-chains", secondary: "fast-food" });
    expect(brandCategory({ amenity: "pharmacy" }).primary).toBe("retail-chains");
    expect(brandCategory({ tourism: "hotel" })).toEqual({ primary: "other-brands", secondary: "hotels-lodging" });
  });
});

describe("search tie-break", () => {
  it("prefers the better-known entry when scores are equal", () => {
    const hits: SearchHit[] = [
      { kind: "entity", slug: "walt-disney-world-airport", name: "Walt Disney World Airport", subtitle: "", score: 75, prominence: 2 },
      { kind: "entity", slug: "walt-disney-world-resort", name: "Walt Disney World Resort", subtitle: "", score: 75, prominence: 56 },
      { kind: "area", slug: "x", name: "A place", subtitle: "", score: 80 },
    ];
    expect([...hits].sort(byScore).map((h) => h.slug)).toEqual(["x", "walt-disney-world-resort", "walt-disney-world-airport"]);
  });
});
