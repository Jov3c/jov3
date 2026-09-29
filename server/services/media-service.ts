import type { MediaAsset } from '../generated/prisma/client';

import type { MediaCategory } from '../../shared/constants/media';
import type { MediaListQuery, MediaUpdateInput } from '../../shared/schemas/media';
import type { MediaRepository } from '../repositories/media-repository';
import {
  type DetectedImage,
  MediaUploadError,
  removeStoredMedia,
  storeMediaFile,
  validateImageUpload,
} from '../utils/media-storage';

export interface MediaStorageContract {
  store(
    buffer: Buffer,
    category: MediaCategory,
    detected: DetectedImage,
    now?: Date,
  ): Promise<Awaited<ReturnType<typeof storeMediaFile>>>;
  remove(storagePath: string): Promise<void>;
}

export class FileSystemMediaStorage implements MediaStorageContract {
  store(buffer: Buffer, category: MediaCategory, detected: DetectedImage, now?: Date) {
    return storeMediaFile(buffer, category, detected, now);
  }

  remove(storagePath: string) {
    return removeStoredMedia(storagePath);
  }
}

export class MediaError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'MediaError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface MediaDto {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  storagePath: string;
  publicUrl: string;
  sha256: string | null;
  altText: string | null;
  createdAt: string;
  referenceCount: number;
  isReferenced: boolean;
}

export class MediaService {
  constructor(
    private readonly repository: MediaRepository,
    private readonly storage: MediaStorageContract = new FileSystemMediaStorage(),
  ) {}

  async upload(input: {
    buffer: Buffer;
    originalName: string;
    category: MediaCategory;
    altText?: string;
    now?: Date;
  }) {
    const detected = validateImageUpload(input.buffer, input.originalName);
    const stored = await this.storage.store(input.buffer, input.category, detected, input.now);

    try {
      const media = await this.repository.create({
        originalName: detected.originalName,
        storedName: stored.storedName,
        mimeType: stored.mimeType,
        sizeBytes: BigInt(input.buffer.length),
        width: stored.width,
        height: stored.height,
        storagePath: stored.storagePath,
        publicUrl: stored.publicUrl,
        sha256: stored.sha256,
        altText: input.altText?.trim() || null,
      });
      return this.toDto(media, 0);
    } catch (error) {
      await this.storage.remove(stored.storagePath).catch(() => undefined);
      throw error;
    }
  }

  async list(query: MediaListQuery) {
    const result = await this.repository.list(query);
    const items = await Promise.all(
      result.items.map(async (item) =>
        this.toDto(item, await this.repository.countReferences(item.id)),
      ),
    );
    return { items, total: result.total };
  }

  async update(id: string, input: MediaUpdateInput) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new MediaError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
    const media = await this.repository.updateAltText(id, input.altText?.trim() || null);
    return this.toDto(media, await this.repository.countReferences(id));
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new MediaError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
    const referenceCount = await this.repository.countReferences(id);
    if (referenceCount > 0) {
      throw new MediaError(409, 'MEDIA_IN_USE', 'Media asset is still referenced by content');
    }

    await this.repository.delete(id);
    try {
      await this.storage.remove(existing.storagePath);
    } catch (error) {
      console.error('[media] failed to remove stored file after database deletion', {
        mediaId: id,
        errorCode: getErrorCode(error),
      });
    }
    return { deleted: true };
  }

  private toDto(media: MediaAsset, referenceCount: number): MediaDto {
    return {
      id: media.id,
      originalName: media.originalName,
      storedName: media.storedName,
      mimeType: media.mimeType,
      sizeBytes: Number(media.sizeBytes),
      width: media.width,
      height: media.height,
      storagePath: media.storagePath,
      publicUrl: media.publicUrl,
      sha256: media.sha256,
      altText: media.altText,
      createdAt: media.createdAt.toISOString(),
      referenceCount,
      isReferenced: referenceCount > 0,
    };
  }
}

export function mediaApiError(error: unknown) {
  if (error instanceof MediaUploadError || error instanceof MediaError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function getErrorCode(error: unknown) {
  return error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN';
}
