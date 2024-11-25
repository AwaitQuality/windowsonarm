-- CreateTable
CREATE TABLE "StatusVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusVote_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StatusVote_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StatusVote_post_id_idx" ON "StatusVote"("post_id");

-- CreateIndex
CREATE INDEX "StatusVote_user_id_idx" ON "StatusVote"("user_id");

-- CreateIndex
CREATE INDEX "StatusVote_status_id_idx" ON "StatusVote"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "StatusVote_post_id_user_id_key" ON "StatusVote"("post_id", "user_id");
