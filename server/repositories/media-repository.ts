import type { PrismaClient } from '../generated/prisma/client';
import type { MediaListQuery } from '../../shared/schemas/media';

export class MediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: {
    originalName: string;
    storedName: string;
    mimeType: string;
    sizeBytes: bigint;
    width?: number;
    height?: number;
    storagePath: string;
    publicUrl: string;
    sha256: string;
    altText: string | null;
  }) {
    return this.prisma.mediaAsset.create({ data: input });
  }

  async list(query: MediaListQuery) {
    const where = query.q
      ? {
          OR: [
            { originalName: { contains: query.q, mode: 'insensitive' as const } },
            { altText: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }

  updateAltText(id: string, altText: string | null) {
    return this.prisma.mediaAsset.update({ where: { id }, data: { altText } });
  }

  delete(id: string) {
    return this.prisma.mediaAsset.delete({ where: { id } });
  }

  async countReferences(id: string) {
    const [
      avatarReferences,
      coverReferences,
      friendLinkReferences,
      cvPortraitReferences,
      timelineMediaReferences,
    ] = await Promise.all([
      this.prisma.homeProfile.count({ where: { avatarMediaId: id } }),
      this.prisma.post.count({ where: { coverMediaId: id } }),
      this.prisma.friendLink.count({ where: { logoMediaId: id } }),
      this.prisma.cvProfile.count({ where: { portraitMediaId: id } }),
      this.prisma.timelineEntryMedia.count({ where: { mediaId: id } }),
    ]);
    return (
      avatarReferences +
      coverReferences +
      friendLinkReferences +
      cvPortraitReferences +
      timelineMediaReferences
    );
  }
}
