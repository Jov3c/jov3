import { describe, expect, it } from 'vitest';

import { MediaRepository } from '../../server/repositories/media-repository';

describe('media repository references', () => {
  it('counts home avatars, post covers, and friend link logos', async () => {
    const repository = new MediaRepository({
      homeProfile: { count: async () => 1 },
      post: { count: async () => 2 },
      friendLink: { count: async () => 3 },
    } as never);

    await expect(repository.countReferences('media-id')).resolves.toBe(6);
  });
});
