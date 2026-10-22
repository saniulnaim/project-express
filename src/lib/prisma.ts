
import 'dotenv/config'; // .env থেকে DATABASE_URL load করছে।
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'; // SQLite database driver adapter তৈরি করছে।
import { PrismaClient } from '../../generated/prisma/client'; // generated Prisma Client import করছে।

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

const prisma = new PrismaClient({ adapter }); // Prisma-কে database adapter-এর সঙ্গে connect করছে।

export default prisma;
