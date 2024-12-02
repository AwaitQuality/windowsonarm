-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "author_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "BlogPost_author_id_idx" ON "BlogPost"("author_id");

-- CreateIndex
CREATE INDEX "BlogPost_created_at_idx" ON "BlogPost"("created_at");
