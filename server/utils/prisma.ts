import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

const globalPrisma = globalThis as typeof globalThis & { jov3Prisma?: PrismaClient };

export function createPrismaClient(connectionString: string) {
  if (!connectionString.trim()) throw new Error('DATABASE_URL is required');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function usePrisma() {
  const connectionString = process.env.DATABASE_URL ?? '';
  if (!globalPrisma.jov3Prisma) globalPrisma.jov3Prisma = createPrismaClient(connectionString);
  return globalPrisma.jov3Prisma;
}
