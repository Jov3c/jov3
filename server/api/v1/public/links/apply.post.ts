import { readBody, setResponseHeader } from 'h3';

import { friendLinkApplySchema } from '../../../../../shared/schemas/friend-links';
import { EmailVerificationError } from '../../../../services/email-verification-service';
import { FriendLinkError, friendLinkApiError } from '../../../../services/friend-link-service';
import { apiError } from '../../../../utils/api-response';
import { useEmailVerificationService } from '../../../../utils/email-verification';
import { useFriendLinkService } from '../../../../utils/friend-links';
import { getVisitorIpHash } from '../../../../utils/visitor';
import { createSmtpEmailSender, SmtpConfigError } from '../../../../utils/smtp';
import { SlidingWindowRateLimiter } from '../../../../utils/rate-limit';

const friendLinkLimiter = new SlidingWindowRateLimiter({
  limit: 3,
  windowMs: 60 * 60 * 1_000,
  maxKeys: 20_000,
});

export default defineEventHandler(async (event) => {
  const parsed = friendLinkApplySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Friend link fields are invalid',
      parsed.error.flatten(),
    );
  }

  const limit = friendLinkLimiter.consume(getVisitorIpHash(event));
  if (!limit.allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(limit.retryAfterMs / 1_000));
    return apiError(event, 429, 'RATE_LIMITED', 'Too many friend link applications submitted');
  }

  try {
    const { sender, config } = createSmtpEmailSender();
    const result = await useFriendLinkService({
      emailVerification: useEmailVerificationService({
        sender,
        publicSiteUrl: config.publicSiteUrl,
      }),
    }).apply(parsed.data, getVisitorIpHash(event));
    return { data: result };
  } catch (error) {
    if (error instanceof SmtpConfigError) {
      return apiError(event, 503, error.code, 'Email delivery is not configured');
    }
    if (error instanceof EmailVerificationError || error instanceof FriendLinkError) {
      const mapped = friendLinkApiError(error);
      if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
      return apiError(event, error.statusCode, error.code, error.message);
    }
    throw error;
  }
});
