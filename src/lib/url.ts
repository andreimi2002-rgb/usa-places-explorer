/** Build a shareable URL with only the non-empty query parameters. */
export function withQuery(path: string, params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "" && !(k === "page" && Number(v) === 1)) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}

/** Read a single string search param (Next passes string | string[] | undefined). */
export function param(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim().slice(0, 200) : undefined;
}

export function pageParam(sp: Record<string, string | string[] | undefined>): number {
  const n = Number(param(sp, "page") ?? 1);
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.trunc(n), 10_000) : 1;
}
