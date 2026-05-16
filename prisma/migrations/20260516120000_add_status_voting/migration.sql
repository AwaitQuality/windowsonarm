-- AlterTable: add effective_status_id and community_voted columns to Post
ALTER TABLE "Post" ADD COLUMN "effective_status" INTEGER;
ALTER TABLE "Post" ADD COLUMN "community_voted" BOOLEAN NOT NULL DEFAULT false;

-- Initialise effective_status to match the existing status_id for all rows
UPDATE "Post" SET "effective_status" = "status";

-- Index for filtering by effective status
CREATE INDEX "Post_effective_status_idx" ON "Post"("effective_status");

-- AddForeignKey: link Post.effective_status -> Status.id
ALTER TABLE "Post" ADD CONSTRAINT "Post_effective_status_fkey"
    FOREIGN KEY ("effective_status") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: StatusVote
CREATE TABLE "StatusVote" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "status_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusVote_pkey" PRIMARY KEY ("id")
);

-- Indexes for StatusVote
CREATE UNIQUE INDEX "StatusVote_user_id_post_id_key" ON "StatusVote"("user_id", "post_id");
CREATE INDEX "StatusVote_post_id_idx" ON "StatusVote"("post_id");
CREATE INDEX "StatusVote_user_id_idx" ON "StatusVote"("user_id");
CREATE INDEX "StatusVote_status_id_idx" ON "StatusVote"("status_id");

-- Foreign keys for StatusVote
ALTER TABLE "StatusVote" ADD CONSTRAINT "StatusVote_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatusVote" ADD CONSTRAINT "StatusVote_status_id_fkey"
    FOREIGN KEY ("status_id") REFERENCES "Status"("id") ON DELETE CASCADE ON UPDATE CASCADE;
