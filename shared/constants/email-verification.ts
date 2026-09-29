import { z } from 'zod';

export const EMAIL_VERIFICATION_PURPOSES = ['COMMENT', 'MESSAGE', 'FRIEND_LINK'] as const;

export type EmailVerificationPurpose = (typeof EMAIL_VERIFICATION_PURPOSES)[number];

export const emailVerificationPurposeSchema = z.enum(EMAIL_VERIFICATION_PURPOSES);
