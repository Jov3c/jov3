import { ProjectRepository } from '../repositories/project-repository';
import { ProjectService } from '../services/project-service';
import { usePrisma } from './prisma';

export function useProjectService() {
  return new ProjectService(new ProjectRepository(usePrisma()));
}
