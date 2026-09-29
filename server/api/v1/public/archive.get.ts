import { apiError } from '../../../utils/api-response';
import { blogApiError } from '../../../services/blog-service';
import { useBlogService } from '../../../utils/blog';

export default defineEventHandler(async (event) => {
  try {
    return { data: await useBlogService().listArchive() };
  } catch (error) {
    const blogError = blogApiError(error);
    if (blogError) return apiError(event, blogError.statusCode, blogError.code, blogError.message);
    throw error;
  }
});
