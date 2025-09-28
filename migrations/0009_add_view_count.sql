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
    CONSTRAINT "Post_status_fkey" FOREIGN KEY ("status") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("app_url", "banner_url", "categoryId", "community_url", "company", "created_at", "description", "discord_forum_post_id", "icon_url", "id", "status", "status_hint", "title", "update_description", "updated_at", "user_id") SELECT "app_url", "banner_url", "categoryId", "community_url", "company", "created_at", "description", "discord_forum_post_id", "icon_url", "id", "status", "status_hint", "title", "update_description", "updated_at", "user_id" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");
CREATE INDEX "Post_status_idx" ON "Post"("status");
CREATE INDEX "Post_user_id_idx" ON "Post"("user_id");
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");
CREATE INDEX "Post_upvotes_count_idx" ON "Post"("upvotes_count");
CREATE INDEX "Post_views_count_idx" ON "Post"("views_count");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
