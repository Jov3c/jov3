import { defineEventHandler } from 'h3';

import { usePrisma } from '../utils/prisma';

export default defineEventHandler(async () => {
  await usePrisma().$queryRaw`SELECT 1`;
  return { status: 'ok' };
});
