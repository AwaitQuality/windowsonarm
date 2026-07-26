import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { generateToken, toApiKeySummary } from "@/lib/backend/api-key";
import {
  ApiKeySummary,
  CreatedApiKey,
  canGrantScopes,
  createApiKeySchema,
} from "@/lib/schemas/api-key";

/**
 * Keys are strictly per-owner: every query is scoped to the calling admin's own
 * user_id, so one admin can never read or revoke another's credentials.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "keys:read");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const keys = await prisma.apiKey.findMany({
      where: { user_id: admin.userId },
      orderBy: [{ revoked_at: "asc" }, { created_at: "desc" }],
    });

    const summaries: ApiKeySummary[] = keys.map(toApiKeySummary);

    return DataResponse.json(summaries);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "keys:write");

    if (!admin.ok) {
      return admin.response;
    }

    const input = createApiKeySchema.parse(await request.json());

    // A caller can only hand out authority it already holds. Sessions hold
    // `admin:*`, so this only ever constrains key-authenticated callers — and it
    // is what stops a narrow key with `keys:write` from minting a wide one.
    if (!canGrantScopes(admin.scopes, input.scopes)) {
      return ErrorResponse.json(
        "An API key cannot grant scopes beyond the ones it holds",
        { status: 403 }
      );
    }

    const expiresAt = input.expires_at ? new Date(input.expires_at) : null;

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      return ErrorResponse.json("Expiry must be in the future", {
        status: 400,
      });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const { token, prefix, hash } = await generateToken();

    const key = await prisma.apiKey.create({
      data: {
        user_id: admin.userId,
        name: input.name,
        prefix,
        hash,
        scopes: JSON.stringify(input.scopes),
        expires_at: expiresAt,
      },
    });

    // The only time the plaintext token exists outside the caller's own memory.
    // Nothing persists it, and no other endpoint can reproduce it.
    const created: CreatedApiKey = { ...toApiKeySummary(key), token };

    return DataResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
