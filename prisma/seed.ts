import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../server/generated/prisma/client';
import { bootstrapAdmin, parseBootstrapConfig } from '../server/services/admin-bootstrap';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

try {
  const config = parseBootstrapConfig(process.env);
  const result = await bootstrapAdmin(prisma, config);
  process.stdout.write(
    result.created ? 'Administrator created.\n' : 'Administrator already exists.\n',
  );
} finally {
  await prisma.$disconnect();
}
