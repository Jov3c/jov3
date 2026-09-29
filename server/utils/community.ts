import { CommunityRepository } from '../repositories/community-repository';
import { CommunityService } from '../services/community-service';
import type { EmailVerificationService } from '../services/email-verification-service';
import { usePrisma } from './prisma';

export function useCommunityService(options?: { emailVerification?: EmailVerificationService }) {
  return new CommunityService(new CommunityRepository(usePrisma()), options?.emailVerification);
}
