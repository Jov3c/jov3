export interface PublicTimelineMedia {
  id: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface PublicTimelineLink {
  label: string;
  url: string;
  sortOrder: number;
}

export interface PublicTimelineProject {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: string;
}

export interface PublicTimelineEntry {
  id: string;
  eventDate: string;
  datePrecision: 'YEAR' | 'MONTH' | 'DAY';
  dateLabel: string;
  title: string;
  bodyHtml: string;
  media: PublicTimelineMedia[];
  links: PublicTimelineLink[];
  projects: PublicTimelineProject[];
}

export interface PublicTimelineResponse {
  data: PublicTimelineEntry[];
}
