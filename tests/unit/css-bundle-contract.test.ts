import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('CSS bundle contract', () => {
  it('keeps layout-specific styles out of the global Nuxt bundle', () => {
    const nuxtConfig = read('nuxt.config.ts');

    expect(nuxtConfig).toContain("css: ['~/assets/css/base.css']");
    expect(read('app/layouts/blog-prototype.vue')).toContain(
      '<style src="~/assets/css/prototype.css"></style>',
    );
    expect(read('app/layouts/admin.vue')).toContain('<style src="~/assets/css/admin.css"></style>');
    expect(read('app/layouts/admin-auth.vue')).toContain(
      '<style src="~/assets/css/admin.css"></style>',
    );
    expect(read('app/pages/index.vue')).toContain('<style src="~/assets/css/public.css"></style>');
    expect(read('app/pages/projects/index.vue')).toContain(
      '<style src="~/assets/css/public.css"></style>',
    );
  });

  it.each(['base.css', 'public.css', 'prototype.css', 'admin.css'])(
    'keeps %s below the source-size ceiling',
    (file) => {
      expect(statSync(resolve(root, 'app/assets/css', file)).size).toBeLessThan(60_000);
    },
  );

  it('does not retain prototype page selectors in the Home/Projects stylesheet', () => {
    expect(read('app/assets/css/public.css')).not.toMatch(
      /\.(?:post-card|blog-subnav|archive-group|friend-link-card|life-chapter|cv-prototype)/,
    );
  });
});
