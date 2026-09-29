import { getRouterParam, readBody, setResponseHeader } from 'h3';

import { commentCreateSchema } from '../../../../../../shared/schemas/community';
import { EmailVerificationError } from '../../../../../services/email-verification-service';
import { CommunityError, communityApiError } from '../../../../../services/community-service';
import { apiError } from '../../../../../utils/api-response';
import { useCommunityService } from '../../../../../utils/community';
import { useEmailVerificationService } from '../../../../../utils/email-verification';
import { getVisitorIpHash } from '../../../../../utils/visitor';
import { createSmtpEmailSender, SmtpConfigError } from '../../../../../utils/smtp';
import { SlidingWindowRateLimiter } from '../../../../../utils/rate-limit';

const commentLimiter = new SlidingWindowRateLimiter({
  limit: 5,
  windowMs: 60 * 1_000,
  maxKeys: 20_000,
});

export default defineEventHandler(async (event) => {
  const parsed = commentCreateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Comment fields are invalid',
      parsed.error.flatten(),
    );
  }

  const limit = commentLimiter.consume(getVisitorIpHash(event));
  if (!limit.allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(limit.retryAfterMs / 1_000));
    return apiError(event, 429, 'RATE_LIMITED', 'Too many comments submitted');
  }

  const slug = getRouterParam(event, 'slug')?.trim().toLowerCase();
  if (!slug) return apiError(event, 400, 'INVALID_POST_SLUG', 'Post slug is required');

  try {
    const { sender, config } = createSmtpEmailSender();
    const result = await useCommunityService({
      emailVerification: useEmailVerificationService({
        sender,
        publicSiteUrl: config.publicSiteUrl,
      }),
    }).submitComment(slug, parsed.data, getVisitorIpHash(event));
    return { data: result };
  } catch (error) {
    if (error instanceof SmtpConfigError) {
      return apiError(event, 503, error.code, 'Email delivery is not configured');
    }
    if (error instanceof EmailVerificationError || error instanceof CommunityError) {
      const mapped = communityApiError(error);
      if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
      return apiError(event, error.statusCode, error.code, error.message);
    }
    throw error;
  }
});
