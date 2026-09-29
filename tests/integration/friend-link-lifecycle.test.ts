import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EmailVerificationRepository } from '../../server/repositories/email-verification-repository';
import { FriendLinkRepository } from '../../server/repositories/friend-link-repository';
import { EmailVerificationService } from '../../server/services/email-verification-service';
import { FriendLinkService } from '../../server/services/friend-link-service';
import { createPrismaClient } from '../../server/utils/prisma';
import type { EmailMessage, EmailSender } from '../../server/utils/smtp';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);
const suffix = `${Date.now()}`;
const applicationEmail = `stage08-${suffix}@example.com`;
const rejectedEmail = `stage08-rejected-${suffix}@example.com`;

class CapturingSender implements EmailSender {
  messages: EmailMessage[] = [];

  async send(message: EmailMessage) {
    this.messages.push(message);
  }
}

describe('friend link application lifecycle', () => {
  const sender = new CapturingSender();
  const verifier = new EmailVerificationService(
    new EmailVerificationRepository(prisma),
    sender,
    'https://jov3.example',
  );
  const service = new FriendLinkService(new FriendLinkRepository(prisma), verifier);
  let approvedApplicationId = '';
  let rejectedApplicationId = '';
  let adminLinkId = '';

  beforeAll(async () => {
    await prisma.friendLink.deleteMany({
      where: { contactEmail: { in: [applicationEmail, rejectedEmail] } },
    });
    await prisma.emailVerification.deleteMany({
      where: { email: { in: [applicationEmail, rejectedEmail] } },
    });
  });

  afterAll(async () => {
    await prisma.friendLink.deleteMany({
      where: {
        OR: [
          { contactEmail: { in: [applicationEmail, rejectedEmail] } },
          ...(adminLinkId ? [{ id: adminLinkId }] : []),
        ],
      },
    });
    await prisma.emailVerification.deleteMany({
      where: { email: { in: [applicationEmail, rejectedEmail] } },
    });
    await prisma.$disconnect();
  });

  it('keeps an unverified application out of review and public results', async () => {
    const submitted = await service.apply(
      {
        websiteName: 'Stage Eight',
        websiteUrl: 'https://stage-eight.example',
        logoMediaId: null,
        description: 'A link used to verify the friend link workflow.',
        contactEmail: applicationEmail,
        note: 'Please review this application.',
      },
      'a'.repeat(64),
    );
    approvedApplicationId = submitted.id;

    const pendingEmail = await service.listAdminLinks({
      page: 1,
      pageSize: 50,
      status: 'PENDING_EMAIL',
    });
    expect(pendingEmail.items.some((item) => item.id === approvedApplicationId)).toBe(true);
    const pendingReview = await service.listAdminLinks({
      page: 1,
      pageSize: 50,
      status: 'PENDING_REVIEW',
    });
    expect(pendingReview.items.some((item) => item.id === approvedApplicationId)).toBe(false);
    const publicLinks = await service.listPublicLinks({ page: 1, pageSize: 50 });
    expect(publicLinks.items.some((item) => item.id === approvedApplicationId)).toBe(false);
  });

  it('moves a verified application to review and publishes it only after approval', async () => {
    const token = new URL(sender.messages.at(-1)!.text.split('\n')[2]!).searchParams.get('token')!;
    const verified = await verifier.verify(token);
    await expect(service.completeEmailVerification(verified)).resolves.toMatchObject({
      status: 'PENDING_REVIEW',
    });

    const review = await service.listAdminLinks({
      page: 1,
      pageSize: 50,
      status: 'PENDING_REVIEW',
    });
    const application = review.items.find((item) => item.id === approvedApplicationId)!;
    expect(application.contactEmail).toBe(applicationEmail);
    expect(application.applicantNote).toBe('Please review this application.');

    const beforeApproval = await service.listPublicLinks({ page: 1, pageSize: 50 });
    expect(beforeApproval.items.some((item) => item.id === approvedApplicationId)).toBe(false);

    await service.approve(approvedApplicationId);
    const afterApproval = await service.listPublicLinks({ page: 1, pageSize: 50 });
    const published = afterApproval.items.find((item) => item.id === approvedApplicationId)!;
    expect(published.name).toBe('Stage Eight');
    expect(published).not.toHaveProperty('contactEmail');
    expect(published).not.toHaveProperty('applicantNote');
  });

  it('rejects a verified application and publishes an administrator link directly', async () => {
    const submitted = await service.apply(
      {
        websiteName: 'Rejected Stage Eight',
        websiteUrl: 'https://rejected-stage-eight.example',
        logoMediaId: null,
        description: 'This application should not become public.',
        contactEmail: rejectedEmail,
        note: '',
      },
      'b'.repeat(64),
    );
    rejectedApplicationId = submitted.id;
    const token = new URL(sender.messages.at(-1)!.text.split('\n')[2]!).searchParams.get('token')!;
    await service.completeEmailVerification(await verifier.verify(token));
    await service.reject(rejectedApplicationId);

    const rejected = await service.listAdminLinks({ page: 1, pageSize: 50, status: 'REJECTED' });
    expect(rejected.items.some((item) => item.id === rejectedApplicationId)).toBe(true);
    const publicAfterReject = await service.listPublicLinks({ page: 1, pageSize: 50 });
    expect(publicAfterReject.items.some((item) => item.id === rejectedApplicationId)).toBe(false);

    const direct = await service.createAdmin({
      name: 'Admin Stage Eight',
      url: 'https://admin-stage-eight.example',
      logoMediaId: null,
      description: 'Added directly by the administrator.',
      sortOrder: 900,
      visible: true,
      status: 'PUBLISHED',
    });
    adminLinkId = direct.id;
    expect(direct.source).toBe('ADMIN');
    expect(direct.status).toBe('PUBLISHED');
    const publicAfterDirect = await service.listPublicLinks({ page: 1, pageSize: 50 });
    expect(publicAfterDirect.items.some((item) => item.id === adminLinkId)).toBe(true);
  });
});
