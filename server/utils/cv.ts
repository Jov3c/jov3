import { CvRepository } from '../repositories/cv-repository';
import { CvService } from '../services/cv-service';
import { usePrisma } from './prisma';

export function useCvService() {
  return new CvService(new CvRepository(usePrisma()));
}
