import { unlink } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is required');

const storageRoot = resolve(process.env.MEDIA_STORAGE_ROOT || '.data/uploads');
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

function resolveStoredPath(storagePath) {
  const normalized = storagePath.replaceAll('\\', '/');
  const segments = normalized.split('/');
  if (!normalized || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error(`Unsafe media path: ${storagePath}`);
  }

  const fullPath = resolve(storageRoot, ...segments);
  const relativePath = relative(storageRoot, fullPath);
  if (relativePath.startsWith(`..${sep}`) || relativePath === '..' || isAbsolute(relativePath)) {
    throw new Error(`Media path escapes storage root: ${storagePath}`);
  }
  return fullPath;
}

const client = await pool.connect();
try {
  const { rows: tableRows } = await client.query(
    `SELECT to_regclass('public.footprint_memory_media') AS relation`,
  );
  if (tableRows[0]?.relation) {
    const { rows: assets } = await client.query(`
      SELECT DISTINCT media.id, media.storage_path
      FROM footprint_memory_media footprint_media
      JOIN media_assets media ON media.id = footprint_media.media_id
      WHERE NOT EXISTS (
        SELECT 1 FROM home_profile home WHERE home.avatar_media_id = media.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM posts post WHERE post.cover_media_id = media.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM friend_links link WHERE link.logo_media_id = media.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM cv_profile cv WHERE cv.portrait_media_id = media.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM timeline_entry_media timeline_media WHERE timeline_media.media_id = media.id
      )
    `);

    for (const asset of assets) {
      await unlink(resolveStoredPath(asset.storage_path)).catch((error) => {
        if (error?.code !== 'ENOENT') throw error;
      });
    }

    if (assets.length > 0) {
      const ids = assets.map((asset) => asset.id);
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM footprint_memory_media WHERE media_id = ANY($1::uuid[])', [
          ids,
        ]);
        await client.query('DELETE FROM media_assets WHERE id = ANY($1::uuid[])', [ids]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log(
      `Removed ${assets.length} media asset(s) used only by the retired Footprint feature.`,
    );
  }
} finally {
  client.release();
  await pool.end();
}
