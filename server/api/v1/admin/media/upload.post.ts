import { readMultipartFormData } from 'h3';

import { mediaUploadFieldsSchema } from '../../../../../shared/schemas/media';
import { apiError } from '../../../../utils/api-response';
import { mediaApiError } from '../../../../services/media-service';
import { useMediaService } from '../../../../utils/media';

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((part) => part.name === 'file' && Boolean(part.filename));
  if (!filePart?.filename || !filePart.data) {
    return apiError(event, 400, 'FILE_REQUIRED', 'Choose an image file to upload');
  }

  const fields = Object.fromEntries(
    (parts ?? [])
      .filter((part) => part.name !== 'file')
      .map((part) => [part.name, part.data.toString('utf8')]),
  );
  const parsed = mediaUploadFieldsSchema.safeParse(fields);
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Upload fields are invalid',
      parsed.error.flatten(),
    );
  }

  try {
    const media = await useMediaService().upload({
      buffer: filePart.data,
      originalName: filePart.filename,
      category: parsed.data.category,
      altText: parsed.data.altText,
    });
    return { data: media };
  } catch (error) {
    const mediaError = mediaApiError(error);
    if (mediaError)
      return apiError(event, mediaError.statusCode, mediaError.code, mediaError.message);
    throw error;
  }
});
