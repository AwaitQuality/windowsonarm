/**
 * Deliberately still `middleware.ts`, not Next 16's `proxy.ts`.
 *
 * `proxy.ts` always runs on the Node.js runtime, and @opennextjs/cloudflare
 * rejects Node.js middleware ("Node.js middleware is not currently supported"),
 * so the Worker build fails. The legacy `middleware.ts` convention still works
 * as edge middleware — Next only logs a deprecation notice. Rename this file
 * once OpenNext supports Node.js proxies.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * The mutating API surface. Protected at the edge for non-GET requests only —
 * GET listings must stay public so crawlers can index them. Individual routes
 * still do their own ownership/role checks; this is defence in depth so a route
 * that forgets one is not open to anonymous writes.
 */
const isProtectedApiRoute = createRouteMatcher([
  "/api/v1/posts",
  "/api/v1/posts/(.*)",
  "/api/v1/blog",
  "/api/v1/blog/(.*)",
  "/api/v1/upload",
]);

const SAFE_METHODS = new Set(["GET", "HEAD"]);

export default clerkMiddleware(async (auth, request) => {
  if (SAFE_METHODS.has(request.method) || !isProtectedApiRoute(request)) {
    return;
  }

  const { userId } = await auth();

  if (!userId) {
    // Deliberately not `auth.protect()`: for non-document requests Clerk answers
    // 404 to avoid revealing route existence, which would break the
    // `{ success, error }` envelope every client call site branches on.
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 }
    );
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
