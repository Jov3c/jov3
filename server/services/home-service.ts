import type { HomeEntry, HomeProfile, SiteProfile, SocialLink } from '../generated/prisma/client';

import type { EntryTargetType } from '../../shared/constants/home';
import type {
  HomeEntryInput,
  HomeProfileInput,
  SiteProfileInput,
  SocialLinkInput,
} from '../../shared/schemas/home';
import type { HomeRepository } from '../repositories/home-repository';

export const MAX_VISIBLE_HOME_ENTRIES = 8;

type AvatarMedia = { id: string; publicUrl: string; altText: string | null } | null;

export class HomeError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'HomeError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class HomeService {
  constructor(private readonly repository: HomeRepository) {}

  async getPublicHome() {
    const [siteProfile, homeProfile, entries, socialLinks] = await Promise.all([
      this.repository.findSiteProfile(),
      this.repository.findHomeProfile(),
      this.repository.listHomeEntries(),
      this.repository.listSocialLinks(),
    ]);
    if (!siteProfile || !homeProfile) {
      throw new HomeError(503, 'HOME_NOT_CONFIGURED', 'Home configuration is not available');
    }

    return {
      siteProfile: toSiteProfileDto(siteProfile),
      homeProfile: toHomeProfileDto(homeProfile, homeProfile.avatarMedia),
      entries: entries.filter((entry) => entry.visible).map(toHomeEntryDto),
      socialLinks: socialLinks.filter((link) => link.visible).map(toSocialLinkDto),
    };
  }

  async getAdminSiteProfile() {
    const siteProfile = await this.repository.findSiteProfile();
    if (!siteProfile)
      throw new HomeError(503, 'HOME_NOT_CONFIGURED', 'Site profile is not available');
    return toSiteProfileDto(siteProfile);
  }

  async updateSiteProfile(input: Partial<SiteProfileInput>) {
    const current = await this.repository.findSiteProfile();
    if (!current) throw new HomeError(503, 'HOME_NOT_CONFIGURED', 'Site profile is not available');
    const updated = await this.repository.updateSiteProfile(current.id, input);
    return toSiteProfileDto(updated);
  }

  async getAdminHomeProfile() {
    const homeProfile = await this.repository.findHomeProfile();
    if (!homeProfile)
      throw new HomeError(503, 'HOME_NOT_CONFIGURED', 'Home profile is not available');
    return toHomeProfileDto(homeProfile, homeProfile.avatarMedia);
  }

  async updateHomeProfile(input: Partial<HomeProfileInput>) {
    if (input.avatarMediaId) {
      const media = await this.repository.findMedia(input.avatarMediaId);
      if (!media) throw new HomeError(400, 'MEDIA_NOT_FOUND', 'Avatar media asset was not found');
    }
    const current = await this.repository.findHomeProfile();
    if (!current) throw new HomeError(503, 'HOME_NOT_CONFIGURED', 'Home profile is not available');
    const updated = await this.repository.updateHomeProfile(current.id, input);
    return toHomeProfileDto(updated, updated.avatarMedia);
  }

  async listAdminEntries() {
    return (await this.repository.listHomeEntries()).map(toHomeEntryDto);
  }

  async createEntry(input: HomeEntryInput) {
    validateEntryUrl(input.targetType, input.url);
    await this.ensureVisibleEntryCapacity(input.visible);
    return toHomeEntryDto(await this.repository.createHomeEntry(normalizeEntry(input)));
  }

  async updateEntry(id: string, input: Partial<HomeEntryInput>) {
    const current = await this.repository.findHomeEntry(id);
    if (!current) throw new HomeError(404, 'HOME_ENTRY_NOT_FOUND', 'Home entry not found');
    const next = { ...current, ...input };
    validateEntryUrl(next.targetType, next.url);
    await this.ensureVisibleEntryCapacity(next.visible && !current.visible);
    return toHomeEntryDto(await this.repository.updateHomeEntry(id, normalizeEntry(input)));
  }

  async deleteEntry(id: string) {
    const current = await this.repository.findHomeEntry(id);
    if (!current) throw new HomeError(404, 'HOME_ENTRY_NOT_FOUND', 'Home entry not found');
    await this.repository.deleteHomeEntry(id);
    return { deleted: true };
  }

  async listAdminSocialLinks() {
    return (await this.repository.listSocialLinks()).map(toSocialLinkDto);
  }

  async createSocialLink(input: SocialLinkInput) {
    validateSocialUrl(input.url);
    return toSocialLinkDto(await this.repository.createSocialLink(normalizeSocialLink(input)));
  }

  async updateSocialLink(id: string, input: Partial<SocialLinkInput>) {
    const current = await this.repository.findSocialLink(id);
    if (!current) throw new HomeError(404, 'SOCIAL_LINK_NOT_FOUND', 'Social link not found');
    validateSocialUrl(input.url ?? current.url);
    return toSocialLinkDto(await this.repository.updateSocialLink(id, normalizeSocialLink(input)));
  }

  async deleteSocialLink(id: string) {
    const current = await this.repository.findSocialLink(id);
    if (!current) throw new HomeError(404, 'SOCIAL_LINK_NOT_FOUND', 'Social link not found');
    await this.repository.deleteSocialLink(id);
    return { deleted: true };
  }

  private async ensureVisibleEntryCapacity(willAddVisibleEntry: boolean) {
    if (!willAddVisibleEntry) return;
    const visibleCount = await this.repository.countVisibleHomeEntries();
    if (visibleCount >= MAX_VISIBLE_HOME_ENTRIES) {
      throw new HomeError(
        409,
        'HOME_ENTRY_LIMIT_REACHED',
        `最多只能有 ${MAX_VISIBLE_HOME_ENTRIES} 个可见首页入口`,
      );
    }
  }
}

