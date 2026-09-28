import { Pool } from 'pg';

export async function queryCurrentDatabase(databaseUrl: string): Promise<string> {
  if (!databaseUrl.trim()) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 1_000,
    max: 1,
  });

  try {
    const result = await pool.query<{ name: string }>('select current_database() as name');
    const databaseName = result.rows[0]?.name;

    if (!databaseName) {
      throw new Error('PostgreSQL did not return the current database name');
    }

    return databaseName;
  } finally {
    await pool.end();
  }
}
