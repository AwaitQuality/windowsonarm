import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * One client per request: Workers isolates are short-lived and the D1 adapter
 * is bound to the incoming request's binding.
 */
const getPrisma = (connection: D1Database): PrismaClient =>
  new PrismaClient({ adapter: new PrismaD1(connection) });

export default getPrisma;
