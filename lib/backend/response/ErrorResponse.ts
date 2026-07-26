import { NextResponse } from "next/server";

/** Field-level validation detail. Only ever attached to 400 responses. */
export interface ValidationIssue {
    path: string;
    message: string;
}

export interface ErrorResponseBody {
    success: false;
    error: string;
    issues?: ValidationIssue[];
}

class ErrorResponse {
    public static json(
        error: string,
        init?: ResponseInit,
    ): NextResponse<ErrorResponseBody> {
        console.error("API error response:", error);
        return NextResponse.json(
            {
                success: false,
                error: error,
            },
            init ?? {
                status: 500,
            },
        );
    }

    /**
     * 400 for a request the caller can fix. Echoing the offending fields is safe
     * because they describe the caller's own payload, not our internals.
     */
    public static validation(
        issues: ValidationIssue[],
        error = "The request payload is invalid",
    ): NextResponse<ErrorResponseBody> {
        console.error("API validation error:", issues);
        return NextResponse.json(
            {
                success: false,
                error: error,
                issues: issues,
            },
            {
                status: 400,
            },
        );
    }
}

export default ErrorResponse;
