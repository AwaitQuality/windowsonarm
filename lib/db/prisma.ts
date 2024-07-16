import {PrismaClient} from '@prisma/client'
import {PrismaNeon} from '@prisma/adapter-neon'
import {Pool} from '@neondatabase/serverless'

const getPrisma = (connectionString: string | null = null): PrismaClient => {
  if (!connectionString) {
    connectionString = process.env.DATABASE_URL as string;
  }

  const neon = new Pool({ connectionString })
  const adapter = new PrismaNeon(neon)

  return new PrismaClient({adapter})
}

export default getPrisma
