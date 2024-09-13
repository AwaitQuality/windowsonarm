import { NextRequest } from "next/server";
import { Status } from "@prisma/client";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import { getInfo } from "@/lib/backend/info";
import DataResponse from "@/lib/backend/response/DataResponse";

export const runtime = "edge";

export interface StatusWithPercentage extends Status {
  percentage: number;
}

export async function GET(request: NextRequest) {
  try {
    const info = await getInfo();

    return DataResponse.json(info);
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}
