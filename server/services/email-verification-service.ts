import { createVerificationToken, hashVerificationToken } from '../utils/security';
import type { EmailSender } from '../utils/smtp';
import type { EmailVerificationRepositoryContract } from '../repositories/email-verification-repository';
import type { EmailVerificationPurpose } from '../../shared/constants/email-verification';

export const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1_000;

export class EmailVerificationError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'EmailVerificationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class EmailVerificationService {
  constructor(
    private readonly repository: EmailVerificationRepositoryContract,
    private readonly sender?: EmailSender,
    private readonly publicSiteUrl?: string,
  ) {}

  async issue(input: {
    purpose: EmailVerificationPurpose;
    entityId: string;
    email: string;
    now?: Date;
  }) {
    if (!this.sender || !this.publicSiteUrl) {
      throw new EmailVerificationError(
        503,
        'EMAIL_NOT_CONFIGURED',
        'Email delivery is not configured',
      );
    }

    const now = input.now ?? new Date();
    const email = input.email.trim().toLowerCase();
    const token = createVerificationToken();
    const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS);

    await this.repository.invalidateActive({
      purpose: input.purpose,
      entityId: input.entityId,
      email,
      now,
    });
    const record = await this.repository.create({
      purpose: input.purpose,
      entityId: input.entityId,
      email,
      tokenHash: hashVerificationToken(token),
      expiresAt,
    });

    const verificationUrl = `${this.publicSiteUrl.replace(/\/$/, '')}/verify/email?token=${encodeURIComponent(token)}`;
    try {
      await this.sender.send({
        to: email,
        subject: 'Verify your email for Jov3',
        text: [
          'Please verify your email address for Jov3.',
          '',
          verificationUrl,
          '',
          'This link expires in 30 minutes and can only be used once.',
        ].join('\n'),
        html: `<p>Please verify your email address for Jov3.</p><p><a href="${escapeHtml(verificationUrl)}">Verify email</a></p><p>This link expires in 30 minutes and can only be used once.</p>`,
      });
    } catch (error) {
      await this.repository.delete(record.id).catch(() => undefined);
      logEmailFailure('delivery', input.purpose, error);
      throw new EmailVerificationError(
        503,
        'EMAIL_DELIVERY_FAILED',
        'The verification email could not be sent',
      );
    }

    return { expiresAt };
  }

  async verify(token: string, now = new Date()) {
    const record = await this.repository.consume(hashVerificationToken(token), now);
    if (!record) {
      logEmailFailure(
        'verification',
        undefined,
        new EmailVerificationError(400, 'INVALID_TOKEN', 'Invalid token'),
      );
      throw new EmailVerificationError(
        400,
        'INVALID_OR_EXPIRED_TOKEN',
        'This verification link is invalid or expired',
      );
    }

    return {
      verified: true,
      purpose: record.purpose as EmailVerificationPurpose,
      entityId: record.entityId,
      verifiedAt: now,
    };
  }
}

export function logEmailFailure(
  kind: 'delivery' | 'verification',
  purpose: string | undefined,
  error: unknown,
) {
  console.warn(`[email] verification ${kind} failed`, {
    purpose: purpose ?? 'unknown',
    errorCode: getSafeErrorCode(error),
  });
}

function getSafeErrorCode(error: unknown) {
  if (error instanceof EmailVerificationError) return error.code;
  if (error instanceof Error && 'code' in error) return String(error.code);
  return 'UNKNOWN';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}
