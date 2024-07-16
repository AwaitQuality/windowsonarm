import { NextResponse } from "next/server";

class DataResponse {
    public static json<T>(
        body: T = {} as T,
        init?: ResponseInit,
    ): NextResponse<{ success: true; data: T }> {
        return NextResponse.json(
            {
                success: true,
                data: body,
            },
            init ?? {
                status: 200,
            },
        );
    }
}

export default DataResponse;
