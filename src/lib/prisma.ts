import { PrismaClient } from "@prisma/client";
import { env, isDemoMode } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL ?? (isDemoMode ? "postgresql://demo:demo@localhost:5432/sponsorscope_demo" : undefined),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
