import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 moved schema/migration configuration out of schema.prisma.
 *
 * Migrations are NOT managed by `prisma migrate` here: D1 owns them. SQL files
 * live in `migrations/` and are applied with `wrangler d1 migrations apply`
 * (`pnpm db:migrate:local` / `pnpm db:migrate:remote`).
 *
 * Prisma 7 also dropped `migrate diff --from-local-d1`, so drift checks and new
 * migration SQL come from pointing the datasource at the local Miniflare SQLite
 * file — see the `db:drift` script, which sets DATABASE_URL for exactly that.
 *
 * The datasource is only attached when DATABASE_URL is actually set. `env()`
 * throws when it is missing, which broke `prisma generate` in CI: the variable
 * lives in .env locally, and .env is not committed. Generating the client does
 * not need a database at all.
 */
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
