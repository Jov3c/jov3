import { describe, expect, it } from 'vitest';

import {
  BROWSER_RESET_TABLES,
  assertBrowserResetAllowed,
  buildBrowserResetSql,
} from '../fixtures/browser-database';

describe('browser database reset', () => {
  it('covers application tables without touching Prisma migrations', () => {
    expect(BROWSER_RESET_TABLES).toContain('admin_users');
    expect(BROWSER_RESET_TABLES).toContain('projects');
    expect(BROWSER_RESET_TABLES).toContain('timeline_entries');
    expect(BROWSER_RESET_TABLES).toContain('footprint_memories');
    expect(BROWSER_RESET_TABLES).not.toContain('_prisma_migrations');
    expect(buildBrowserResetSql()).toContain('RESTART IDENTITY CASCADE');
  });

  it('requires an explicit opt-in outside CI', () => {
    expect(() => assertBrowserResetAllowed('postgresql://localhost/jov3', {})).toThrow(
      'JOV3_BROWSER_RESET=1',
    );
    expect(() =>
      assertBrowserResetAllowed('postgresql://localhost/jov3', { JOV3_BROWSER_RESET: '1' }),
    ).not.toThrow();
    expect(() =>
      assertBrowserResetAllowed('postgresql://localhost/jov3', { CI: 'true' }),
    ).not.toThrow();
  });
});
