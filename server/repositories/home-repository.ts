import type { PrismaClient } from '../generated/prisma/client';

import type {
  HomeEntryInput,
  HomeProfileInput,
  SiteProfileInput,
  SocialLinkInput,
} from '../../shared/schemas/home';

export class HomeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findSiteProfile() {
    return this.prisma.siteProfile.findFirst();
  }

  updateSiteProfile(id: string, input: Partial<SiteProfileInput>) {
    return this.prisma.siteProfile.update({ where: { id }, data: toSiteProfileData(input) });
  }

  findHomeProfile() {
    return this.prisma.homeProfile.findFirst({
      include: { avatarMedia: { select: { id: true, publicUrl: true, altText: true } } },
    });
  }

  updateHomeProfile(id: string, input: Partial<HomeProfileInput>) {
    return this.prisma.homeProfile.update({
      where: { id },
      data: toHomeProfileData(input),
      include: { avatarMedia: { select: { id: true, publicUrl: true, altText: true } } },
    });
  }

  findMedia(id: string) {
    return this.prisma.mediaAsset.findUnique({
      where: { id },
      select: { id: true, publicUrl: true, altText: true },
    });
  }

  listHomeEntries() {
    return this.prisma.homeEntry.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  countVisibleHomeEntries() {
    return this.prisma.homeEntry.count({ where: { visible: true } });
  }

  createHomeEntry(input: HomeEntryInput) {
    return this.prisma.homeEntry.create({ data: input });
  }

  updateHomeEntry(id: string, input: Partial<HomeEntryInput>) {
    return this.prisma.homeEntry.update({ where: { id }, data: input });
  }

  findHomeEntry(id: string) {
    return this.prisma.homeEntry.findUnique({ where: { id } });
  }

  deleteHomeEntry(id: string) {
    return this.prisma.homeEntry.delete({ where: { id } });
  }

  listSocialLinks() {
    return this.prisma.socialLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  createSocialLink(input: SocialLinkInput) {
    return this.prisma.socialLink.create({ data: input });
  }

  updateSocialLink(id: string, input: Partial<SocialLinkInput>) {
    return this.prisma.socialLink.update({ where: { id }, data: input });
  }

  findSocialLink(id: string) {
    return this.prisma.socialLink.findUnique({ where: { id } });
  }

  deleteSocialLink(id: string) {
    return this.prisma.socialLink.delete({ where: { id } });
  }
}

function toSiteProfileData(input: Partial<SiteProfileInput>) {
  return {
    ...(input.siteTitle === undefined ? {} : { siteTitle: input.siteTitle }),
    ...(input.siteDescription === undefined ? {} : { siteDescription: input.siteDescription }),
    ...(input.foundedAt === undefined
      ? {}
      : { foundedAt: new Date(`${input.foundedAt}T00:00:00.000Z`) }),
    ...(input.publicContactEmail === undefined
      ? {}
      : { publicContactEmail: input.publicContactEmail || null }),
  };
}

function toHomeProfileData(input: Partial<HomeProfileInput>) {
  return {
    ...(input.nickname === undefined ? {} : { nickname: input.nickname }),
    ...(input.role === undefined ? {} : { role: input.role }),
    ...(input.intro === undefined ? {} : { intro: input.intro }),
    ...(input.avatarMediaId === undefined ? {} : { avatarMediaId: input.avatarMediaId }),
    ...(input.statusText === undefined ? {} : { statusText: input.statusText || null }),
    ...(input.statusVisible === undefined ? {} : { statusVisible: input.statusVisible }),
  };
}
