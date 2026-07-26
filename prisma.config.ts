import "dotenv/config";
import { defineConfig, env } from "prisma/config";

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
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
