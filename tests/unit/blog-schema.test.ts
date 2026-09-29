import { describe, expect, it } from 'vitest';

import { countMarkdownWords } from '../../shared/word-count';
import {
  categoryCreateSchema,
  postCreateSchema,
  postListQuerySchema,
} from '../../shared/schemas/blog';

describe('blog schemas and derived content', () => {
  it('keeps reserved blog routes out of post slugs', () => {
    expect(
      postCreateSchema.safeParse({
        slug: 'archive',
        title: 'Reserved',
        excerpt: 'Reserved slug',
        categoryId: '11111111-1111-4111-8111-111111111111',
        coverMediaId: null,
        markdownBody: '# Reserved',
        status: 'DRAFT',
        seoTitle: null,
        seoDescription: null,
      }).success,
    ).toBe(false);
    expect(
      postCreateSchema.safeParse({
        slug: 'valid-post',
        title: 'Valid post',
        excerpt: 'An excerpt',
        categoryId: '11111111-1111-4111-8111-111111111111',
        coverMediaId: null,
        markdownBody: '# Valid',
        status: 'DRAFT',
        seoTitle: null,
        seoDescription: null,
      }).success,
    ).toBe(true);
  });

  it('validates category slugs and public category filters', () => {
    expect(categoryCreateSchema.safeParse({ slug: 'product', name: '产品' }).success).toBe(true);
    expect(categoryCreateSchema.safeParse({ slug: 'not a slug', name: '产品' }).success).toBe(
      false,
    );
    expect(postListQuerySchema.parse({ page: '2', pageSize: '10', category: 'product' })).toEqual({
      page: 2,
      pageSize: 10,
      category: 'product',
    });
  });

  it('counts visible Chinese characters and latin words from Markdown', () => {
    expect(countMarkdownWords('# 你好 world\n\n```ts\nconst hidden = true\n```')).toBe(3);
  });
});
