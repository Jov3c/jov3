import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../server/generated/prisma/client';
import { assertBrowserResetAllowed, resetBrowserDatabase } from './browser-database';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
assertBrowserResetAllowed(databaseUrl, process.env);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  await resetBrowserDatabase(prisma);
  process.stdout.write('Browser test database reset.\n');
} finally {
  await prisma.$disconnect();
}
