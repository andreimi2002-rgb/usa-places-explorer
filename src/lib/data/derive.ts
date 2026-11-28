import type { AreaRow, CategoryRow, Dataset, EntityRow } from "./dataset";
import type { CategoryRef, Crumb } from "./types";

/** In-memory indexes over a Dataset. Used by fixture mode and by the seeder (search text). */
export class DatasetIndex {
  readonly areaById = new Map<string, AreaRow>();
  readonly areaBySlug = new Map<string, AreaRow>();
  readonly areaChildren = new Map<string, AreaRow[]>();
  readonly categoryById = new Map<string, CategoryRow>();
  readonly categoryBySlug = new Map<string, CategoryRow>();
  readonly categoryChildren = new Map<string, CategoryRow[]>();
  readonly entityById = new Map<string, EntityRow>();
  readonly entityBySlug = new Map<string, EntityRow>();
  private readonly descendantAreaCache = new Map<string, Set<string>>();
  private readonly descendantCategoryCache = new Map<string, Set<string>>();
  readonly populationByArea = new Map<string, number>();
  /** Per-entity indexes so lookups stay O(1) at state scale. */
  readonly categoriesByEntity = new Map<string, Dataset["entityCategories"]>();
  readonly areasByEntity = new Map<string, Dataset["entityAreas"]>();
  readonly factsByEntity = new Map<string, Dataset["facts"]>();
  readonly mediaByEntity = new Map<string, Dataset["media"]>();
  readonly relationsByEntity = new Map<string, Dataset["entityRelations"]>();

  constructor(readonly ds: Dataset) {
    for (const a of ds.areas) {
      this.areaById.set(a.id, a);
      this.areaBySlug.set(a.slug, a);
      if (a.parentId) push(this.areaChildren, a.parentId, a);
    }
    for (const c of ds.categories) {
      this.categoryById.set(c.id, c);
      this.categoryBySlug.set(c.slug, c);
      if (c.parentId) push(this.categoryChildren, c.parentId, c);
    }
    for (const e of ds.entities) {
      this.entityById.set(e.id, e);
      this.entityBySlug.set(e.slug, e);
    }
    for (const f of ds.facts) if (f.areaId && f.key === "population-estimate" && f.valueNum !== null) this.populationByArea.set(f.areaId, f.valueNum);
    for (const ec of ds.entityCategories) push(this.categoriesByEntity, ec.entityId, ec);
    for (const ea of ds.entityAreas) push(this.areasByEntity, ea.entityId, ea);
    for (const fa of ds.facts) if (fa.entityId) push(this.factsByEntity, fa.entityId, fa);
    for (const m of ds.media) if (m.entityId) push(this.mediaByEntity, m.entityId, m);
    for (const r of ds.entityRelations) {
      push(this.relationsByEntity, r.fromEntityId, r);
      if (r.toEntityId !== r.fromEntityId) push(this.relationsByEntity, r.toEntityId, r);
    }
  }

  areaAncestors(area: AreaRow): AreaRow[] {
    const out: AreaRow[] = [];
    let cur = area.parentId ? this.areaById.get(area.parentId) : undefined;
    const guard = new Set<string>();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      out.unshift(cur);
      cur = cur.parentId ? this.areaById.get(cur.parentId) : undefined;
    }
    return out;
  }

  crumbs(area: AreaRow, includeSelf = false): Crumb[] {
    const chain = [...this.areaAncestors(area), ...(includeSelf ? [area] : [])];
    return chain.map((a) => ({ slug: a.slug, name: a.name, areaType: a.areaType }));
  }

  /** Area id plus every descendant (by primary parent). */
  descendantAreaIds(areaId: string): Set<string> {
    const cached = this.descendantAreaCache.get(areaId);
    if (cached) return cached;
    const out = new Set<string>([areaId]);
    const stack = [areaId];
    while (stack.length) {
      const id = stack.pop()!;
      for (const c of this.areaChildren.get(id) ?? []) {
        if (!out.has(c.id)) {
          out.add(c.id);
          stack.push(c.id);
        }
      }
    }
    this.descendantAreaCache.set(areaId, out);
    return out;
  }

  descendantCategoryIds(categoryId: string): Set<string> {
    const cached = this.descendantCategoryCache.get(categoryId);
    if (cached) return cached;
    const out = new Set<string>([categoryId]);
    const stack = [categoryId];
    while (stack.length) {
      const id = stack.pop()!;
      for (const c of this.categoryChildren.get(id) ?? []) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
    this.descendantCategoryCache.set(categoryId, out);
    return out;
  }

  categoryPath(cat: CategoryRow): CategoryRow[] {
    const out: CategoryRow[] = [cat];
    let cur = cat.parentId ? this.categoryById.get(cat.parentId) : undefined;
    while (cur) {
      out.unshift(cur);
      cur = cur.parentId ? this.categoryById.get(cur.parentId) : undefined;
    }
    return out;
  }

  domainOf(cat: CategoryRow): CategoryRow {
    return this.categoryPath(cat)[0]!;
  }
}

export function categoryRef(c: CategoryRow): CategoryRef {
  return { slug: c.slug, name: c.name, nameRo: c.nameRo, domainNumber: c.domainNumber };
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}

/** Search document text for an entity — identical in fixture and database mode. */
export function entitySearchText(idx: DatasetIndex, e: EntityRow): string {
  const cats = (idx.categoriesByEntity.get(e.id) ?? [])
    .flatMap((ec) => idx.categoryPath(idx.categoryById.get(ec.categoryId)!).map((c) => c.name));
  const areas = (idx.areasByEntity.get(e.id) ?? []).map((ea) => idx.areaById.get(ea.areaId)!.name);
  return [e.name, ...e.aliases, e.shortDescription ?? "", e.entityType.replace(/_/g, " "), ...new Set(cats), ...new Set(areas)].join(" | ");
}

export function areaSearchText(idx: DatasetIndex, a: AreaRow): string {
  const parent = a.parentId ? idx.areaById.get(a.parentId)?.name : undefined;
  return [a.name, a.officialName ?? "", ...a.aliases, a.typeLabel ?? "", parent ?? ""].join(" | ");
}
