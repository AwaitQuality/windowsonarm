-- Migration number: 0011
--
-- Integrity + privacy + index pass. Generated from
--   prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
-- and then hand-edited, because the generated script loses data in four places:
--
--   1. "Upvote"."post_id"/"user_id" become NOT NULL, but every existing row has a
--      NULL "post_id" (the SET NULL FK fired each time 0003/0009/0010 dropped
--      "Post"), so the INSERT..SELECT would abort.
--   2. "View"."ip_address" is replaced by "ip_hash" NOT NULL and the generated
--      INSERT..SELECT does not populate it at all.
--   3. New UNIQUE indexes on "Upvote" and "Review" need existing duplicates
--      removed first.
--   4. Dropping "Post" fires the ON DELETE actions of every child FK, so the
--      child rows are snapshotted before the rebuild and restored afterwards.
--      The restores are INSERT OR IGNORE so they are correct whether or not the
--      cascade actually fired.

-------------------------------------------------------------------------------
-- 1. Data cleanup, before any constraint is tightened.
-------------------------------------------------------------------------------

-- "Upvote" rows with no post (or no user) cannot satisfy the new NOT NULL
-- columns and carry no meaning: the post they referred to is unrecoverable.
DELETE FROM "Upvote" WHERE "post_id" IS NULL OR "user_id" IS NULL;

-- Collapse duplicate upvotes to the earliest one per (post, user).
DELETE FROM "Upvote"
WHERE "id" NOT IN (
    SELECT MIN("id") FROM "Upvote" GROUP BY "post_id", "user_id"
);

-- Collapse duplicate reviews to the most recently updated one per (post, user).
DELETE FROM "Review"
WHERE "rowid" IN (
    SELECT "rowid" FROM (
        SELECT "rowid",
               ROW_NUMBER() OVER (
                   PARTITION BY "post_id", "user_id"
                   ORDER BY "updated_at" DESC, "created_at" DESC, "rowid" DESC
               ) AS "rn"
        FROM "Review"
    )
    WHERE "rn" > 1
);

-- "effective_status" becomes NOT NULL: anything still unset inherits the
-- admin-set status, which is what recompute would have written.
UPDATE "Post" SET "effective_status" = "status" WHERE "effective_status" IS NULL;

-------------------------------------------------------------------------------
-- 2. Snapshot every table with an FK to "Post", because the rebuild below drops
--    "Post" and that fires their ON DELETE actions.
-------------------------------------------------------------------------------

CREATE TABLE "_mig0011_Upvote"     AS SELECT * FROM "Upvote";
CREATE TABLE "_mig0011_Review"     AS SELECT * FROM "Review";
CREATE TABLE "_mig0011_StatusVote" AS SELECT * FROM "StatusVote";
CREATE TABLE "_mig0011_View"       AS SELECT * FROM "View";
CREATE TABLE "_mig0011_PostToTag"  AS SELECT * FROM "_PostToTag";

-------------------------------------------------------------------------------
-- 3. RedefineTables
-------------------------------------------------------------------------------

-- DropIndex
DROP INDEX "Review_post_id_idx";

-- DropIndex
DROP INDEX "StatusVote_post_id_idx";

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "user_id" TEXT,
    "status" INTEGER NOT NULL,
    "status_hint" INTEGER,
    "effective_status" INTEGER NOT NULL,
    "community_voted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "app_url" TEXT,
    "community_url" TEXT,
    "banner_url" TEXT,
    "icon_url" TEXT,
    "discord_forum_post_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_description" TEXT,
    "upvotes_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_status_fkey" FOREIGN KEY ("status") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_effective_status_fkey" FOREIGN KEY ("effective_status") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("app_url", "banner_url", "categoryId", "community_url", "community_voted", "company", "created_at", "description", "discord_forum_post_id", "effective_status", "icon_url", "id", "status", "status_hint", "title", "update_description", "updated_at", "upvotes_count", "user_id", "views_count") SELECT "app_url", "banner_url", "categoryId", "community_url", "community_voted", "company", "created_at", "description", "discord_forum_post_id", "effective_status", "icon_url", "id", "status", "status_hint", "title", "update_description", "updated_at", "upvotes_count", "user_id", "views_count" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_status_idx" ON "Post"("status");
CREATE INDEX "Post_user_id_idx" ON "Post"("user_id");
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");
CREATE INDEX "Post_upvotes_count_idx" ON "Post"("upvotes_count");
CREATE INDEX "Post_views_count_idx" ON "Post"("views_count");
CREATE INDEX "Post_effective_status_upvotes_count_views_count_idx" ON "Post"("effective_status", "upvotes_count", "views_count");
CREATE INDEX "Post_categoryId_effective_status_idx" ON "Post"("categoryId", "effective_status");

CREATE TABLE "new_Upvote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    CONSTRAINT "Upvote_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Sourced from the snapshot rather than "Upvote": the "Post" rebuild above may
-- already have emptied the live table through the old SET NULL FK.
INSERT INTO "new_Upvote" ("id", "post_id", "user_id") SELECT "id", "post_id", "user_id" FROM "_mig0011_Upvote";
DROP TABLE "Upvote";
ALTER TABLE "new_Upvote" RENAME TO "Upvote";
CREATE INDEX "Upvote_user_id_idx" ON "Upvote"("user_id");
CREATE UNIQUE INDEX "Upvote_post_id_user_id_key" ON "Upvote"("post_id", "user_id");

CREATE TABLE "new_View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "View_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- The plaintext IPs are dropped rather than migrated: SQLite cannot compute the
-- keyed HMAC the application now writes. Each historic row keeps its place in
-- views_count under a unique, non-reversible placeholder; the only consequence
-- is that those visitors can be counted once more on their next visit.
INSERT INTO "new_View" ("id", "post_id", "ip_hash", "created_at")
SELECT "id", "post_id", 'legacy:' || lower(hex(randomblob(16))), "created_at"
FROM "_mig0011_View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
CREATE UNIQUE INDEX "View_post_id_ip_hash_key" ON "View"("post_id", "ip_hash");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BlogPost_published_created_at_idx" ON "BlogPost"("published", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Review_post_id_user_id_key" ON "Review"("post_id", "user_id");

-------------------------------------------------------------------------------
-- 4. Restore the tables that were not rebuilt above, in case the "Post" rebuild
--    cascaded them away. No-ops when the rows are still present.
-------------------------------------------------------------------------------

INSERT OR IGNORE INTO "Review"     SELECT * FROM "_mig0011_Review";
INSERT OR IGNORE INTO "StatusVote" SELECT * FROM "_mig0011_StatusVote";
INSERT OR IGNORE INTO "_PostToTag" SELECT * FROM "_mig0011_PostToTag";

DROP TABLE "_mig0011_Upvote";
DROP TABLE "_mig0011_Review";
DROP TABLE "_mig0011_StatusVote";
DROP TABLE "_mig0011_View";
DROP TABLE "_mig0011_PostToTag";

-------------------------------------------------------------------------------
-- 5. Re-derive the denormalised counters, which are now the single source of
--    truth for ordering and for the numbers rendered in the UI.
-------------------------------------------------------------------------------

UPDATE "Post" SET
    "upvotes_count" = (SELECT COUNT(*) FROM "Upvote" WHERE "Upvote"."post_id" = "Post"."id"),
    "views_count"   = (SELECT COUNT(*) FROM "View"   WHERE "View"."post_id"   = "Post"."id");
