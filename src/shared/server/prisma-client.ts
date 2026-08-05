import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

const isLocalDatabase = /^(?:postgres(?:ql)?:\/\/)?[^@]*@?(localhost|127\.0\.0\.1)(?::|\/)/.test(
  process.env.DATABASE_URL ?? ""
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(isLocalDatabase ? {} : { ssl: { rejectUnauthorized: false } }),
  connectionTimeoutMillis: 10_000,
  statement_timeout: 15_000,
  query_timeout: 15_000,
  idleTimeoutMillis: 10_000,
  max: 3
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
