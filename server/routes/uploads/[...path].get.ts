import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';

import { createError, getRouterParam, sendStream, setResponseHeader } from 'h3';

import { resolveStoredMediaPath } from '../../utils/media-storage';

const contentTypes: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export default defineEventHandler(async (event) => {
  const requestedPath = getRouterParam(event, 'path');
  if (!requestedPath) throw createError({ statusCode: 404, statusMessage: 'Media not found' });

  let decodedPath: string;
  try {
    decodedPath = requestedPath
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' });
  }

  const filePath = resolveStoredMediaPath(decodedPath);
  let fileStats;
  try {
    fileStats = await stat(filePath);
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' });
  }
  if (!fileStats.isFile()) throw createError({ statusCode: 404, statusMessage: 'Media not found' });

  const mimeType = contentTypes[extname(filePath).toLowerCase()];
  if (!mimeType) throw createError({ statusCode: 404, statusMessage: 'Media not found' });
  setResponseHeader(event, 'Content-Type', mimeType);
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
  return sendStream(event, createReadStream(filePath));
});
