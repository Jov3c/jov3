import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EmailVerificationRepository } from '../../server/repositories/email-verification-repository';
import { EmailVerificationService } from '../../server/services/email-verification-service';
import { createPrismaClient } from '../../server/utils/prisma';
import type { EmailMessage, EmailSender } from '../../server/utils/smtp';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);
const entityId = '33333333-3333-4333-8333-333333333333';

class CapturingSender implements EmailSender {
  messages: EmailMessage[] = [];

  async send(message: EmailMessage) {
    this.messages.push(message);
  }
}

describe('media and email verification persistence', () => {
  const email = 'stage03-verification@example.com';

  beforeAll(async () => {
    await prisma.emailVerification.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    await prisma.emailVerification.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('persists a hash-only verification record and marks it consumed', async () => {
    const sender = new CapturingSender();
    const service = new EmailVerificationService(
      new EmailVerificationRepository(prisma),
      sender,
      'https://jov3.example',
    );
    await service.issue({ purpose: 'FRIEND_LINK', entityId, email });

    const record = await prisma.emailVerification.findFirstOrThrow({ where: { email } });
    const rawToken = new URL(sender.messages[0]!.text.split('\n')[2]!).searchParams.get('token')!;
    expect(record.tokenHash).toHaveLength(64);
    expect(record.tokenHash).not.toContain(rawToken);
    await expect(service.verify(rawToken)).resolves.toMatchObject({ verified: true });
    await expect(service.verify(rawToken)).rejects.toMatchObject({
      code: 'INVALID_OR_EXPIRED_TOKEN',
    });
    await expect(
      prisma.emailVerification.findUnique({ where: { id: record.id } }),
    ).resolves.toMatchObject({
      consumedAt: expect.any(Date),
    });
  });
});
