import { HomeRepository } from '../repositories/home-repository';
import { HomeService } from '../services/home-service';
import { usePrisma } from './prisma';

export function useHomeService() {
  return new HomeService(new HomeRepository(usePrisma()));
}
