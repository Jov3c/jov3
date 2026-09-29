import { readBody } from 'h3';

import { verifyEmailSchema } from '../../../../../shared/schemas/email-verification';
import { apiError } from '../../../../utils/api-response';
import { EmailVerificationError } from '../../../../services/email-verification-service';
import { CommunityError } from '../../../../services/community-service';
import { FriendLinkError } from '../../../../services/friend-link-service';
import { useEmailVerificationService } from '../../../../utils/email-verification';
import { useCommunityService } from '../../../../utils/community';
import { useFriendLinkService } from '../../../../utils/friend-links';

export default defineEventHandler(async (event) => {
  const parsed = verifyEmailSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Verification token is invalid',
      parsed.error.flatten(),
    );
  }

  try {
    const result = await useEmailVerificationService().verify(parsed.data.token);
    if (result.purpose === 'COMMENT' || result.purpose === 'MESSAGE') {
      await useCommunityService().completeEmailVerification(result);
    }
    if (result.purpose === 'FRIEND_LINK') {
      await useFriendLinkService().completeEmailVerification(result);
    }
    return { data: { verified: true } };
  } catch (error) {
    if (error instanceof EmailVerificationError) {
      return apiError(event, error.statusCode, error.code, error.message);
    }
    if (error instanceof CommunityError) {
      return apiError(event, error.statusCode, error.code, error.message);
    }
    if (error instanceof FriendLinkError) {
      return apiError(event, error.statusCode, error.code, error.message);
    }
    throw error;
  }
});
