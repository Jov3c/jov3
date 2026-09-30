import { SitePublicationService } from '../services/site-publication-service';
import { useBlogService } from './blog';
import { useCvService } from './cv';
import { useHomeService } from './home';
import { useProjectService } from './project';

export function useSitePublicationService() {
  return new SitePublicationService(
    useHomeService(),
    useBlogService(),
    useProjectService(),
    useCvService(),
  );
}
