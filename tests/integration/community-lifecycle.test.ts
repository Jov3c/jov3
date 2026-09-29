import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { CommunityRepository } from '../../server/repositories/community-repository';
import { EmailVerificationRepository } from '../../server/repositories/email-verification-repository';
import { CommunityService } from '../../server/services/community-service';
import { EmailVerificationService } from '../../server/services/email-verification-service';
import { createPrismaClient } from '../../server/utils/prisma';
import type { EmailMessage, EmailSender } from '../../server/utils/smtp';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);
const suffix = `${Date.now()}`;

class CapturingSender implements EmailSender {
  messages: EmailMessage[] = [];

  async send(message: EmailMessage) {
    this.messages.push(message);
  }
}

describe('comments and message board lifecycle', () => {
  const sender = new CapturingSender();
  const verifier = new EmailVerificationService(
    new EmailVerificationRepository(prisma),
    sender,
    'https://jov3.example',
  );
  const service = new CommunityService(new CommunityRepository(prisma), verifier);
  let commentId = '';
  let messageId = '';

  beforeAll(async () => {
    await prisma.articleComment.deleteMany({ where: { email: `stage07-${suffix}@example.com` } });
    await prisma.message.deleteMany({ where: { email: `stage07-${suffix}@example.com` } });
    await prisma.emailVerification.deleteMany({
      where: { email: `stage07-${suffix}@example.com` },
    });
  });

  afterAll(async () => {
    if (commentId)
      await prisma.articleComment.delete({ where: { id: commentId } }).catch(() => undefined);
    if (messageId) await prisma.message.delete({ where: { id: messageId } }).catch(() => undefined);
    await prisma.emailVerification.deleteMany({
      where: { email: `stage07-${suffix}@example.com` },
    });
    await prisma.$disconnect();
  });

  it('keeps comments private until email verification and enforces one reply level', async () => {
    const email = `stage07-${suffix}@example.com`;
    const submitted = await service.submitComment(
      'server',
      {
        nickname: 'Stage Seven',
        email,
        content: '<script>plain text</script>',
        parentId: null,
      },
      'a'.repeat(64),
    );
    commentId = submitted.id;

    const pending = await service.listPublicComments('server', { page: 1, pageSize: 50 });
    expect(pending.items.some((comment) => comment.id === commentId)).toBe(false);

    const token = new URL(sender.messages.at(-1)!.text.split('\n')[2]!).searchParams.get('token')!;
    const verified = await verifier.verify(token);
    await service.completeEmailVerification(verified);

    const published = await service.listPublicComments('server', { page: 1, pageSize: 50 });
    const comment = published.items.find((item) => item.id === commentId)!;
    expect(comment.content).toContain('<script>plain text</script>');
    expect(comment).not.toHaveProperty('email');
    expect(published.publishedTotal).toBeGreaterThanOrEqual(1);

    const reply = await service.replyToComment(commentId, 'Admin reply stays plain text.');
    expect(reply.authorType).toBe('ADMIN');
    await expect(
      service.replyToComment(reply.id, 'Nested replies are blocked'),
    ).rejects.toMatchObject({
      code: 'REPLY_DEPTH_EXCEEDED',
    });
  });

  it('publishes verified messages, keeps email private, and supports moderation', async () => {
    const email = `stage07-${suffix}@example.com`;
    const submitted = await service.submitMessage(
      { nickname: 'Stage Seven', email, content: 'A guestbook message.' },
      'b'.repeat(64),
    );
    messageId = submitted.id;

    const pending = await service.listPublicMessages({ page: 1, pageSize: 50 });
    expect(pending.items.some((message) => message.id === messageId)).toBe(false);

    const token = new URL(sender.messages.at(-1)!.text.split('\n')[2]!).searchParams.get('token')!;
    const verified = await verifier.verify(token);
    await service.completeEmailVerification(verified);

    const published = await service.listPublicMessages({ page: 1, pageSize: 50 });
    const message = published.items.find((item) => item.id === messageId)!;
    expect(message).not.toHaveProperty('email');
    await expect(service.replyToMessage(messageId, '欢迎留下记录。')).resolves.toMatchObject({
      authorType: 'ADMIN',
    });
    await service.updateMessageStatus(messageId, 'HIDDEN');
    const hidden = await service.listPublicMessages({ page: 1, pageSize: 50 });
    expect(hidden.items.some((item) => item.id === messageId)).toBe(false);
  });
});
