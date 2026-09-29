export interface FriendLinkLogo {
  id: string;
  publicUrl: string;
  altText: string | null;
}

export interface PublicFriendLink {
  id: string;
  name: string;
  url: string;
  description: string;
  logo: FriendLinkLogo | null;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
}

export interface PublicFriendLinksResponse {
  data: PublicFriendLink[];
  meta: { page: number; pageSize: number; total: number };
}

export type AdminFriendLinkStatus = 'PENDING_EMAIL' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
export type AdminFriendLinkSource = 'ADMIN' | 'APPLICATION';

export interface AdminFriendLink extends PublicFriendLink {
  logoMediaId: string | null;
  contactEmail: string | null;
  applicantNote: string | null;
  source: AdminFriendLinkSource;
  status: AdminFriendLinkStatus;
  verifiedAt: string | null;
  updatedAt: string;
}

export interface AdminFriendLinksResponse {
  data: AdminFriendLink[];
  meta: { page: number; pageSize: number; total: number };
}
