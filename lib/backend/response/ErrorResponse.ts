import { NextResponse } from "next/server";

class ErrorResponse {
    public static json(
        error: string,
        init?: ResponseInit,
    ): NextResponse<{ success: false; error: string }> {
        console.log("error", error);
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
}

export default ErrorResponse;
