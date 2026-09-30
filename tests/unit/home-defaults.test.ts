import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_HOME_ENTRIES,
  DEFAULT_SOCIAL_LINKS,
  ensureHomeDefaults,
} from '../../server/services/home-defaults';

describe('home defaults', () => {
  it('uses only a verified public GitHub social link', () => {
    expect(DEFAULT_SOCIAL_LINKS).toEqual([
      expect.objectContaining({ name: 'GitHub', url: 'https://github.com/Jov3c' }),
    ]);
    expect(JSON.stringify(DEFAULT_SOCIAL_LINKS)).not.toContain('@');
  });

  it('initializes defaults behind a transaction advisory lock', async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);
    const tx = {
      $executeRaw: executeRaw,
      siteProfile: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      homeProfile: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      homeEntry: {
        count: vi.fn().mockResolvedValue(0),
        createMany: vi.fn().mockResolvedValue({ count: DEFAULT_HOME_ENTRIES.length }),
      },
      socialLink: {
        count: vi.fn().mockResolvedValue(0),
        createMany: vi.fn().mockResolvedValue({ count: DEFAULT_SOCIAL_LINKS.length }),
      },
    };
    const transaction = vi.fn(async (callback: (client: typeof tx) => Promise<void>) =>
      callback(tx),
    );

    await ensureHomeDefaults({ $transaction: transaction } as never);

    expect(transaction).toHaveBeenCalledOnce();
    expect(executeRaw).toHaveBeenCalledOnce();
    expect(tx.homeEntry.createMany).toHaveBeenCalledOnce();
    expect(tx.socialLink.createMany).toHaveBeenCalledOnce();
  });
});
