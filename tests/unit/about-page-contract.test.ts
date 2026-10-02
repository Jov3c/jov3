import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('About public page contract', () => {
  it('uses Chinese titles and controls on both About subpages', () => {
    const cv = read('app/pages/about/cv.vue');
    const timeline = read('app/pages/about/timeline.vue');

    expect(cv).toContain('<h1>个人简历</h1>');
    expect(cv).toContain('打印 / 导出 PDF');
    expect(cv).not.toContain('CV, but make it mine.');
    expect(cv).not.toContain('Print / PDF');

    expect(timeline).toContain('<h1>人生时间线</h1>');
    expect(timeline).toContain('滚动继续');
    expect(timeline).not.toContain('A story still being written.');
    expect(timeline).not.toContain('Scroll to continue');
  });

  it('preserves the normalized About geometry from the final HTML prototype overrides', () => {
    const css = read('app/assets/css/prototype.css');

    expect(css).toMatch(/\.cv-prototype-hero\s*{[^}]*padding:\s*52px 0 24px/s);
    expect(css).toMatch(
      /\.cv-prototype-hero h1,[\s\S]*?\.life-hero h1\s*{[^}]*font-size:\s*clamp\(2\.75rem, 7vw, 4\.625rem\)/s,
    );
    expect(css).toMatch(/\.life-hero\s*{[^}]*padding:\s*52px 0 24px/s);
    expect(css).toMatch(/\.cv-prototype-shell\s*{[^}]*margin-top:\s*18px/s);
    expect(css).toMatch(/\.life-timeline-wrap\s*{[^}]*padding:\s*18px 0 40px/s);
  });
});
