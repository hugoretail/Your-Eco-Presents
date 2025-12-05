import { PrismaClient } from '../generated/prisma';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Reuse a single PrismaClient in dev to avoid exhausting Postgres/SQLite connections when Next.js hot reloads.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
