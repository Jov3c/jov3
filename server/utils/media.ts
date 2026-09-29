import { MediaRepository } from '../repositories/media-repository';
import { MediaService } from '../services/media-service';
import { usePrisma } from './prisma';

export function useMediaService() {
  return new MediaService(new MediaRepository(usePrisma()));
}
