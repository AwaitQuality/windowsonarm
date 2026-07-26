import { NextResponse } from "next/server";
import { ZodError } from "zod";
import ErrorResponse, {
  ErrorResponseBody,
} from "@/lib/backend/response/ErrorResponse";

/**
 * Client-facing text. Deliberately generic: raw driver errors carry SQL, table
 * and column names, and AWS SDK detail that must not reach the browser.
 */
const CLIENT_MESSAGES = {
  notFound: "The requested resource was not found",
  conflict: "That resource already exists",
  server: "An unexpected error occurred. Please try again.",
} as const;

/**
 * The shape of a Prisma known-request error we care about. Matched structurally
 * rather than with `instanceof` so it survives the D1 adapter and any wrapping
 * the Workers runtime does on the way out of the query engine.
 */
interface PrismaKnownRequestError {
  code: string;
}

const isPrismaKnownRequestError = (
  error: unknown
): error is PrismaKnownRequestError => {
  if (typeof error !== "object" || error === null) return false;
  const code: unknown = Reflect.get(error, "code");
  return typeof code === "string" && /^P\d{4}$/.test(code);
};

/**
 * The single exit point for a failed route handler: logs the real error
 * server-side and returns a safe, status-mapped body to the caller.
 */
export const handleRouteError = (
  error: unknown
): NextResponse<ErrorResponseBody> => {
  if (error instanceof ZodError) {
    return ErrorResponse.validation(
      error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }))
    );
  }

  if (isPrismaKnownRequestError(error)) {
    console.error(`Route database error [${error.code}]:`, error);

    switch (error.code) {
      // Record required for update/delete does not exist.
      case "P2025":
        return ErrorResponse.json(CLIENT_MESSAGES.notFound, { status: 404 });
      // Unique constraint violation.
      case "P2002":
        return ErrorResponse.json(CLIENT_MESSAGES.conflict, { status: 409 });
      default:
        return ErrorResponse.json(CLIENT_MESSAGES.server, { status: 500 });
    }
  }

  console.error("Unhandled route error:", error);
  return ErrorResponse.json(CLIENT_MESSAGES.server, { status: 500 });
};
