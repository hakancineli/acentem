import { PrismaClient } from "@/generated/prisma";

// Tek bir PrismaClient instance'ı paylaş
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


