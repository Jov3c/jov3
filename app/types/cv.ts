export interface PublicCvProfile {
  name: string;
  headline: string;
  bio: string;
  location: string;
  website: string | null;
  contactEmail: string | null;
  statusText: string | null;
  statement: string;
  updatedAt: string;
  portrait: { id: string; publicUrl: string; altText: string | null } | null;
}

export interface PublicCvExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  sortOrder: number;
}

export interface PublicCvEducation {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string | null;
  description: string;
  sortOrder: number;
}

export interface PublicCvSkillGroup {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

export interface PublicCvProject {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: string;
}

export interface PublicCv {
  profile: PublicCvProfile;
  experiences: PublicCvExperience[];
  educations: PublicCvEducation[];
  skills: PublicCvSkillGroup[];
  projects: PublicCvProject[];
  links: Array<{ id: string; name: string; url: string }>;
}

export interface PublicCvResponse {
  data: PublicCv;
}
