-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "View_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "View_post_id_idx" ON "View"("post_id");

-- CreateIndex
CREATE INDEX "View_ip_address_idx" ON "View"("ip_address");

-- CreateIndex
CREATE UNIQUE INDEX "View_post_id_ip_address_key" ON "View"("post_id", "ip_address");