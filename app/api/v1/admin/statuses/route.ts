import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { createStatusSchema } from "@/lib/schemas/taxonomy";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "taxonomy:read");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    // Unlike /api/v1/info this includes the pending pseudo-status, because the
    // admin surface is exactly where the review queue is managed from.
    const statuses = await prisma.status.findMany({
      orderBy: { index: "asc" },
      include: { _count: { select: { effective_posts: true } } },
    });

    return DataResponse.json(statuses);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "taxonomy:write");

    if (!admin.ok) {
      return admin.response;
    }

    const input = createStatusSchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    // A duplicate name surfaces as P2002 from the unique index and is mapped to
    // 409 by handleRouteError, so no read-then-write race is introduced here.
    const status = await prisma.status.create({
      data: {
        name: input.name,
        color: input.color,
        text: input.text,
        icon: input.icon,
        index: input.index ?? 0,
      },
    });

    return DataResponse.json(status, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
