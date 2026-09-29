import { readBody } from 'h3';

import { verifyEmailSchema } from '../../../../../shared/schemas/email-verification';
import { apiError } from '../../../../utils/api-response';
import { EmailVerificationError } from '../../../../services/email-verification-service';
import { useEmailVerificationService } from '../../../../utils/email-verification';

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
    await useEmailVerificationService().verify(parsed.data.token);
    return { data: { verified: true } };
  } catch (error) {
    if (error instanceof EmailVerificationError) {
      return apiError(event, error.statusCode, error.code, error.message);
    }
    throw error;
  }
});
