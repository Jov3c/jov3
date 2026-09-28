import { describe, expect, it } from 'vitest';

import { queryCurrentDatabase } from '../helpers/database';

describe('database baseline', () => {
  it('reports a clear error when DATABASE_URL is missing', async () => {
    await expect(queryCurrentDatabase('')).rejects.toThrow('DATABASE_URL is required');
  });

  it('surfaces a connection error when PostgreSQL is unavailable', async () => {
    const unavailableUrl = 'postgresql://jov3:jov3_dev_only@127.0.0.1:1/jov3';

    await expect(queryCurrentDatabase(unavailableUrl)).rejects.toThrow();
  });

  it('connects to the configured PostgreSQL database and returns jov3', async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';

    await expect(queryCurrentDatabase(databaseUrl)).resolves.toBe('jov3');
  });
});
