# America 360

A systematic, source-linked encyclopedia and atlas of the United States. Florida is the first active state; Jacksonville is the deep pilot. Personal, non-commercial project.

The project brief is [America360_Dev_Kit/MASTER_DEVELOPMENT_PROMPT.md](America360_Dev_Kit/MASTER_DEVELOPMENT_PROMPT.md). Progress log: [docs/PROGRESS.md](docs/PROGRESS.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind CSS 4 · Zod 4 · PostgreSQL 17 + PostGIS 3.5 (docker compose) · `pg` · d3-geo (server-rendered SVG maps) · Vitest · Playwright. ETL is TypeScript (see [docs/DECISIONS.md](docs/DECISIONS.md)).

## Quick start: fixture mode (no database, no secrets)

```bash
npm install
npm run build
npm run start          # http://localhost:3000
# or, for development with hot reload:
npm run dev
```

Fixture mode serves the committed, attributed seed snapshot in `seed/` from memory. The header shows **Fixture data**.

## Database mode (PostgreSQL + PostGIS)

Requires Docker Desktop to be running.

```bash
npm run db:up          # starts postgis/postgis:17-3.5 on 127.0.0.1:5433
npm run db:migrate     # applies supabase/migrations/*.sql, creates role a360_reader
npm run db:seed        # idempotent; a second run reports 0 changes
```

Then create `.env.local` (git-ignored):

```env
DATA_MODE=database
DATABASE_URL=postgres://a360_owner:a360_local_dev@127.0.0.1:5433/america360
DATABASE_READER_URL=postgres://a360_reader:a360_reader_local_dev@127.0.0.1:5433/america360
```

and run `npm run build && npm run start`. The header now shows **Database**. The site connects only as the read-only `a360_reader` role, so row-level security applies. If the database is down, pages show an error. The site never silently falls back to fixture data.

`npm run db:reset` drops and rebuilds the local schema. It refuses to run against a non-local host.

## Data pipeline

```bash
npm run ingest:census  # downloads Census files (checksummed) -> seed/generated/census-florida.json + geometry.json
npm run ingest:links   # checks official sites (robots.txt respected) -> seed/generated/link-checks.json
npm run db:seed        # loads the normalized dataset into PostgreSQL
```

Both ingest scripts accept `--dry-run` or `--refresh` where relevant. `ingest:links` also accepts `--only=<sourceId,...>`. Raw downloads go to `data/raw/`, which is git-ignored. Their checksums are kept in the seed.

## Checks

```bash
npm run lint
npm run typecheck
npm test                    # unit tests (fixture data)
npm run test:integration    # needs `npm run db:up`; uses a separate america360_test database
npm run build
npx playwright install chromium   # once
npm run test:e2e            # runs against the production build (`npm run build` first)
```

To run E2E in database mode, set `DATA_MODE=database` and `DATABASE_READER_URL=...` in the environment before `npm run test:e2e`.

## Layout

```text
src/app/                 routes: /, /places/[slug](/directory|/localities), /entities/[slug],
                         /topics(/[slug]), /search, /coverage, /sources, /api/search
src/components/          design system (ui.tsx), search box, SVG area map, header
src/lib/domain/          Zod schemas (single source of truth for records)
src/lib/data/            build.ts (normalize + evidence verification), fixture & Postgres providers
src/features/assistant/  America AI interface boundary only (disabled)
supabase/migrations/     versioned SQL schema, indexes, roles, RLS, views
scripts/ingest/          Census adapter, link/evidence checker
scripts/db/              migrate, seed, reset
seed/                    taxonomy, curated Jacksonville entities, generated Census snapshot
docs/                    roadmap, decisions, data sources, data dictionary, progress log
tests/                   unit/, integration/, e2e/
```

## Locale

UI strings are available in English and Romanian. Set `NEXT_PUBLIC_LOCALE=ro` and rebuild. Proper names and U.S. terminology are never translated.
