import type { AuthorType, ModerationStatus } from '#shared/constants/moderation';

export interface PublicCommunityReply {
  id: string;
  nickname: string;
  content: string;
  authorType: AuthorType;
  createdAt: string;
}

export interface PublicComment {
  id: string;
  nickname: string;
  content: string;
  authorType: AuthorType;
  createdAt: string;
  replies: PublicCommunityReply[];
}

export interface PublicMessage {
  id: string;
  nickname: string;
  content: string;
  authorType: AuthorType;
  createdAt: string;
  replies: PublicCommunityReply[];
}

export interface PublicCommentsResponse {
  data: PublicComment[];
  meta: { page: number; pageSize: number; total: number; publishedTotal: number };
}

export interface PublicMessagesResponse {
  data: PublicMessage[];
  meta: { page: number; pageSize: number; total: number };
}

export interface AdminComment {
  id: string;
  postId?: string;
  post?: { id: string; slug: string; title: string };
  parentId: string | null;
  parent?: { id: string; nickname: string } | null;
  nickname: string;
  email: string | null;
  content: string;
  authorType: AuthorType;
  status: ModerationStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMessage {
  id: string;
  parentId: string | null;
  parent?: { id: string; nickname: string } | null;
  nickname: string;
  email: string | null;
  content: string;
  authorType: AuthorType;
  status: ModerationStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
