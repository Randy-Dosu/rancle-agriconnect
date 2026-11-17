# AgriConnect

A platform that connects farmers to processing companies and export agencies — built for Ghana.

Farmers publish what they have harvested; processors and exporters publish what they need to buy.
AgriConnect scores the pairings by crop, grade, quantity fit, region and price headroom, then tracks
each deal from inquiry to completion, always priced in Ghana cedis (GHS) per kilogram.

```
Farmer listing  ──┐
                  ├──►  ranked match  ──►  inquiry  ──►  accepted  ──►  completed
Buyer demand    ──┘
```

## What's included

| Area | Details |
| --- | --- |
| Marketplace | Public, filterable listing board (crop, region, grade, price, search, sort, pagination) |
| Buyer demand | Public board of open sourcing requests with per-request ranked farmer matches |
| Accounts | Email + password auth for **farmers**, **processors** and **exporters** (scrypt hashing, JWT sessions) |
| Farmer workspace | Publish/edit/archive listings, see matched demand with fit scores, accept or decline offers |
| Buyer workspace | Publish sourcing requests, see ranked supplier candidates, track committed volume and value |
| Deal trail | Inquiry lifecycle `pending → accepted → completed` (or `declined`), with contact details revealed on acceptance |
| Demo data | 9 Ghanaian accounts, 10 listings, 6 sourcing requests and 6 inquiries at mixed stages |

All 16 Ghanaian regions, 12 crops (cocoa, cashew, shea nut, maize, soya bean, rice paddy, cassava,
yam, tomato, onion, oil palm fruit, groundnut) and grades A–C ship as shared reference data used by
both the API validators and the UI.

## Quick start

Requires **Node.js 22.5+** (the API uses the built-in `node:sqlite`, so there is no native build step).

```bash
npm install
npm run dev
```

- Web app: <http://localhost:5173>
- API: <http://localhost:4000> (`/api/health`)

The first boot seeds the demo dataset into `server/data/agriconnect.db`.

### Demo accounts

Password for every seeded account: **`AgriConnect123`**

| Role | Email |
| --- | --- |
| Farmer | `ama.mensah@agriconnect.gh` |
| Farmer | `kwame.owusu@agriconnect.gh` |
| Processor | `purchasing@goldenharvest.gh` |
| Exporter | `sourcing@atlanticcocoa.gh` |

The sign-in page has one-click buttons that fill these in.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | API + Vite dev server together (single preview) |
| `npm run build` | Build the React app into `web/dist` |
| `npm start` | Serve the built app and the API from `web/dist` on port 4000 |
| `npm test` | API integration tests + UI render smoke tests |
| `npm run seed` | Seed the database (`npm --workspace server run seed -- --force` to reset) |
| `npm run ci` | Full pipeline: install → test → build → production smoke test |

## Architecture

```
server/            Express API (ESM, no TypeScript build step)
  src/app.js       App wiring: security headers, CORS, throttling, auth, error handling
  src/db.js        Schema + node:sqlite connection (WAL, foreign keys)
  src/store.js     All SQL — users, listings, demand requests, inquiries, matching
  src/auth.js      scrypt passwords + HS256 JWT (no external crypto deps)
  src/validate.js  Shared request validation returning field-level errors
  src/seed.js      Ghana-shaped demo dataset
  src/routes/      auth · listings · requests · inquiries · dashboard
  test/            node:test integration tests against an in-memory database
web/               React 18 + Vite SPA
  src/api.js       Typed-ish fetch client with field-error extraction
  src/auth.jsx     Session context (token in localStorage, /auth/me hydration)
  src/pages/       Landing · Marketplace · ListingDetail · Demand · DemandDetail · Dashboard · auth
scripts/dev.mjs    Runs both processes with prefixed logs
```

`web/vite.config.js` proxies `/api` to the backend, so the browser only ever talks to its own origin.

### Matching model

Scores are intentionally explainable rather than clever:

