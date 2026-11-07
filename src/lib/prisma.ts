import { PrismaClient } from "@prisma/client";

const prismaGlobal = globalThis as typeof globalThis & {
  __nochalantPrisma?: PrismaClient;
};

/**
 * Reuse one Prisma client during Next.js development hot reloads.
 * The client is created lazily by the module and never connects to a
 * database until a query is made. Point DATABASE_URL at Neon v2-dev
 * for development; production credentials must not be used here.
 */
export const prisma =
  prismaGlobal.__nochalantPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.__nochalantPrisma = prisma;
}
