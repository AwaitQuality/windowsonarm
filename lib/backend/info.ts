import { StatusWithPercentage } from "@/app/api/v1/info/route";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { unstable_cache } from "next/cache";

export const getInfo = unstable_cache(
  async (): Promise<InfoResponse> => {
    const { env } = getRequestContext();

    const prisma = getPrisma(env.DB);

    const categories = await prisma.category.findMany();

    const status = await prisma.$queryRaw<StatusWithPercentage[]>`
        SELECT
            Status.id as id,
            Status.name,
            Status.color,
            Status."idx",
            ROUND(CAST(COUNT(*) AS FLOAT) * 100 / (SELECT COUNT(*) FROM Post), 2) AS percentage
        FROM Post
                 INNER JOIN Status ON Post."effective_status" = Status.id
        GROUP BY Status.id, Status."idx", Status.name, Status.color
        ORDER BY Status."idx" ASC
    `;

    const tags = await prisma.tag.findMany();

    return {
      categories,
      status,
      tags,
    };
  },
  ["info-data"],
  { revalidate: 3600 }
);
