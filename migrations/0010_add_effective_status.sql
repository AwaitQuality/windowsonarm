-- Migration number: 0010 	 2026-07-26T06:28:35.842Z
-- Generated with: prisma migrate diff --from-local-d1 --to-schema-datamodel ./prisma/schema.prisma --script

-- Rebuilding "Post" means DROP TABLE "Post", which fires ON DELETE CASCADE on
-- every child table (View, Review, StatusVote, Upvote, _PostToTag). On D1 the
-- PRAGMAs below do not reliably suppress that, so the child rows are snapshotted
-- first and restored afterwards. This was found the hard way: the original
-- version of this migration emptied 331k View rows plus every review, status
-- vote and post/tag link on production, because the database it was verified
-- against happened to have those tables empty.

CREATE TABLE "_mig0010_Upvote"     AS SELECT * FROM "Upvote";
CREATE TABLE "_mig0010_Review"     AS SELECT * FROM "Review";
CREATE TABLE "_mig0010_StatusVote" AS SELECT * FROM "StatusVote";
CREATE TABLE "_mig0010_View"       AS SELECT * FROM "View";
CREATE TABLE "_mig0010_PostToTag"  AS SELECT * FROM "_PostToTag";

-- RedefineTables
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
    "effective_status" INTEGER,
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
    CONSTRAINT "Post_effective_status_fkey" FOREIGN KEY ("effective_status") REFERENCES "Status" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("app_url", "banner_url", "categoryId", "community_url", "company", "created_at", "description", "discord_forum_post_id", "icon_url", "id", "status", "status_hint", "title", "update_description", "updated_at", "upvotes_count", "user_id", "views_count") SELECT "app_url", "banner_url", "categoryId", "community_url", "company", "created_at", "description", "discord_forum_post_id", "icon_url", "id", "status", "status_hint", "title", "update_description", "updated_at", "upvotes_count", "user_id", "views_count" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");
CREATE INDEX "Post_status_idx" ON "Post"("status");
CREATE INDEX "Post_effective_status_idx" ON "Post"("effective_status");
CREATE INDEX "Post_user_id_idx" ON "Post"("user_id");
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");
CREATE INDEX "Post_upvotes_count_idx" ON "Post"("upvotes_count");
CREATE INDEX "Post_views_count_idx" ON "Post"("views_count");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Restore anything the cascade took. INSERT OR IGNORE so this is a no-op when
-- the rows survived.
INSERT OR IGNORE INTO "Upvote"     SELECT * FROM "_mig0010_Upvote";
INSERT OR IGNORE INTO "Review"     SELECT * FROM "_mig0010_Review";
INSERT OR IGNORE INTO "StatusVote" SELECT * FROM "_mig0010_StatusVote";
INSERT OR IGNORE INTO "View"       SELECT * FROM "_mig0010_View";
INSERT OR IGNORE INTO "_PostToTag" SELECT * FROM "_mig0010_PostToTag";

DROP TABLE "_mig0010_Upvote";
DROP TABLE "_mig0010_Review";
DROP TABLE "_mig0010_StatusVote";
DROP TABLE "_mig0010_View";
DROP TABLE "_mig0010_PostToTag";

-- Backfill: existing posts inherit their admin-set status as the effective status.
UPDATE "Post" SET "effective_status" = "status";
