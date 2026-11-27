/** Text helpers shared by search (fixture mode), slugs and ingestion. */

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return normalize(input).replace(/\s+/g, "-");
}

export function tokens(input: string): string[] {
  const n = normalize(input);
  return n ? n.split(" ") : [];
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US").format(value);
}
