export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerifiedAt: string;
  createdAt: string;
}
export interface Preferences {
  locale: 'fr';
  timezone: string;
  createdAt: string;
  updatedAt: string;
}
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  firstName: string;
  lastName: string;
}
export interface AuthMessage {
  success: boolean;
  message: string;
}
export type SessionStatus =
  'initializing' | 'authenticated' | 'unauthenticated' | 'refreshing' | 'error';
export interface SessionSnapshot {
  status: SessionStatus;
  user: User | null;
  message?: string;
}
