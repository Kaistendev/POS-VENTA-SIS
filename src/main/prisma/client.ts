import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.sqlite3?mode=rwc',
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

async function setupSQLite() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`PRAGMA journal_mode=WAL`;
    await prisma.$queryRaw`PRAGMA synchronous=NORMAL`;
    await prisma.$queryRaw`PRAGMA cache_size=10000`;
    await prisma.$queryRaw`PRAGMA temp_store=MEMORY`;
  } catch (e) {
    console.warn('SQLite PRAGMA setup:', e);
  }
}

setupSQLite();

export default prisma;
