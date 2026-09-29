import { TimelineRepository } from '../repositories/timeline-repository';
import { TimelineService } from '../services/timeline-service';
import { usePrisma } from './prisma';

export function useTimelineService() {
  return new TimelineService(new TimelineRepository(usePrisma()));
}
