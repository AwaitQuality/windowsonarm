import { NextRequest } from "next/server";
import { Status } from "@prisma/client";
import DataResponse from "@/lib/backend/response/DataResponse";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import getPrisma from '@/lib/db/prisma';
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge';

export interface StatusWithPercentage extends Status {
  percentage: number;
}

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();

    const prisma = getPrisma(env.DATABASE_URL);

    const categories = await prisma.category.findMany();

    const status = await prisma.$queryRaw<StatusWithPercentage[]>`
        SELECT "Status"."id"                                        as id,
               name,
               color,
               index,
               ROUND((COUNT(*) * 100.0 / total_count.total)::numeric, 2) AS percentage
        FROM "Post"
                 INNER JOIN "Status" ON "Post"."status" = "Status"."id",
             (SELECT COUNT(*) AS total FROM "Post") AS total_count
        GROUP BY "Status"."id", index, status, name, color, total_count.total
        ORDER BY "Status"."index" ASC
    `;

    const tagsRaw = await prisma.$queryRaw<Array<{ distinct_tag: string }>>`
        SELECT DISTINCT t.tag AS distinct_tag
        FROM "Post", unnest(tags) AS t(tag)
        WHERE t.tag IS NOT NULL
        ORDER BY t.tag
    `;

    const tags = tagsRaw.map((tag) => tag.distinct_tag);

    return DataResponse.json({
      categories,
      status,
      tags,
    });
  } catch (error: any) {
    return ErrorResponse.json(error.message);
  }
}