export function homeApiError(error: unknown) {
  if (error instanceof HomeError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function toSiteProfileDto(profile: SiteProfile) {
  return {
    id: profile.id,
    siteTitle: profile.siteTitle,
    siteDescription: profile.siteDescription,
    foundedAt: profile.foundedAt.toISOString().slice(0, 10),
    publicContactEmail: profile.publicContactEmail,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function toHomeProfileDto(profile: HomeProfile, avatarMedia: AvatarMedia) {
  return {
    id: profile.id,
    nickname: profile.nickname,
    role: profile.role,
    intro: profile.intro,
    avatarMediaId: profile.avatarMediaId,
    avatar: avatarMedia
      ? { id: avatarMedia.id, url: avatarMedia.publicUrl, altText: avatarMedia.altText }
      : null,
    statusText: profile.statusText,
    statusVisible: profile.statusVisible,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function toHomeEntryDto(entry: HomeEntry) {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    icon: entry.icon,
    url: entry.url,
    targetType: entry.targetType as EntryTargetType,
    openNewTab: entry.openNewTab,
    sortOrder: entry.sortOrder,
    visible: entry.visible,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function toSocialLinkDto(link: SocialLink) {
  return {
    id: link.id,
    name: link.name,
    icon: link.icon,
    url: link.url,
    sortOrder: link.sortOrder,
    visible: link.visible,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

function normalizeEntry<T extends Partial<HomeEntryInput>>(input: T) {
  return {
    ...input,
    ...(input.icon === undefined ? {} : { icon: input.icon?.trim() || null }),
  };
}

function normalizeSocialLink<T extends Partial<SocialLinkInput>>(input: T) {
  return {
    ...input,
    ...(input.icon === undefined ? {} : { icon: input.icon?.trim() || null }),
  };
}

function validateEntryUrl(targetType: EntryTargetType, value: string) {
  if (targetType === 'INTERNAL') {
    if (!value.startsWith('/') || value.startsWith('//')) {
      throw new HomeError(400, 'INVALID_HOME_URL', 'Internal entries must use a site path');
    }
    return;
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol');
  } catch {
    throw new HomeError(400, 'INVALID_HOME_URL', 'External entries must use an http or https URL');
  }
}

function validateSocialUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) throw new Error('protocol');
  } catch {
    throw new HomeError(400, 'INVALID_SOCIAL_URL', 'Social links must use a safe URL');
  }
}
