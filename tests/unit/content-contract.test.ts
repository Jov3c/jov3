import { describe, expect, it } from 'vitest';

import { DEFAULT_HOME_ENTRIES, DEFAULT_SOCIAL_LINKS } from '../../server/services/home-defaults';
import { formatPostDateTime, isSafeExternalUrl } from '../../app/utils/content';

describe('production bootstrap content', () => {
  it('formats post timestamps in the site timezone on server and client', () => {
    expect(formatPostDateTime('2026-09-30T16:30:00.000Z')).toBe('2026-10-01 00:30');
  });

  it('uses only internal entry paths and a verified public GitHub profile', () => {
    expect(DEFAULT_HOME_ENTRIES.every((entry) => entry.url.startsWith('/'))).toBe(true);
    expect(DEFAULT_SOCIAL_LINKS.map((link) => link.url)).toEqual(['https://github.com/Jov3c']);
    expect(DEFAULT_SOCIAL_LINKS.every((link) => isSafeExternalUrl(link.url))).toBe(true);
    expect(JSON.stringify({ DEFAULT_HOME_ENTRIES, DEFAULT_SOCIAL_LINKS })).not.toMatch(
      /example\.com|mailto:/i,
    );
    expect(isSafeExternalUrl('#')).toBe(false);
  });
});
