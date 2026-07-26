import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import DataResponse from "@/lib/backend/response/DataResponse";
import getPrisma from "@/lib/db/prisma";
import { handleRouteError } from "@/lib/backend/errors";
import { requireAdmin } from "@/lib/backend/auth";
import { createCategorySchema } from "@/lib/schemas/taxonomy";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, "taxonomy:read");

    if (!admin.ok) {
      return admin.response;
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const categories = await prisma.category.findMany({
      orderBy: { index: "asc" },
      include: { _count: { select: { posts: true } } },
    });

    return DataResponse.json(categories);
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

    const input = createCategorySchema.parse(await request.json());

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const category = await prisma.category.create({
      data: {
        name: input.name,
        icon: input.icon,
        index: input.index ?? 0,
      },
    });

    return DataResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
