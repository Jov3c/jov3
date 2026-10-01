import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

import pg from 'pg';

const { Client } = pg;
const backupDir = process.argv[2];
const adminDatabaseUrl = process.env.JOV3_RESTORE_ADMIN_DATABASE_URL;
const restoreRoot = resolve(
  process.env.JOV3_RESTORE_ROOT || join(process.cwd(), '.data', 'restore-test'),
);

if (!backupDir) throw new Error('usage: restore-test.sh /path/to/backup-directory');
if (!adminDatabaseUrl) {
  throw new Error('JOV3_RESTORE_ADMIN_DATABASE_URL must point to an isolated PostgreSQL server');
}

const databaseDump = resolve(backupDir, 'database.sql');
const assetArchive = resolve(backupDir, 'uploads-geo.tgz');
if (!existsSync(databaseDump) || !existsSync(assetArchive)) {
  throw new Error('Backup directory must contain database.sql and uploads-geo.tgz');
}

const databaseName = `jov3_restore_${Date.now()}_${randomBytes(3).toString('hex')}`;
const restoreUrl = new URL(adminDatabaseUrl);
restoreUrl.pathname = `/${databaseName}`;
restoreUrl.searchParams.delete('schema');
const admin = new Client({ connectionString: adminDatabaseUrl });
const extractedRoot = join(restoreRoot, databaseName);
let adminConnected = false;

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

async function verifyDatabase() {
  const client = new Client({ connectionString: restoreUrl.toString() });
  await client.connect();
  try {
    const requiredTables = [
      'site_profile',
      'home_profile',
      'projects',
      'posts',
      'timeline_entries',
      'footprint_cities',
    ];
    for (const table of requiredTables) {
      const result = await client.query(
        `SELECT count(*)::int AS count FROM ${quoteIdentifier('public')}.${quoteIdentifier(table)}`,
      );
      if (result.rows[0].count < 1) throw new Error(`Restored table is empty: ${table}`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  await mkdir(extractedRoot, { recursive: true });
  run('tar', ['-xzf', assetArchive, '-C', extractedRoot]);
  if (!existsSync(join(extractedRoot, 'uploads')) || !existsSync(join(extractedRoot, 'geo'))) {
    throw new Error('Restored asset archive is missing uploads or geo');
  }

  await admin.connect();
  adminConnected = true;
  await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  await admin.end();
  adminConnected = false;

  run('psql', [restoreUrl.toString(), '--set=ON_ERROR_STOP=1', '--file', databaseDump]);
  await verifyDatabase();
  process.stdout.write(`Backup restored and verified in ${databaseName}.\n`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (adminConnected) await admin.end().catch(() => undefined);
  const cleanup = new Client({ connectionString: adminDatabaseUrl });
  await cleanup
    .connect()
    .then(async () => {
      await cleanup.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
      await cleanup.end();
    })
    .catch(() => undefined);
  await rm(extractedRoot, { recursive: true, force: true }).catch(() => undefined);
}
