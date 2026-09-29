import { FootprintRepository } from '../repositories/footprint-repository';
import { FootprintService } from '../services/footprint-service';
import { FootprintGeoAdapter } from '../services/footprint-geo';
import { usePrisma } from './prisma';

export function useFootprintService() {
  return new FootprintService(new FootprintRepository(usePrisma()));
}

export function useFootprintGeoAdapter() {
  return new FootprintGeoAdapter();
}
