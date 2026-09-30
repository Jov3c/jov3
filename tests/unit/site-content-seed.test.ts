import { describe, expect, it, vi } from 'vitest';

import { seedSiteContent } from '../../server/services/site-content-seed';

describe('site content seed', () => {
  it('seeds all prototype content in dependency order', async () => {
    const calls: string[] = [];
    const seed = (name: string) => vi.fn(async () => void calls.push(name));

    await seedSiteContent({} as never, {
      ensureHomeDefaults: seed('home'),
      seedProjectDefaults: seed('projects'),
      seedBlogDefaults: seed('posts'),
      seedCommunityDefaults: seed('community'),
      seedFriendLinkDefaults: seed('links'),
      seedFootprintDefaults: seed('footprint'),
      seedCvDefaults: seed('cv'),
      seedTimelineDefaults: seed('timeline'),
    });

    expect(calls).toEqual([
      'home',
      'projects',
      'posts',
      'community',
      'links',
      'footprint',
      'cv',
      'timeline',
    ]);
  });
});
