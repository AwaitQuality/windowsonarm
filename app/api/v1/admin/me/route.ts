import { NextRequest } from "next/server";
import DataResponse from "@/lib/backend/response/DataResponse";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin, type AdminAuthMethod } from "@/lib/backend/auth";
import { expandScopes, type ApiScope, type LeafScope } from "@/lib/schemas/api-key";

/**
 * Credential introspection: the endpoint a script calls first to confirm its
 * key works and to discover what that key may actually do.
 */
export interface AdminIdentityResponse {
  user_id: string;
  username: string | null;
  via: AdminAuthMethod;
  /** The key that authorised the call, or null for a browser session. */
  key_id: string | null;
  /** Exactly as granted, wildcards included. */
  scopes: ApiScope[];
  /** The same authority flattened to leaves, which is what routes check. */
  effective_scopes: LeafScope[];
}

/**
 * No scope requirement: any valid admin credential may ask what it is. Gating
 * introspection would make a misconfigured key indistinguishable from a revoked
 * one, which is exactly the thing a caller needs to tell apart.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    const identity: AdminIdentityResponse = {
      user_id: admin.userId,
      username:
        admin.user.username ??
        (`${admin.user.firstName ?? ""} ${admin.user.lastName ?? ""}`.trim() ||
          null),
      via: admin.via,
      key_id: admin.keyId,
      scopes: admin.scopes,
      effective_scopes: expandScopes(admin.scopes),
    };

    return DataResponse.json(identity);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
