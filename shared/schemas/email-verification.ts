import { z } from 'zod';

import { emailVerificationPurposeSchema } from '../constants/email-verification';

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(20).max(200),
});

export const resendEmailVerificationSchema = z.object({
  purpose: emailVerificationPurposeSchema,
  entityId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(254),
});

export type ResendEmailVerificationInput = z.infer<typeof resendEmailVerificationSchema>;
