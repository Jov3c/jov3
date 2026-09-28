export interface AdminIdentity {
  id: string;
  email: string;
  displayName: string;
}

export function useAdminSession() {
  return useState<AdminIdentity | null>('admin-session', () => null);
}
