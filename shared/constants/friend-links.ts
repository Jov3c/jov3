export const FRIEND_LINK_STATUSES = [
  'PENDING_EMAIL',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
] as const;

export type FriendLinkStatus = (typeof FRIEND_LINK_STATUSES)[number];

export const FRIEND_LINK_SOURCES = ['ADMIN', 'APPLICATION'] as const;

export type FriendLinkSource = (typeof FRIEND_LINK_SOURCES)[number];

export const FRIEND_LINK_STATUS_LABELS: Record<FriendLinkStatus, string> = {
  PENDING_EMAIL: '待验证邮箱',
  PENDING_REVIEW: '待审核',
  PUBLISHED: '已发布',
  REJECTED: '已拒绝',
};

export const friendLinkStatusSchemaValues = FRIEND_LINK_STATUSES;
