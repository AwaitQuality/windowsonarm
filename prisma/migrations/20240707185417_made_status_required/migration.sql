/*
  Warnings:

  - Made the column `status` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
INSERT INTO "Status" ("id", "name", "color", "text", "icon") VALUES (-1, 'Testing...', '#f59e0b', 'App is being tested', 'OpenRegular');

UPDATE "Post" SET "status" = -1 WHERE "status" IS NULL;

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_status_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "status" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_status_fkey" FOREIGN KEY ("status") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
