const databaseUrl = process.argv[2];

if (!databaseUrl) throw new Error('A PostgreSQL database URL is required');

const parsed = new URL(databaseUrl);
parsed.searchParams.delete('schema');
process.stdout.write(parsed.toString());
