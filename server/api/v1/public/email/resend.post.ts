import { getRequestIP, readBody, setResponseHeader } from 'h3';

import { resendEmailVerificationSchema } from '../../../../../shared/schemas/email-verification';
import { apiError } from '../../../../utils/api-response';
import { EmailVerificationError } from '../../../../services/email-verification-service';
import { createSmtpEmailSender, SmtpConfigError } from '../../../../utils/smtp';
import { useEmailVerificationService } from '../../../../utils/email-verification';
import { hashVerificationToken } from '../../../../utils/security';
import { SlidingWindowRateLimiter } from '../../../../utils/rate-limit';

const resendLimiter = new SlidingWindowRateLimiter({
  limit: 3,
  windowMs: 15 * 60 * 1_000,
  maxKeys: 20_000,
});

export default defineEventHandler(async (event) => {
  const parsed = resendEmailVerificationSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Verification request is invalid',
      parsed.error.flatten(),
    );
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  const limit = resendLimiter.consume(`${hashVerificationToken(parsed.data.email)}:${ip}`);
  if (!limit.allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(limit.retryAfterMs / 1_000));
    return apiError(event, 429, 'RATE_LIMITED', 'Too many verification emails requested');
  }

  try {
    const { sender, config } = createSmtpEmailSender();
    await useEmailVerificationService({ sender, publicSiteUrl: config.publicSiteUrl }).issue(
      parsed.data,
    );
    return { data: { sent: true } };
  } catch (error) {
    if (error instanceof SmtpConfigError) {
      return apiError(event, 503, error.code, 'Email delivery is not configured');
    }
    if (error instanceof EmailVerificationError) {
      return apiError(event, error.statusCode, error.code, error.message);
    }
    throw error;
  }
});
