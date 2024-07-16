/*
  Warnings:

  - You are about to drop the column `approved_at` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `is_approved` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "approved_at",
DROP COLUMN "is_approved";
