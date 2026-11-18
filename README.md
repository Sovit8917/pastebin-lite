# Pastebin Lite

A small Pastebin-style app: create a text paste, get a shareable link, and view it.
A paste can optionally expire after a time limit (TTL), after a number of views, or both.
Whichever limit is hit first makes the paste unavailable (HTTP 404).

Built with Next.js (App Router + Route Handlers), TypeScript, PostgreSQL, Prisma and Tailwind CSS.

## Run locally

Requirements: Node.js 20+ and a PostgreSQL database (Docker is the easiest way).

```bash
npm install
cp .env.example .env          # then edit values (see "Environment variables")
npm run db:up                 # starts Postgres via docker compose (optional)
npm run db:migrate            # applies prisma/migrations
npm run dev                   # development server on port 3000
```

Production-style run: `npm run build && npm start`.
`npm run build` generates the Prisma client, applies pending migrations
(`prisma migrate deploy`), then builds Next.js, so no manual migration or shell access is needed on deploy.

### Tests

```bash
npm test          # needs DATABASE_URL / DIRECT_URL in .env pointing at a Postgres database
npm run typecheck
```

The suite runs the route handlers against a real database and covers creation, validation, retrieval,
view limits, TTL (via `x-test-now-ms`), combined constraints, no view consumed on failures,
concurrent requests, and HTML escaping.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Runtime Postgres connection string (pooled is fine). |
| `DIRECT_URL` | yes | Direct connection used by `prisma migrate deploy`. Same value as `DATABASE_URL` if you have no separate pooled URL. |
| `APP_URL` | no | Canonical public origin for share links. Derived from the request when unset. |
| `TEST_MODE` | no | `1` makes the `x-test-now-ms` header the "current time" for expiry logic only. |
| `POSTGRES_PASSWORD` | local only | Used by `docker-compose.yml`. |

No secrets are committed; `.env` is git-ignored.

## Deploy on Vercel

1. Create a Postgres database (Vercel Postgres/Neon, Supabase, etc.).
2. Import the repository in Vercel and set `DATABASE_URL` and `DIRECT_URL` (and `TEST_MODE=1` if the grader needs it).
3. Deploy. The build applies migrations automatically.

## API

| Route | Description |
| --- | --- |
| `GET /api/healthz` | `200 {"ok":true}` when the database answers `SELECT 1`; `503 {"ok":false}` if it does not. |
| `POST /api/pastes` | Body `{content, ttl_seconds?, max_views?}`. `201 {id, url}`; invalid input gives `400` (or `413` above 512 KB) with `{error, field?}`. |
| `GET /api/pastes/:id` | `200 {content, remaining_views, expires_at}` (nulls when unlimited). Counts as one view. Missing, expired or exhausted gives `404` JSON. |
| `GET /p/:id` | HTML view of the paste, or `404`. |

## Persistence layer

PostgreSQL through Prisma, using the `@prisma/adapter-pg` driver adapter (Prisma's `client` engine).
A single `pastes` table holds `id` (primary key), `content`, `created_at`, `expires_at`, `max_views` and `view_count`.
Nothing is stored in process memory, so it works across serverless invocations.

## Design decisions

- **Atomic view counting.** One conditional `UPDATE ... WHERE (not expired) AND (view_count < max_views) RETURNING ...`
  both checks availability and increments the counter. Concurrent requests cannot exceed `max_views`,
  `remaining_views` is never negative, and requests that fail (missing, expired, exhausted) never consume a view.
- **One code path for API and HTML.** `GET /api/pastes/:id` and `GET /p/:id` both call the same function,
  so every successful view of either kind counts as exactly one view. Opening the share link yourself counts too.
- **Deterministic time.** With `TEST_MODE=1`, `x-test-now-ms` replaces the clock for expiry checks and for
  computing `expires_at` at creation time; without it the real clock is used. A paste is expired when `now >= expires_at`.
- **Safe rendering.** Content is rendered as a React text node inside `<pre>`, so it is HTML-escaped and never executed.
  Responses also send `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy`.
- **Validation.** `content` must be a non-blank string (max 512 KB); `ttl_seconds` and `max_views` must be integers >= 1
  when present (`null` and strings are rejected). Bad JSON returns 400.
- **IDs.** 12 URL-safe characters from `crypto.randomBytes`, with retry on the unlikely collision.
- **Health check.** Returns 503 with `{"ok":false}` when the database cannot be reached, so monitors see the failure.
- **No global state.** Only the Prisma client handle is cached (to avoid extra connections in dev); no paste data is.
