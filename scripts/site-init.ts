import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../server/generated/prisma/client';
import { seedSiteContent } from '../server/services/site-content-seed';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  await seedSiteContent(prisma);
  process.stdout.write('Site content initialized.\n');
} finally {
  await prisma.$disconnect();
}
