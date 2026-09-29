import type { PostStatus } from '#shared/constants/blog';

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  visible: boolean;
  postCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostCover {
  id: string;
  publicUrl: string;
  altText: string | null;
}

export interface PublicPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: Pick<BlogCategory, 'id' | 'slug' | 'name'>;
  cover: PostCover | null;
  status: PostStatus;
  publishedAt: string | null;
  wordCount: number;
  viewCount: number;
  commentCount: number;
}

export interface PublicPostDetail extends PublicPost {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface AdminPost extends PublicPost {
  markdownBody: string;
  seoTitle: string | null;
  seoDescription: string | null;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPostsResponse {
  data: { items: PublicPost[] };
  meta: {
    page: number;
    pageSize: number;
    total: number;
    stats: { totalPosts: number; totalWords: number };
  };
}

export interface PublicCategoriesResponse {
  data: BlogCategory[];
  meta: { stats: { totalPosts: number; totalCategories: number; totalWords: number } };
}

export interface ArchiveItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
}

export interface ArchiveYear {
  year: number;
  articleCount: number;
  months: Array<{ month: string; items: ArchiveItem[] }>;
}

export interface PublicArchiveResponse {
  data: { years: ArchiveYear[]; total: number };
}

export interface AdminMediaOption {
  id: string;
  originalName: string;
  publicUrl: string;
  altText: string | null;
}
