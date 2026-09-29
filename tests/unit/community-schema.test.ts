import { describe, expect, it } from 'vitest';

import {
  adminReplySchema,
  commentCreateSchema,
  messageCreateSchema,
  moderationStatusUpdateSchema,
} from '../../shared/schemas/community';

describe('community schemas', () => {
  it('normalizes visitor fields and keeps replies optional', () => {
    expect(
      commentCreateSchema.parse({
        nickname: '  Mori ',
        email: 'MORI@example.com',
        content: '  hello <script>alert(1)</script>  ',
      }),
    ).toMatchObject({
      nickname: 'Mori',
      email: 'mori@example.com',
      content: 'hello <script>alert(1)</script>',
      parentId: null,
    });
  });

  it('rejects invalid email, empty text, and visitor message parents', () => {
    expect(() =>
      messageCreateSchema.parse({ nickname: 'M', email: 'bad', content: 'x' }),
    ).toThrow();
    expect(() =>
      commentCreateSchema.parse({ nickname: 'M', email: 'm@example.com', content: '' }),
    ).toThrow();
    expect(() =>
      commentCreateSchema.parse({
        nickname: 'M',
        email: 'm@example.com',
        content: 'x',
        parentId: 'not-a-uuid',
      }),
    ).toThrow();
  });

  it('limits moderation actions and admin replies to plain text', () => {
    expect(moderationStatusUpdateSchema.parse({ status: 'HIDDEN' })).toEqual({ status: 'HIDDEN' });
    expect(() => moderationStatusUpdateSchema.parse({ status: 'PENDING_EMAIL' })).toThrow();
    expect(adminReplySchema.parse({ content: '  a reply  ' })).toEqual({ content: 'a reply' });
  });
});
