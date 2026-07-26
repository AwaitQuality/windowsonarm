import { Category, Tag } from "@/lib/generated/prisma/client";
import type { StatusWithPercentage } from "@/app/api/v1/info/route";

export interface InfoResponse {
  categories: Category[];
  status: StatusWithPercentage[];
  tags: Tag[];
}
