import { describe, expect, it } from 'vitest';

import { buildPageSeoMeta } from '../../app/utils/seo';

describe('page SEO metadata', () => {
  it('builds canonical and social metadata from one page description', () => {
    expect(
      buildPageSeoMeta(
        {
          title: 'A post — Jov3',
          description: 'A useful post',
          path: '/blog/a-post',
          type: 'article',
          image: 'https://cdn.example.com/cover.jpg',
        },
        'https://jov3.cloud',
      ),
    ).toEqual({
      title: 'A post — Jov3',
      description: 'A useful post',
      canonical: 'https://jov3.cloud/blog/a-post',
      ogTitle: 'A post — Jov3',
      ogDescription: 'A useful post',
      ogType: 'article',
      ogUrl: 'https://jov3.cloud/blog/a-post',
      ogImage: 'https://cdn.example.com/cover.jpg',
      twitterCard: 'summary_large_image',
    });
  });

  it('uses the current public path and website card when no optional values are supplied', () => {
    expect(
      buildPageSeoMeta(
        { title: 'JOV3', description: 'A personal site' },
        'https://jov3.cloud/',
        '/projects?tab=all',
      ),
    ).toMatchObject({
      canonical: 'https://jov3.cloud/projects',
      ogType: 'website',
      twitterCard: 'summary',
    });

    expect(
      buildPageSeoMeta(
        { title: 'A post', description: 'A post', image: '/uploads/cover.jpg' },
        'https://jov3.cloud',
        '/blog/a-post',
      ),
    ).toMatchObject({ ogImage: 'https://jov3.cloud/uploads/cover.jpg' });
  });
});
