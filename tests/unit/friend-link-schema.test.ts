import { describe, expect, it } from 'vitest';

import {
  adminFriendLinkCreateSchema,
  friendLinkApplySchema,
  friendLinkListQuerySchema,
} from '../../shared/schemas/friend-links';

describe('friend link schemas', () => {
  it('normalizes visitor applications and keeps the logo optional', () => {
    expect(
      friendLinkApplySchema.parse({
        websiteName: '  FeiTwnd  ',
        websiteUrl: 'https://feitwnd.cc/',
        description: '  A quiet personal website.  ',
        contactEmail: ' FEI@example.com ',
        note: '  Let us exchange links. ',
      }),
    ).toEqual({
      websiteName: 'FeiTwnd',
      websiteUrl: 'https://feitwnd.cc/',
      logoMediaId: null,
      description: 'A quiet personal website.',
      contactEmail: 'fei@example.com',
      note: 'Let us exchange links.',
    });
  });

  it('rejects unsafe URLs, malformed emails, and invalid media references', () => {
    expect(() =>
      friendLinkApplySchema.parse({
        websiteName: 'Mori',
        websiteUrl: 'javascript:alert(1)',
        description: 'x',
        contactEmail: 'mori@example.com',
      }),
    ).toThrow();
    expect(() =>
      friendLinkApplySchema.parse({
        websiteName: 'Mori',
        websiteUrl: 'https://mori.example.com',
        description: 'x',
        contactEmail: 'not-an-email',
      }),
    ).toThrow();
    expect(() =>
      friendLinkApplySchema.parse({
        websiteName: 'Mori',
        websiteUrl: 'https://mori.example.com',
        logoMediaId: 'not-a-uuid',
        description: 'x',
        contactEmail: 'mori@example.com',
      }),
    ).toThrow();
  });

  it('defaults administrator-created links to published and supports hidden links', () => {
    expect(
      adminFriendLinkCreateSchema.parse({
        name: 'FeiTwnd',
        url: 'https://feitwnd.cc',
        description: 'A personal website.',
      }),
    ).toMatchObject({
      name: 'FeiTwnd',
      status: 'PUBLISHED',
      visible: true,
      logoMediaId: null,
      sortOrder: 0,
    });
  });

  it('accepts an admin status filter for moderation views', () => {
    expect(friendLinkListQuerySchema.parse({ status: 'PENDING_REVIEW' })).toMatchObject({
      status: 'PENDING_REVIEW',
      page: 1,
      pageSize: 50,
    });
  });
});
