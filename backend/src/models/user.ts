export type Role = 'user' | 'admin';

/** A user as stored in the database (includes the password hash). */
export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export type NewUser = Omit<User, 'id' | 'createdAt'>;

/** The safe, public representation of a user returned by the API. */
export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser({ passwordHash: _hash, ...rest }: User): PublicUser {
  return rest;
}
