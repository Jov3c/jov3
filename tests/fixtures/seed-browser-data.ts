import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../server/generated/prisma/client';
import { seedBlogDefaults } from '../../server/services/blog-defaults';
import { seedCommunityDefaults } from '../../server/services/community-defaults';
import { seedCvDefaults } from '../../server/services/cv-defaults';
import { seedFootprintDefaults } from '../../server/services/footprint-defaults';
import { seedFriendLinkDefaults } from '../../server/services/friend-link-defaults';
import { seedProjectDefaults } from '../../server/services/project-defaults';
import { seedTimelineDefaults } from '../../server/services/timeline-defaults';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  await seedProjectDefaults(prisma);
  await seedBlogDefaults(prisma);
  await seedCommunityDefaults(prisma);
  await seedFriendLinkDefaults(prisma);
  await seedCvDefaults(prisma);
  await seedTimelineDefaults(prisma);
  await seedFootprintDefaults(prisma);
  process.stdout.write('Browser test fixture data seeded.\n');
} finally {
  await prisma.$disconnect();
}
