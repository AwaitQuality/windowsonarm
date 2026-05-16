import { StatusWithPercentage } from "@/app/api/v1/info/route";
import getPrisma from "@/lib/db/prisma";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";

export const getInfo = async (): Promise<InfoResponse> => {
  const { env } = getRequestContext();
  const prisma = getPrisma(env.DB);

  const [categories, status, tags] = await Promise.all([
    prisma.category.findMany(),
    prisma.$queryRaw<StatusWithPercentage[]>`
      SELECT
        Status.id        AS id,
        Status.name      AS name,
        Status.color     AS color,
        Status."idx"     AS "index",
        Status.text      AS text,
        Status.icon      AS icon,
        ROUND(CAST(COUNT(Post.id) AS FLOAT) * 100 /
              NULLIF((SELECT COUNT(*) FROM Post WHERE "effective_status" IS NOT NULL AND "effective_status" != -1), 0), 2) AS percentage
      FROM Status
      LEFT JOIN Post ON Post."effective_status" = Status.id AND Post."effective_status" != -1
      GROUP BY Status.id, Status."idx", Status.name, Status.color, Status.text, Status.icon
      ORDER BY Status."idx" ASC
    `,
    prisma.tag.findMany(),
  ]);

  return { categories, status, tags };
};
