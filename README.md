# USA Places Explorer

**Discover Every Side of America.** An atlas of the kinds of places that make up the United States (place types, brands and real places), built on verified, sourced data.

- Stack: React + TypeScript + Vite, Tailwind CSS, React Router, Leaflet (OpenStreetMap)
- Data: local typed files in `src/data/`, verification log in `docs/VERIFICATION.md`
- Hosting: Netlify (every pull request gets a deploy preview)

## Development

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # TypeScript check
npm run validate   # data integrity checks (also runs before every build)
npm run build      # production build into dist/
npm run import:wikidata  # rebuild src/data/imported/listings.json from Wikidata
npm run import:region -- orlando  # in-depth import for a city area
npm run geo:locate       # Census locality and county for new places (cached)
```

Places come in two tiers: hand-written **full profiles** (`src/data/places/`) and **basic listings** imported from Wikidata (`src/data/imported/`). After a new import, check the new photos by eye and record the result in `src/data/imported/photo-review.ts`. Details are in `docs/VERIFICATION.md`.
