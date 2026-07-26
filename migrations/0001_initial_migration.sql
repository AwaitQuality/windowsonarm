-- Migration number: 0001
--
-- Reconstructed baseline. The original file was lost (it survived on disk as a
-- single stray byte), so a fresh or preview D1 had no base tables to migrate and
-- 0003/0009/0010 -- which all rebuild "Post" -- could never replay.
--
-- This recreates the tables exactly as they stood before 0002, so that replaying
-- 0001..0011 in order on an empty database ends at the current schema. The
-- Category/Status/Tag/Upvote/_PostToTag definitions are the live ones (they were
-- never rebuilt by a later migration); "Post" is 0003's pre-image, i.e. 0003's
-- "new_Post" without "discord_forum_post_id".

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idx" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idx" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "icon" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idx" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_description" TEXT,
    CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_status_fkey" FOREIGN KEY ("status") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Upvote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT,
    "post_id" TEXT,
    CONSTRAINT "Upvote_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Status_name_key" ON "Status"("name");

-- CreateIndex
CREATE INDEX "Status_name_idx" ON "Status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "Post_user_id_idx" ON "Post"("user_id");

-- CreateIndex
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");

-- CreateIndex
CREATE INDEX "Upvote_user_id_idx" ON "Upvote"("user_id");

-- CreateIndex
CREATE INDEX "Upvote_post_id_idx" ON "Upvote"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "_PostToTag_AB_unique" ON "_PostToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");
