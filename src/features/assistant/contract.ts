/**
 * America AI — interface boundary only (Phase 5). NOTHING here calls a model.
 *
 * The future assistant is a server-side, read-only, source-grounded helper that
 * knows the page context. These types pin down the contract so encyclopedia
 * pages can expose context now and the assistant can be added later without
 * touching the data layer. See docs/ROADMAP.md (Phase 5) and docs/DECISIONS.md.
 */
import type { DataProvider } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n";

/** Context derived on the server from validated route params — never from client text. */
export type PageContext = {
  pageType: "home" | "area" | "entity" | "topic" | "search" | "coverage" | "sources";
  entityId?: string;
  areaSlug?: string;
  categorySlug?: string;
  filters?: Record<string, string>;
  locale: Locale;
  scope: "page" | "region" | "america";
};

/** Narrow read-only tools, each a thin, bounded wrapper over DataProvider. */
export type AssistantTools = {
  get_entity: (slug: string) => ReturnType<DataProvider["getEntity"]>;
  search_entities: (q: string, opts: { areaSlug?: string; limit: number }) => ReturnType<DataProvider["search"]>;
  list_entities_by_geography: (areaSlug: string, opts: { categorySlug?: string; page: number }) => ReturnType<DataProvider["listEntities"]>;
  get_coverage: (areaSlug: string) => ReturnType<DataProvider["getCoverage"]>;
  get_sources: () => ReturnType<DataProvider["listSources"]>;
};

export type Citation = { sourceId: string; url: string; title: string; retrievedAt?: string };

export type AssistantAnswer = {
  text: string;
  citations: Citation[];
  relatedEntitySlugs: string[];
  /** True when the encyclopedia lacks evidence for (part of) the question. */
  insufficientEvidence: boolean;
};

export interface AssistantProvider {
  readonly name: string;
  answer(question: string, context: PageContext, tools: AssistantTools): Promise<AssistantAnswer>;
}

/** Explicitly disabled until a provider, budget caps and evaluations exist. */
export const assistantStatus = { enabled: false as const, reason: "No model provider is configured (by design in Phase 1; no paid API calls)." };
