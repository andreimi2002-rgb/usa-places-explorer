# American Sports Encyclopedia

An interconnected encyclopedia of US pro sports, written for Europeans. Static Astro site on Netlify.

- Plan: [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)
- Team page spec and schema: [docs/TEAM_PAGE_TEMPLATE.md](docs/TEAM_PAGE_TEMPLATE.md)
- What needs review: [docs/REVIEW_REPORT.md](docs/REVIEW_REPORT.md) and the `/status` page

## Run it

Requires Node 22.

```sh
npm install
npm run dev       # http://localhost:4321, live reload (search is not available in dev)
npm run build     # type/data check + static build + Pagefind search index, into dist/
npm run preview   # serve dist/ locally, with search
```

`npm run build` fails on any invalid data: a missing field, a broken reference, a bad URL or date.

On Windows, run the build from PowerShell or cmd. Some sandboxed shells cannot read newly written `dist/`
files, which breaks Pagefind.

## Where things live

| Path | What |
|---|---|
| `src/content.config.ts` | All collection schemas (Zod) |
| `src/data/<collection>/<id>.json` | Structured facts with sources |
| `src/content/prose/<collection>/<id>/<section>.mdx` | Written text; use `<Term id="…">` for glossary links |
| `src/assets/logos/<league>/<id>.svg` | Temporary logo artwork, referenced from `franchise.logo` |
| `src/lib/graph.ts` | Connection graph, built from the data relations |
| `src/site.config.ts` | Site name, European time zones, disclaimer, **`indexable` switch** |
| `src/pages/status.astro` | Internal progress and review page (noindex) |

## Search engines

The site is `noindex, nofollow` while `indexable: false` in `src/site.config.ts`. That one switch controls
the meta tag, the `X-Robots-Tag` header and `robots.txt`.

## Adding a fact

Every key fact is `{ "value": …, "source": "https://…", "verified": "YYYY-MM-DD" }`. If it cannot be confirmed,
set `"verified": null`: it is kept but not displayed, and shows up on `/status`.

## Previous project

The old USA Places Explorer code is preserved at the tag and branch `archive/previous-project`.
