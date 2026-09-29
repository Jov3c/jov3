import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BlogRepository } from '../../server/repositories/blog-repository';
import { BlogService } from '../../server/services/blog-service';
import { createPrismaClient } from '../../server/utils/prisma';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);

describe('blog lifecycle', () => {
  const service = new BlogService(new BlogRepository(prisma));
  const suffix = `${Date.now()}`;
  let categoryId = '';
  let postId = '';

  beforeAll(async () => {
    const category = await service.createCategory({
      slug: `stage-six-${suffix}`,
      name: 'Stage Six',
      sortOrder: 999,
      visible: true,
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    if (postId) await service.deletePost(postId);
    if (categoryId) await service.deleteCategory(categoryId);
    await prisma.$disconnect();
  });

  it('keeps drafts private and publishes a Markdown post with derived metadata', async () => {
    const draft = await service.createPost({
      slug: `stage-six-post-${suffix}`,
      title: 'Stage Six lifecycle post',
      excerpt: 'Database-backed blog content.',
      categoryId,
      coverMediaId: null,
      markdownBody: '# Stage Six\n\n你好 world',
      status: 'DRAFT',
      seoTitle: null,
      seoDescription: null,
    });
    postId = draft.id;

    await expect(service.getPublicPostBySlug(draft.slug)).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });

    const published = await service.publishPost(postId);
    expect(published.status).toBe('PUBLISHED');
    expect(published.wordCount).toBeGreaterThan(0);
    await expect(service.getPublicPostBySlug(draft.slug)).resolves.toMatchObject({
      slug: draft.slug,
      contentHtml: expect.stringContaining('<h1>Stage Six</h1>'),
    });
  });

  it('uses the same published post in category filtering and archive', async () => {
    const list = await service.listPublicPosts({
      page: 1,
      pageSize: 20,
      category: `stage-six-${suffix}`,
    });
    expect(list.items.some((post) => post.id === postId)).toBe(true);

    const archive = await service.listArchive();
    expect(
      archive.years.some((year) =>
        year.months.some((month) => month.items.some((item) => item.id === postId)),
      ),
    ).toBe(true);
  });

  it('prevents deleting a category while a post references it', async () => {
    await expect(service.deleteCategory(categoryId)).rejects.toMatchObject({
      code: 'CATEGORY_IN_USE',
    });

    await service.unpublishPost(postId);
    await expect(service.getPublicPostBySlug(`stage-six-post-${suffix}`)).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });
  });
});
