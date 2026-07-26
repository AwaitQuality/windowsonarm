import { StatusWithPercentage } from "@/app/api/v1/info/route";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { PENDING_STATUS_ID } from "@/lib/schemas/post";
import { unstable_cache } from "next/cache";

export const getInfo = unstable_cache(
  async (): Promise<InfoResponse> => {
    const { env } = await getCloudflareContext({ async: true });

    const prisma = getPrisma(env.DB);

    const categories = await prisma.category.findMany();

    // Driven from Status, not Post, so a status with no posts still appears in
    // the filter list (with 0%) instead of disappearing.
    //
    // Every column StatusWithPercentage promises has to be projected here --
    // $queryRaw returns raw column names, so "idx" is aliased to the model's
    // `index`, and `text`/`icon` were previously absent and read as undefined.
    //
    // The denominator matches the set being counted -- publicly visible posts --
    // so the percentages sum to 100. Counting all posts included the pending
    // ones, which are never shown.
    const status = await prisma.$queryRaw<StatusWithPercentage[]>`
        SELECT
            "Status"."id"    AS "id",
            "Status"."idx"   AS "index",
            "Status"."name"  AS "name",
            "Status"."color" AS "color",
            "Status"."text"  AS "text",
            "Status"."icon"  AS "icon",
            COALESCE(
                ROUND(
                    CAST(COUNT("Post"."id") AS FLOAT) * 100 / NULLIF((
                        SELECT COUNT(*) FROM "Post"
                        WHERE "Post"."effective_status" <> ${PENDING_STATUS_ID}
                    ), 0),
                    2
                ),
                0
            ) AS "percentage"
        FROM "Status"
                 LEFT JOIN "Post" ON "Post"."effective_status" = "Status"."id"
        WHERE "Status"."id" <> ${PENDING_STATUS_ID}
        GROUP BY "Status"."id", "Status"."idx", "Status"."name", "Status"."color", "Status"."text", "Status"."icon"
        ORDER BY "Status"."idx" ASC
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
