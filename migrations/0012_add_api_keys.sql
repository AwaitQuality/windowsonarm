-- Migration number: 0012
--
-- API keys: admin-issued bearer credentials for the public API.
--
-- Only the SHA-256 digest of a token is persisted; the token is returned once,
-- at creation, and is unrecoverable afterwards. "prefix" is the non-secret half
-- and carries the UNIQUE index the auth path looks the row up by.

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "last_used_at" DATETIME,
    "expires_at" DATETIME,
    "revoked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ApiKey_user_id_idx" ON "ApiKey"("user_id");

-- CreateIndex
-- Backs the "my active keys" listing, which is the only multi-row read path.
CREATE INDEX "ApiKey_user_id_revoked_at_idx" ON "ApiKey"("user_id", "revoked_at");
