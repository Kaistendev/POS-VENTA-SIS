import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.sqlite3' });
const prisma = new PrismaClient({ adapter });
const count = await prisma.user.count();
console.log('users:', count);
await prisma.$disconnect();
