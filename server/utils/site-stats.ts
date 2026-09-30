import { StatsRepository } from '../repositories/stats-repository';
import { StatsService } from '../services/stats-service';
import { usePrisma } from './prisma';

export function useStatsService() {
  return new StatsService(new StatsRepository(usePrisma()));
}
