import type { ProjectStatus } from '#shared/constants/project';

export interface PublicProject {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  techStack: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  sortOrder: number;
}

export interface PublicProjectDetail extends PublicProject {
  readmeHtml: string;
}

export interface ProjectListResponse {
  data: { items: PublicProject[] };
}

export interface ProjectDetailResponse {
  data: PublicProjectDetail;
}
