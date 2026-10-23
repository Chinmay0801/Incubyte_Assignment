import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../errors';
import { toPublicUser, type PublicUser, type Role } from '../models/user';
import type { UserRepository } from '../repositories/userRepository';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** The identity attached to an authenticated request. */
export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthOptions {
  jwtSecret: string;
  jwtExpiresIn: string;
  /** bcrypt cost factor; lower values are only meant for tests. */
  saltRounds?: number;
}

const INVALID_CREDENTIALS = 'Invalid email or password';

const normaliseEmail = (email: string): string => email.trim().toLowerCase();

const isUniqueViolation = (error: unknown): boolean =>
  (error as { code?: string } | null)?.code === 'SQLITE_CONSTRAINT_UNIQUE';

/** Handles registration, login and token verification. */
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private readonly users: UserRepository,
    private readonly options: AuthOptions,
  ) {
    this.saltRounds = options.saltRounds ?? 10;
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const user = await this.createUser(input, 'user');
    return { token: this.issueToken(user.id, user.role), user };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = this.users.findByEmail(normaliseEmail(input.email));
    // Same message for unknown email and wrong password, so accounts can't be enumerated.
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    return { token: this.issueToken(user.id, user.role), user: toPublicUser(user) };
  }

  /**
   * Validates a JWT and returns the matching user. The role is read from the
   * database so that role changes (or deleted accounts) take effect immediately.
   */
  verifyToken(token: string): AuthenticatedUser {
    let subject: string | undefined;
    try {
      const payload = jwt.verify(token, this.options.jwtSecret);
      subject = typeof payload === 'string' ? undefined : payload.sub;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = subject ? this.users.findById(Number(subject)) : undefined;
    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  /** Creates the admin account if it is missing. Safe to call on every start-up. */
  async ensureAdmin(input: RegisterInput): Promise<PublicUser> {
    const existing = this.users.findByEmail(normaliseEmail(input.email));
    if (existing) {
      return toPublicUser(existing);
    }
    return this.createUser(input, 'admin');
  }

  private async createUser(input: RegisterInput, role: Role): Promise<PublicUser> {
    const email = normaliseEmail(input.email);
    if (this.users.findByEmail(email)) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, this.saltRounds);
    try {
      const user = this.users.create({ name: input.name.trim(), email, passwordHash, role });
      return toPublicUser(user);
    } catch (error) {
      // Another request may have registered the same email while we were hashing.
      if (isUniqueViolation(error)) {
        throw new ConflictError('An account with this email already exists');
      }
      throw error;
    }
  }

  private issueToken(userId: number, role: Role): string {
    return jwt.sign({ role }, this.options.jwtSecret, {
      subject: String(userId),
      expiresIn: this.options.jwtExpiresIn as SignOptions['expiresIn'],
    });
  }
}
