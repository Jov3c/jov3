import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('admin design contract', () => {
  it('uses one coherent admin stylesheet', () => {
    const layout = read('app/layouts/admin.vue');
    const css = read('app/assets/css/admin.css');

    expect(layout).toContain('<style src="~/assets/css/admin.css"></style>');
    expect(layout).not.toContain('admin-shell.css');
    expect(existsSync(resolve(root, 'app/assets/css/admin-shell.css'))).toBe(false);
    expect(css).not.toContain('.admin-nav-link:not(.router-link-exact-active)');
  });

  it('shares the public editorial visual language', () => {
    const layout = read('app/layouts/admin.vue');
    const css = read('app/assets/css/admin.css');

    expect(layout).toContain('admin-wordmark__dot');
    expect(layout).not.toContain('admin-wordmark__mark');
    expect(layout).not.toMatch(/<i>[^<]+<\/i>/);
    expect(layout).toContain(':aria-label="item.label"');
    expect(layout).toContain('aria-controls="admin-sidebar"');
    expect(layout).toContain(':aria-expanded="isMobileOpen"');
    expect(css).toContain('var(--color-bg)');
    expect(css).toContain('var(--color-panel)');
    expect(css).toContain('var(--color-accent)');
    expect(css).toContain('border-radius: var(--radius)');
    expect(css).not.toContain('#f5f7fa');
    expect(css).not.toContain('#303133');
  });
});
