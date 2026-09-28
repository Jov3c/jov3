import { describe, expect, it } from 'vitest';

import { blogPosts, friendLinks, projects } from '../../app/data/content';
import { findPost, findProject, isSafeExternalUrl } from '../../app/utils/content';

describe('typed public content', () => {
  it('uses unique routable slugs', () => {
    expect(new Set(projects.map((item) => item.slug)).size).toBe(projects.length);
    expect(new Set(blogPosts.map((item) => item.slug)).size).toBe(blogPosts.length);
  });

  it('resolves project and article detail records', () => {
    expect(findProject('signal')?.name).toBe('Signal Daily');
    expect(findPost('server')?.title).toContain('自动巡检');
    expect(findProject('missing')).toBeUndefined();
  });

  it('never promotes prototype placeholder domains to public links', () => {
    const activeLinks = friendLinks.filter((item) => item.url).map((item) => item.url);
    expect(activeLinks).toEqual(['https://feitwnd.cc']);
    expect(activeLinks.every((url) => isSafeExternalUrl(url))).toBe(true);
    expect(isSafeExternalUrl('#')).toBe(false);
  });
});
