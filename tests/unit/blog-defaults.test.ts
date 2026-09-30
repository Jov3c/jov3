import { describe, expect, it, vi } from 'vitest';

import { seedBlogDefaults } from '../../server/services/blog-defaults';

describe('blog defaults', () => {
  it('adds prototype posts without replacing existing posts', async () => {
    const postUpsert = vi.fn().mockResolvedValue({});
    const prisma = {
      postCategory: {
        upsert: vi.fn(async ({ where }: { where: { slug: string } }) => ({ id: where.slug })),
      },
      post: { upsert: postUpsert },
    };

    await seedBlogDefaults(prisma as never);

    expect(postUpsert).toHaveBeenCalledTimes(11);
    expect(postUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'server' }, update: {} }),
    );
  });
});
