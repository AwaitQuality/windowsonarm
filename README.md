# Windows ARM Software Compatibility List

A community-maintained list of software that runs on Windows on ARM. The list is
not exhaustive — it is a starting point for finding software that works on ARM
devices. To add something, [submit it on the site](https://windowsonarm.org) or
open a GitHub issue.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Hosting | Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| Database | Cloudflare D1 (SQLite) through Prisma 7 with the D1 driver adapter |
| Auth | Clerk |
| File storage | Cloudflare R2 (presigned uploads) |
| UI | Fluent UI v9, Tailwind CSS |
| Data fetching | TanStack Query v5 |

## Admin API

Every admin action is also reachable over HTTP with a scoped API key. Admins
create and revoke keys from their account menu → **API keys**. See
[`docs/api.md`](docs/api.md) for endpoints, scopes and examples.

## Prerequisites

- Node.js 20.19+ (Prisma 7 minimum)
- pnpm — the version is pinned via `packageManager`; run `corepack enable`
- A Cloudflare account with access to the `windows-on-arm` D1 database
- A Clerk application (publishable + secret key)

## Setup

```bash
pnpm install
```

Create `.dev.vars` in the repo root for local Worker bindings and secrets. It is
gitignored, and both `next dev` and `wrangler` read it:

```ini
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://...

DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
DISCORD_FORUM_CHANNEL_ID=...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Keys the visitor-IP hash used to dedupe post views. Without it, view
# tracking is skipped rather than storing an unkeyed hash.
VIEW_IP_HASH_SECRET=<random 32+ bytes, e.g. openssl rand -hex 32>
```

For production, set it as a Worker secret rather than a var:

```bash
wrangler secret put VIEW_IP_HASH_SECRET
```

Non-secret bindings (the D1 database, compatibility flags, static assets) live in
`wrangler.toml`. After changing them, regenerate the binding types:

```bash
pnpm cf-typegen     # rewrites env.d.ts
```

## Local development

```bash
pnpm db:migrate:local   # apply migrations/*.sql to the local D1 (first run)
pnpm dev                # next dev with Turbopack, D1 bindings wired in
```

`pnpm dev` serves on http://localhost:3000. Cloudflare bindings are available
because `next.config.mjs` calls `initOpenNextCloudflareForDev()`.

To exercise the app the way it actually runs in production — inside `workerd`,
from the real Worker bundle — use the preview instead:

```bash
pnpm preview            # builds the Worker and serves it on :8787
```

## Database and migrations

Migrations are **plain SQL files in `migrations/`, owned by D1 and applied by
Wrangler**. Prisma provides the client and generates migration SQL; it never runs
the migrations.

```bash
pnpm db:migrate:local    # apply pending migrations to the local D1
pnpm db:migrate:remote   # apply them to the production D1 (destructive; back up first)
pnpm db:drift            # diff the local D1 against prisma/schema.prisma
```

Workflow for a schema change:

1. Edit `prisma/schema.prisma`.
2. Run `pnpm db:drift` — it prints the SQL needed to reach the new schema.
3. Save that SQL as the next numbered file, e.g. `migrations/0012_add_thing.sql`.
   Rebuilding a table on SQLite must copy rows across with `INSERT ... SELECT` —
   see `0009`/`0010` for the pattern.
4. Run `pnpm db:migrate:local`, then `pnpm db:drift` again — it must report an
   empty migration.
5. Run `npx prisma generate` if the client needs regenerating. The generated
   client lives in `lib/generated/prisma` and is gitignored.

Notes:

- Prisma 7 removed `migrate diff --from-local-d1`; `db:drift` points the
  datasource at the local Miniflare SQLite file instead.
- The generator sets `runtime = "cloudflare"`, which is **required** — `workerd`
  forbids runtime Wasm compilation and the client crashes on startup without it.
- D1 does not support interactive transactions. Use the array form:
  `prisma.$transaction([...])`.

## Deploying

```bash
pnpm cf:build   # build the Worker artifact into .open-next/
pnpm deploy     # build and deploy to Cloudflare Workers
```

`NEXT_PUBLIC_*` variables are inlined into the client bundle at build time, so a
Worker secret cannot supply them. `.env.production` therefore holds the
production Clerk **publishable** key — it is public by design and already
visible in the shipped bundle. Without that file the build picks up the
`pk_test_` key from `.env`/`.dev.vars` and every real user is signed out.

Everything genuinely secret is a Worker secret instead:

```bash
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_PUBLIC_URL
npx wrangler secret put DISCORD_BOT_TOKEN
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler secret put DISCORD_FORUM_CHANNEL_ID
npx wrangler secret put VIEW_IP_HASH_SECRET
```

`middleware.ts` is intentionally **not** renamed to Next 16's `proxy.ts`: a proxy
always runs on the Node.js runtime and OpenNext rejects Node.js middleware. See
the comment at the top of that file.

## Other commands

```bash
pnpm build      # next build (Turbopack)
pnpm lint       # eslint
pnpm start      # serve the plain Next build, not the Worker
```
