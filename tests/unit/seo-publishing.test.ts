import { describe, expect, it } from 'vitest';

import { buildRssFeed } from '../../server/utils/rss';
import { buildSitemapXml } from '../../server/utils/sitemap';
import { normalizeSiteUrl, resolvePublicSiteUrl } from '../../server/utils/site-url';

describe('SEO publishing utilities', () => {
  it('normalizes safe site URLs and falls back to the request origin', () => {
    expect(normalizeSiteUrl('https://jov3.cloud///')).toBe('https://jov3.cloud');
    expect(normalizeSiteUrl('javascript:alert(1)')).toBeNull();
    expect(resolvePublicSiteUrl('', 'https://localhost:3000/')).toBe('https://localhost:3000');
  });

  it('builds escaped RSS XML with published posts only', () => {
    const xml = buildRssFeed(
      {
        title: 'JOV3 & Notes',
        description: 'A <personal> site',
        url: 'https://jov3.cloud',
      },
      [
        {
          status: 'PUBLISHED',
          title: 'A &< B',
          slug: 'a-b',
          excerpt: 'A <thought>',
          contentHtml: '<p>Hello</p>',
          categoryName: 'Notes',
          publishedAt: '2026-09-30T08:00:00.000Z',
        },
        {
          status: 'DRAFT',
          title: 'Draft',
          slug: 'draft',
          excerpt: 'Hidden',
          contentHtml: '<p>Hidden</p>',
          categoryName: 'Notes',
          publishedAt: null,
        },
      ],
    );

    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>A &amp;&lt; B</title>');
    expect(xml).toContain('<description>A &lt;thought&gt;</description>');
    expect(xml).toContain('https://jov3.cloud/blog/a-b');
    expect(xml).not.toContain('Draft');
  });

  it('builds a deduplicated sitemap with absolute escaped locations', () => {
    const xml = buildSitemapXml([
      { loc: 'https://jov3.cloud/' },
      { loc: 'https://jov3.cloud/blog/a&<b', lastmod: '2026-09-30' },
      { loc: 'https://jov3.cloud/' },
    ]);

    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://jov3.cloud/blog/a&amp;&lt;b</loc>');
    expect(xml.match(/<loc>https:\/\/jov3\.cloud\/<\/loc>/g)).toHaveLength(1);
    expect(xml).not.toContain('/admin');
  });
});
