import { createSessionToken, hashSessionToken, verifyPassword } from '../utils/security';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1_000;
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,p=1,t=2$WkaEgog39BZoVftzfVUhTg$44/DoksMLRvohqN5Q/uh9dDN5PIykHxd18mmtVFYLKA';

export class AuthError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface AdminCredentialRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
}

interface ActiveSessionRecord {
  id: string;
  expiresAt: Date;
  admin: { id: string; email: string; displayName: string };
}

export interface AuthRepositoryContract {
  findAdminByEmail(email: string): Promise<AdminCredentialRecord | null>;
  createSession(input: {
    adminId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ id: string; expiresAt: Date }>;
  findActiveSession(tokenHash: string, now: Date): Promise<ActiveSessionRecord | null>;
  touchSession(id: string, now: Date): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;
}

export class AuthService {
  constructor(private readonly repository: AuthRepositoryContract) {}

  async login(email: string, password: string, now = new Date()) {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await this.repository.findAdminByEmail(normalizedEmail);
    const passwordIsValid = await verifyPassword(
      admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
      password,
    );

    if (!admin || !passwordIsValid) {
      throw new AuthError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

    const token = createSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    await this.repository.createSession({
      adminId: admin.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });

    return {
      token,
      expiresAt,
      admin: { id: admin.id, email: admin.email, displayName: admin.displayName },
    };
  }

  async resolveSession(token: string | undefined, now = new Date()) {
    if (!token) throw new AuthError(401, 'UNAUTHENTICATED', 'Authentication required');

    const session = await this.repository.findActiveSession(hashSessionToken(token), now);
    if (!session) throw new AuthError(401, 'UNAUTHENTICATED', 'Authentication required');

    await this.repository.touchSession(session.id, now);
    return session.admin;
  }

  async logout(token: string | undefined) {
    if (token) await this.repository.deleteSession(hashSessionToken(token));
  }
}
