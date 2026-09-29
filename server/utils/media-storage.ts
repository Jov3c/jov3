import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import type { MediaCategory } from '../../shared/constants/media';

export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_DIMENSION = 4096;

export interface DetectedImage {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  extension: 'jpg' | 'png' | 'webp' | 'gif';
  width?: number;
  height?: number;
}

export interface StoredMediaFile {
  storedName: string;
  storagePath: string;
  publicUrl: string;
  sha256: string;
  mimeType: DetectedImage['mimeType'];
  width?: number;
  height?: number;
}

export class MediaUploadError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'MediaUploadError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function getMediaStorageRoot(env: NodeJS.ProcessEnv = process.env) {
  const configuredRoot = env.MEDIA_STORAGE_ROOT?.trim();
  const root = configuredRoot || join(process.cwd(), '.data', 'uploads');
  return resolve(isAbsolute(root) ? root : join(process.cwd(), root));
}

export function detectImage(buffer: Buffer): DetectedImage | null {
  if (
    buffer.length >= 24 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return {
      mimeType: 'image/png',
      extension: 'png',
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 10 && buffer.subarray(0, 6).toString('ascii') === 'GIF87a') {
    return {
      mimeType: 'image/gif',
      extension: 'gif',
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  if (buffer.length >= 10 && buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
    return {
      mimeType: 'image/gif',
      extension: 'gif',
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    const dimensions = readWebpDimensions(buffer);
    return { mimeType: 'image/webp', extension: 'webp', ...dimensions };
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg', ...readJpegDimensions(buffer) };
  }

  return null;
}

export function validateImageUpload(buffer: Buffer, originalName: string) {
  if (buffer.length === 0) {
    throw new MediaUploadError(400, 'EMPTY_FILE', 'The uploaded file is empty');
  }

  if (buffer.length > MEDIA_MAX_BYTES) {
    throw new MediaUploadError(413, 'FILE_TOO_LARGE', 'The uploaded file exceeds the 10 MB limit');
  }

  const detected = detectImage(buffer);
  if (!detected) {
    throw new MediaUploadError(
      400,
      'UNSUPPORTED_FILE_TYPE',
      'Only JPEG, PNG, WebP, and GIF images are allowed',
    );
  }

  if (
    (detected.width !== undefined && detected.width > MEDIA_MAX_DIMENSION) ||
    (detected.height !== undefined && detected.height > MEDIA_MAX_DIMENSION)
  ) {
    throw new MediaUploadError(
      400,
      'IMAGE_DIMENSIONS_TOO_LARGE',
      'The image dimensions exceed the 4096 px limit',
    );
  }

  return {
    originalName: sanitizeOriginalName(originalName),
    ...detected,
  };
}

export async function storeMediaFile(
  buffer: Buffer,
  category: MediaCategory,
  detected: DetectedImage,
  now = new Date(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<StoredMediaFile> {
  const year = now.getUTCFullYear().toString();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const storedName = `${randomUUID()}.${detected.extension}`;
  const storagePath = `${category}/${year}/${month}/${storedName}`;
  const fullPath = resolveStoredMediaPath(storagePath, env);
  const temporaryPath = join(
    dirname(fullPath),
    `.${storedName}.${randomBytes(8).toString('hex')}.tmp`,
  );

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(temporaryPath, buffer, { flag: 'wx', mode: 0o640 });
  await rename(temporaryPath, fullPath);

  return {
    storedName,
    storagePath,
    publicUrl: `/uploads/${storagePath}`,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    mimeType: detected.mimeType,
    width: detected.width,
    height: detected.height,
  };
}

export async function removeStoredMedia(storagePath: string, env: NodeJS.ProcessEnv = process.env) {
  await unlink(resolveStoredMediaPath(storagePath, env)).catch((error: unknown) => {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  });
}

export function resolveStoredMediaPath(storagePath: string, env: NodeJS.ProcessEnv = process.env) {
  const normalized = storagePath.replaceAll('\\', '/');
  const segments = normalized.split('/');
  if (!normalized || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new MediaUploadError(400, 'INVALID_STORAGE_PATH', 'Invalid media path');
  }

  const root = getMediaStorageRoot(env);
  const fullPath = resolve(root, ...segments);
  const relativePath = relative(root, fullPath);
  if (relativePath.startsWith(`..${sep}`) || relativePath === '..' || isAbsolute(relativePath)) {
    throw new MediaUploadError(400, 'INVALID_STORAGE_PATH', 'Invalid media path');
  }
  return fullPath;
}

function sanitizeOriginalName(name: string) {
  const basename = name.replaceAll('\\', '/').split('/').pop() ?? 'upload';
  const cleaned = [...basename]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join('')
    .trim();
  return (cleaned || 'upload').slice(0, 255);
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === undefined || marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 1 >= buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) break;

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame && offset + 7 < buffer.length) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += segmentLength;
  }
  return {};
}

function readWebpDimensions(buffer: Buffer) {
  if (buffer.length >= 30 && buffer.subarray(12, 16).toString('ascii') === 'VP8X') {
    return {
      width: 1 + buffer[24]! + (buffer[25]! << 8) + (buffer[26]! << 16),
      height: 1 + buffer[27]! + (buffer[28]! << 8) + (buffer[29]! << 16),
    };
  }
  return {};
}
