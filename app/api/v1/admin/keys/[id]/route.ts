import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { toApiKeySummary } from "@/lib/backend/api-key";
import { canGrantScopes, updateApiKeySchema } from "@/lib/schemas/api-key";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "keys:read");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    // Scoped to the owner, so a key id belonging to another admin is a 404
    // rather than a 403 — the id itself stays unconfirmed.
    const key = await prisma.apiKey.findFirst({
      where: { id: params.id, user_id: admin.userId },
    });

    if (!key) {
      return ErrorResponse.json("API key not found", { status: 404 });
    }

    return DataResponse.json(toApiKeySummary(key));
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "keys:write");

    if (!admin.ok) {
      return admin.response;
    }

    const input = updateApiKeySchema.parse(await request.json());

    if (input.scopes && !canGrantScopes(admin.scopes, input.scopes)) {
      return ErrorResponse.json(
        "An API key cannot grant scopes beyond the ones it holds",
        { status: 403 }
      );
    }

    const expiresAt =
      input.expires_at === undefined
        ? undefined
        : input.expires_at === null
          ? null
          : new Date(input.expires_at);

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      return ErrorResponse.json("Expiry must be in the future", {
        status: 400,
      });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.apiKey.findFirst({
      where: { id: params.id, user_id: admin.userId },
      select: { id: true, revoked_at: true },
    });

    if (!existing) {
      return ErrorResponse.json("API key not found", { status: 404 });
    }

    // Revocation is final. Re-widening a revoked key would resurrect a
    // credential its owner believes is dead.
    if (existing.revoked_at) {
      return ErrorResponse.json("This API key has been revoked", {
        status: 409,
      });
    }

    const key = await prisma.apiKey.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        scopes: input.scopes ? JSON.stringify(input.scopes) : undefined,
        expires_at: expiresAt,
      },
    });

    return DataResponse.json(toApiKeySummary(key));
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

/**
 * Revokes rather than deletes: the row is what makes "which key did this?"
 * answerable after the fact, and a deleted row frees its prefix for reuse.
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const admin = await requireAdmin(request, "keys:write");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const existing = await prisma.apiKey.findFirst({
      where: { id: params.id, user_id: admin.userId },
      select: { id: true, revoked_at: true },
    });

    if (!existing) {
      return ErrorResponse.json("API key not found", { status: 404 });
    }

    // Already-revoked is success, not an error: the caller's intent holds.
    if (existing.revoked_at) {
      return DataResponse.json({ success: true });
    }

    await prisma.apiKey.update({
      where: { id: existing.id },
      data: { revoked_at: new Date() },
    });

    return DataResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
