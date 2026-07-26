import DataResponse from "@/lib/backend/response/DataResponse";
import { handleRouteError } from "@/lib/backend/errors";
import { getStatistics } from "@/lib/backend/statistics";

export async function GET() {
  try {
    // Cached for five minutes in lib/backend/statistics.ts; the header lets any
    // CDN in front of the Worker reuse it for the same window.
    return DataResponse.json(await getStatistics(), {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
