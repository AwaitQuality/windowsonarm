import { Status } from "@/lib/generated/prisma/client";
import { getInfo } from "@/lib/backend/info";
import DataResponse from "@/lib/backend/response/DataResponse";
import { handleRouteError } from "@/lib/backend/errors";


export interface StatusWithPercentage extends Status {
  percentage: number;
}

export async function GET() {
  try {
    const info = await getInfo();

    return DataResponse.json(info);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
