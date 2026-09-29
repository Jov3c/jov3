import { FriendLinkRepository } from '../repositories/friend-link-repository';
import { FriendLinkService } from '../services/friend-link-service';
import type { EmailVerificationService } from '../services/email-verification-service';
import { usePrisma } from './prisma';

export function useFriendLinkService(options?: { emailVerification?: EmailVerificationService }) {
  return new FriendLinkService(new FriendLinkRepository(usePrisma()), options?.emailVerification);
}
