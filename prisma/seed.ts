import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../server/generated/prisma/client';
import { bootstrapAdmin, parseBootstrapConfig } from '../server/services/admin-bootstrap';
import { ensureHomeDefaults } from '../server/services/home-defaults';
import { seedBlogDefaults } from '../server/services/blog-defaults';
import { seedCommunityDefaults } from '../server/services/community-defaults';
import { seedProjectDefaults } from '../server/services/project-defaults';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

try {
  const config = parseBootstrapConfig(process.env);
  const result = await bootstrapAdmin(prisma, config);
  await ensureHomeDefaults(prisma);
  await seedProjectDefaults(prisma);
  await seedBlogDefaults(prisma);
  await seedCommunityDefaults(prisma);
  process.stdout.write(
    result.created ? 'Administrator created.\n' : 'Administrator already exists.\n',
  );
} finally {
  await prisma.$disconnect();
}
