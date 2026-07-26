import { NextResponse } from "next/server";
import { auth, clerkClient, User } from "@clerk/nextjs/server";
import ErrorResponse, {
  ErrorResponseBody,
} from "@/lib/backend/response/ErrorResponse";

const ADMIN_ROLE = "admin";

export type RequireAdminResult =
  | { ok: true; user: User; userId: string }
  | { ok: false; response: NextResponse<ErrorResponseBody> };

const getClerkUser = async (userId: string): Promise<User | null> => {
  try {
    return await (await clerkClient()).users.getUser(userId);
  } catch (error) {
    console.error("Failed to load Clerk user:", error);
    return null;
  }
};

/**
 * Gate for admin-only handlers. 401 means "we don't know who you are", 403 means
 * "we do, and you're not an admin" — the two must not be conflated.
 */
export const requireAdmin = async (): Promise<RequireAdminResult> => {
  const { userId } = await auth();

  if (!userId) {
    return {
      ok: false,
      response: ErrorResponse.json("Authentication required", { status: 401 }),
    };
  }

  const user = await getClerkUser(userId);

  if (!user) {
    return {
      ok: false,
      response: ErrorResponse.json("Authentication required", { status: 401 }),
    };
  }

  if (user.publicMetadata.role !== ADMIN_ROLE) {
    return {
      ok: false,
      response: ErrorResponse.json("Admin access required", { status: 403 }),
    };
  }

  return { ok: true, user, userId };
};

/**
 * Soft admin check for handlers where being an admin widens what you can see
 * rather than deciding whether you get in at all.
 */
export const isAdminUser = async (
  userId: string | null | undefined
): Promise<boolean> => {
  if (!userId) return false;

  const user = await getClerkUser(userId);
  return user?.publicMetadata.role === ADMIN_ROLE;
};
