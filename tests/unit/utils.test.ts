import { describe, expect, it } from "vitest";
import { stableId, uuidV5 } from "@/lib/ids";
import { normalize, slugify, tokens } from "@/lib/text";
import { pageParam, param, withQuery } from "@/lib/url";
import { t } from "@/lib/i18n";
import { splitLine } from "../../scripts/ingest/lib";

describe("ids", () => {
  it("produces deterministic RFC 9562 v5 UUIDs", () => {
    const a = uuidV5("area:florida");
    expect(a).toBe(uuidV5("area:florida"));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(stableId("area", "florida")).not.toBe(stableId("entity", "florida"));
  });
});

describe("text", () => {
  it("normalizes accents, apostrophes and ampersands", () => {
    expect(normalize("Jacksonville Sheriff’s Office")).toBe("jacksonville sheriffs office");
    expect(normalize("Cummer Museum of Art & Gardens")).toBe("cummer museum of art and gardens");
    expect(slugify("Doña Ana County")).toBe("dona-ana-county");
    expect(tokens("  ")).toEqual([]);
  });
});

describe("url helpers", () => {
  it("builds shareable query strings without empty values or page 1", () => {
    expect(withQuery("/x", { q: "a b", topic: undefined, page: 1 })).toBe("/x?q=a+b");
    expect(withQuery("/x", { page: 3 })).toBe("/x?page=3");
    expect(param({ q: ["first", "second"] }, "q")).toBe("first");
    expect(pageParam({ page: "-4" })).toBe(1);
    expect(pageParam({ page: "abc" })).toBe(1);
  });
});

describe("csv parsing", () => {
  it("honors quoted fields containing delimiters", () => {
    expect(splitLine('162,"Islamorada, Village of Islands village",7124', ",")).toEqual(["162", "Islamorada, Village of Islands village", "7124"]);
  });
});

describe("i18n", () => {
  it("interpolates variables and falls back to English", () => {
    expect(t("search.results", { n: 3 }, "en")).toBe("3 results");
    expect(t("search.results", { n: 3 }, "ro")).toBe("3 rezultate");
  });
});
