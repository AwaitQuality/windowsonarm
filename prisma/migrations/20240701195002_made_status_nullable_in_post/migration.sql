-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_status_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "status" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_status_fkey" FOREIGN KEY ("status") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
