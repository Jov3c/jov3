import { EmailVerificationRepository } from '../repositories/email-verification-repository';
import { EmailVerificationService } from '../services/email-verification-service';
import { usePrisma } from './prisma';

export function useEmailVerificationService(options?: {
  sender?: ConstructorParameters<typeof EmailVerificationService>[1];
  publicSiteUrl?: string;
}) {
  return new EmailVerificationService(
    new EmailVerificationRepository(usePrisma()),
    options?.sender,
    options?.publicSiteUrl,
  );
}
