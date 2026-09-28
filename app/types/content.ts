export type ProjectStatus = 'Building' | 'Active' | 'Done';

export interface Project {
  slug: string;
  name: string;
  index: string;
  status: ProjectStatus;
  description: string;
  stack: string[];
  hasDemo: boolean;
  repositoryLabel: string;
  readme: {
    lead: string;
    sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>;
  };
}

export interface BlogPost {
  slug: string;
  category: '开发' | 'AI' | '产品' | '随笔';
  publishedAt: string;
  title: string;
  summary: string;
  views: number;
  comments: number;
  words: number;
  body: string[];
}

export interface ArchiveEntry {
  year: number;
  month: string;
  items: Array<{ date: string; title: string; category: string; slug?: string }>;
}

export interface FriendLink {
  name: string;
  initials: string;
  description: string;
  url?: string;
}

export interface GuestbookMessage {
  name: string;
  date: string;
  content: string;
  reply?: { name: string; date: string; content: string };
}

export interface FootprintPlace {
  id: string;
  country: string;
  city: string;
  coordinates: [number, number];
  date: string;
  title: string;
  memory: string;
}

export interface TimelineChapter {
  year: string;
  verb: string;
  title: string;
  description: string;
  tag: string;
  story: string;
}
