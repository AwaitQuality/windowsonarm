/**
 * Deliberately still `middleware.ts`, not Next 16's `proxy.ts`.
 *
 * `proxy.ts` always runs on the Node.js runtime, and @opennextjs/cloudflare
 * rejects Node.js middleware ("Node.js middleware is not currently supported"),
 * so the Worker build fails. The legacy `middleware.ts` convention still works
 * as edge middleware — Next only logs a deprecation notice. Rename this file
 * once OpenNext supports Node.js proxies.
 */
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
