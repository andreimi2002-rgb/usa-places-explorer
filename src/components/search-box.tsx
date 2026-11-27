"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchHit } from "@/lib/data/types";

function hrefFor(h: SearchHit) {
  return h.kind === "entity" ? `/entities/${h.slug}` : h.kind === "area" ? `/places/${h.slug}` : `/topics/${h.slug}`;
}

/**
 * Accessible autocomplete (WAI-ARIA combobox pattern). Works without JS as a
 * plain GET form to /search; with JS it suggests results from /api/search.
 */
export function SearchBox({ placeholder, label, submitLabel }: { placeholder: string; label: string; submitLabel: string }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=8`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { hits: SearchHit[] };
        setHits(data.hits);
        setActive(-1);
        setOpen(true);
      } catch {
        /* aborted or offline: keep the plain form working */
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const visible = open && q.trim().length >= 2 && hits.length > 0;

  return (
    <form
      ref={boxRef}
      role="search"
      action="/search"
      className="relative w-full min-w-0"
      onSubmit={(e) => {
        if (visible && active >= 0 && hits[active]) {
          e.preventDefault();
          setOpen(false);
          router.push(hrefFor(hits[active]));
        }
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        {label}
      </label>
      <input
        id={`${listId}-input`}
        name="q"
        type="search"
        autoComplete="off"
        value={q}
        placeholder={placeholder}
        className="field pr-10"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && active >= 0 ? `${listId}-opt-${active}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          if (e.target.value.trim().length < 2) setHits([]);
        }}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!visible) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      <button type="submit" className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-gold" aria-label={submitLabel}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      <ul
        id={listId}
        role="listbox"
        aria-label={label}
        hidden={!visible}
        className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-auto rounded-lg border border-line-strong bg-navy-900 py-1 shadow-2xl"
      >
        {hits.map((h, i) => (
          <li
            key={`${h.kind}-${h.slug}`}
            id={`${listId}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-navy-700" : "hover:bg-navy-800"}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(false);
              router.push(hrefFor(h));
            }}
          >
            <span className="block text-ink">{h.name}</span>
            <span className="block text-xs text-muted">
              {h.kind === "entity" ? "Entry" : h.kind === "area" ? "Place" : "Topic"} · {h.subtitle}
            </span>
          </li>
        ))}
      </ul>
    </form>
  );
}
