import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('removed feature contract', () => {
  it('removes Footprint from the application surface', () => {
    const removedPaths = [
      'app/pages/admin/footprint.vue',
      'app/types/footprint.ts',
      'server/api/v1/admin/footprint',
      'server/api/v1/public/footprint',
      'server/repositories/footprint-repository.ts',
      'server/services/footprint-defaults.ts',
      'server/services/footprint-geo.ts',
      'server/services/footprint-service.ts',
      'server/utils/footprint.ts',
      'shared/footprint.ts',
      'shared/schemas/footprint.ts',
    ];

    for (const path of removedPaths) expect(existsSync(resolve(root, path)), path).toBe(false);
  });

  it('removes Footprint from current navigation, configuration and data models', () => {
    const currentSources = [
      'app/layouts/admin.vue',
      'app/pages/admin/media.vue',
      'prisma/schema.prisma',
      'server/repositories/media-repository.ts',
      'server/services/site-content-seed.ts',
      'shared/constants/blog.ts',
      'shared/constants/media.ts',
      'shared/constants/project.ts',
    ];

    for (const path of currentSources) {
      expect(read(path).toLowerCase(), path).not.toContain('footprint');
      expect(read(path), path).not.toContain('足迹');
    }
  });

  it('cleans feature-only media before applying the destructive schema migration', () => {
    const entrypoint = read('docker/app-entrypoint.sh');
    const cleanupIndex = entrypoint.indexOf('remove-footprint-media.mjs');
    const migrationIndex = entrypoint.indexOf('prisma migrate deploy');
    const cleanup = read('scripts/remove-footprint-media.mjs');
    const migration = read('prisma/migrations/20261003010000_remove_footprint/migration.sql');

    expect(cleanupIndex).toBeGreaterThan(-1);
    expect(migrationIndex).toBeGreaterThan(cleanupIndex);
    expect(cleanup).toContain("to_regclass('public.footprint_memory_media')");
    expect(cleanup).toContain('NOT EXISTS');
    expect(cleanup).toContain('timeline_entry_media');
    expect(migration.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  });
});
