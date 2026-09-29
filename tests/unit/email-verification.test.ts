import { randomUUID } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import type {
  EmailVerificationCreateInput,
  EmailVerificationRepositoryContract,
} from '../../server/repositories/email-verification-repository';
import {
  EMAIL_VERIFICATION_TTL_MS,
  EmailVerificationError,
  EmailVerificationService,
} from '../../server/services/email-verification-service';
import { hashVerificationToken } from '../../server/utils/security';
import type { EmailMessage, EmailSender } from '../../server/utils/smtp';

interface VerificationRecord extends EmailVerificationCreateInput {
  id: string;
  consumedAt: Date | null;
}

class MemoryVerificationRepository implements EmailVerificationRepositoryContract {
  records: VerificationRecord[] = [];

  async invalidateActive(input: { purpose: string; entityId: string; email: string; now: Date }) {
    for (const record of this.records) {
      if (
        record.purpose === input.purpose &&
        record.entityId === input.entityId &&
        record.email === input.email &&
        !record.consumedAt
      ) {
        record.consumedAt = input.now;
      }
    }
  }

  async create(input: EmailVerificationCreateInput) {
    const record = { ...input, id: randomUUID(), consumedAt: null };
    this.records.push(record);
    return record;
  }

  async delete(id: string) {
    this.records = this.records.filter((record) => record.id !== id);
  }

  async consume(tokenHash: string, now: Date) {
    const record = this.records.find(
      (entry) => entry.tokenHash === tokenHash && !entry.consumedAt && entry.expiresAt > now,
    );
    if (!record) return null;
    record.consumedAt = now;
    return record;
  }
}

class CapturingSender implements EmailSender {
  messages: EmailMessage[] = [];

  async send(message: EmailMessage) {
    this.messages.push(message);
  }
}

describe('email verification service', () => {
  it('stores only a hash, invalidates old tokens, and consumes a token once', async () => {
    const repository = new MemoryVerificationRepository();
    const sender = new CapturingSender();
    const service = new EmailVerificationService(repository, sender, 'https://jov3.example');
    const now = new Date('2026-09-29T12:00:00.000Z');

    await service.issue({
      purpose: 'MESSAGE',
      entityId: '11111111-1111-4111-8111-111111111111',
      email: 'person@example.com',
      now,
    });
    const firstUrl = new URL(sender.messages[0]!.text.split('\n')[2]!);
    const firstToken = firstUrl.searchParams.get('token')!;
    expect(repository.records[0]!.tokenHash).toBe(hashVerificationToken(firstToken));
    expect(repository.records[0]!.tokenHash).not.toContain(firstToken);

    await service.issue({
      purpose: 'MESSAGE',
      entityId: '11111111-1111-4111-8111-111111111111',
      email: 'person@example.com',
      now: new Date(now.getTime() + 1_000),
    });
    expect(repository.records[0]!.consumedAt).not.toBeNull();

    await expect(service.verify(firstToken, new Date(now.getTime() + 2_000))).rejects.toMatchObject(
      {
        code: 'INVALID_OR_EXPIRED_TOKEN',
      },
    );
    const secondUrl = new URL(sender.messages[1]!.text.split('\n')[2]!);
    const secondToken = secondUrl.searchParams.get('token')!;
    await expect(
      service.verify(secondToken, new Date(now.getTime() + 2_000)),
    ).resolves.toMatchObject({
      verified: true,
      purpose: 'MESSAGE',
    });
    await expect(
      service.verify(secondToken, new Date(now.getTime() + 3_000)),
    ).rejects.toBeInstanceOf(EmailVerificationError);
  });

  it('rejects expired tokens and never exposes the raw token in failure logs', async () => {
    const repository = new MemoryVerificationRepository();
    const sender = new CapturingSender();
    const service = new EmailVerificationService(repository, sender, 'https://jov3.example');
    const now = new Date('2026-09-29T12:00:00.000Z');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await service.issue({
      purpose: 'COMMENT',
      entityId: '22222222-2222-4222-8222-222222222222',
      email: 'commenter@example.com',
      now,
    });
    const token = new URL(sender.messages[0]!.text.split('\n')[2]!).searchParams.get('token')!;
    await expect(
      service.verify(token, new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS + 1)),
    ).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    expect(warn.mock.calls.flat().join(' ')).not.toContain(token);
    warn.mockRestore();
  });
});
