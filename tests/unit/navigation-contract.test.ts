import { describe, expect, it } from 'vitest';

import { aboutNavigation, blogNavigation, primaryNavigation } from '../../app/data/navigation';

describe('public navigation contract', () => {
  it('keeps the locked primary navigation order', () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual(['Home', 'Projects', 'Blog']);
    expect(aboutNavigation.map((item) => item.label)).toEqual(['CV', 'Timeline']);
  });

  it('exposes every blog utility route without placeholder anchors', () => {
    expect(blogNavigation.map((item) => item.label)).toEqual(['归档', '友链', '留言', '足迹']);

    const destinations = [primaryNavigation, aboutNavigation, blogNavigation]
      .flat()
      .map((item) => item.to);

    expect(destinations).not.toContain('#');
    expect(destinations.every((destination) => destination.startsWith('/'))).toBe(true);
  });
});
