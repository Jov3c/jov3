import { BlogRepository } from '../repositories/blog-repository';
import { BlogService } from '../services/blog-service';
import { usePrisma } from './prisma';

export function useBlogService() {
  return new BlogService(new BlogRepository(usePrisma()));
}