- volume fit — 40 points if the listing covers the request, 20 if a split delivery is needed
- price headroom — up to 30 points, proportional to how far the farm-gate price sits under the buyer's cap
- region — 20 points on a register match (or 25 in the buyer-side view)
- grade — 10 points for an exact grade match

### API

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Liveness probe |
| `GET` | `/api/meta` | — | Crops, regions, grades, roles, currency |
| `POST` | `/api/auth/register` | — | Creates farmer / processor / exporter |
| `POST` | `/api/auth/login` | — | Returns `{ token, user }` |
| `GET` | `/api/auth/me` | bearer | Current session user |
| `GET` | `/api/listings` | — | Filters: `crop`, `region`, `grade`, `search`, `sort`, `max_price`, `min_quantity`, `farmer_id`, `status`, `page`, `limit` |
| `GET` | `/api/listings/:id` | — | Single lot with seller details |
| `POST/PATCH/DELETE` | `/api/listings[/:id]` | farmer | Owner-scoped |
| `GET` | `/api/requests` | — | Filters: `crop`, `region`, `search`, `buyer_id`, `status`, `page`, `limit` |
| `GET` | `/api/requests/:id` | — | Includes ranked `matches` |
| `POST/PATCH/DELETE` | `/api/requests[/:id]` | processor · exporter | Owner-scoped |
| `GET` | `/api/inquiries` | bearer | Scoped to the signed-in side of each deal |
| `POST` | `/api/inquiries` | bearer | Offer on a `listing_id`, or respond to a `request_id` |
| `PATCH` | `/api/inquiries/:id` | bearer | Farmers accept/decline; buyers complete |
| `GET` | `/api/dashboard` | bearer | Role-aware stats, matches and recent activity |

Validation failures return `400` with `{ error, details: [{ field, message }] }`, which the UI maps
directly onto form fields.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `HOST` | `0.0.0.0` | Bind address |
| `DB_PATH` | `server/data/agriconnect.db` | SQLite file |
| `JWT_SECRET` | dev placeholder | **Set this in production** |
| `TOKEN_TTL_SECONDS` | `604800` | Session lifetime |
| `SEED_ON_BOOT` | `true` | Seed demo data when the database is empty |
| `API_TARGET` | `http://127.0.0.1:4000` | Vite dev proxy target |

> `node:sqlite` is marked experimental in Node 22, so the scripts silence that one warning.
> Swap in `better-sqlite3` or Postgres by replacing `server/src/db.js` and `store.js` if you need it.

## Deploying

### Single process (any Node host)

```bash
npm ci
npm run build
JWT_SECRET=… SEED_ON_BOOT=false npm start
```

`npm start` serves the built SPA and the API from the same origin.

### Vercel

`vercel.json` builds `web/dist` and mounts the Express app at `/api/*`:

```bash
vercel --prod
```

Set `JWT_SECRET` (and `SEED_ON_BOOT` if you want the demo data) in the Vercel project settings.
Note that serverless filesystems are ephemeral — point `DB_PATH` at a persistent volume, or move
`db.js`/`store.js` to a hosted Postgres instance, before relying on real data in production.

## Tests

```bash
npm test
```

- `server/test/*.test.js` — 23 integration tests: auth, validation, ownership rules, filtering,
  matching scores and the full inquiry lifecycle (each suite boots the real app on an ephemeral port
  against an in-memory database).
- `web/test/render.test.mjs` — 9 render tests that load the real components through Vite's SSR
  loader and assert each page renders its content.

### Continuous integration

`npm run ci` (`scripts/ci.sh`) is the whole pipeline in one command: clean install, both test
suites, a production build and a live smoke test of the running server. Point any CI provider at it.
To use GitHub Actions, add `.github/workflows/ci.yml` yourself — the workflow file has to be pushed
with a token that has `workflows` permission:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci --no-audit --no-fund
      - run: npm run ci
```

## Roadmap

- SMS / USSD channel for farmers without smartphones
- Logistics and haulage partners per region
- Quality-test attachments (moisture, aflatoxin, out-turn) on listings
- Aggregated price index per crop, region and month
- Multi-currency settlement for cross-border exports
