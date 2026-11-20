import {
  createApiClient,
  ApiError,
  type AccessTokenResponse,
} from '@/lib/api/client';
import type {
  User,
  Preferences,
  Credentials,
  Registration,
  AuthMessage,
} from './types';
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
export function userResponse(value: unknown): User {
  if (
    !record(value) ||
    ![
      'id',
      'firstName',
      'lastName',
      'email',
      'emailVerifiedAt',
      'createdAt',
    ].every((key) => typeof value[key] === 'string')
  )
    throw new ApiError('Réponse de profil invalide.', 200, 'INVALID_RESPONSE');
  return {
    id: String(value.id),
    firstName: String(value.firstName),
    lastName: String(value.lastName),
    email: String(value.email),
    emailVerifiedAt: String(value.emailVerifiedAt),
    createdAt: String(value.createdAt),
  };
}
export function createAuthApi(client = createApiClient()) {
  const post = (path: string, body: unknown) =>
    client.request<AuthMessage>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const readUser = async (token: string) =>
    userResponse(
      await client.request<unknown>('/auth/me', {
        headers: { Authorization: 'Bearer ' + token },
      }),
    );
  return {
    client,
    readUser,
    register: (data: Registration) => post('/auth/register', data),
    verify: (token: string) => post('/auth/verify-email', { token }),
    resend: (email: string) => post('/auth/resend-verification', { email }),
    forgot: (email: string) => post('/auth/forgot-password', { email }),
    reset: (token: string, newPassword: string) =>
      post('/auth/reset-password', { token, newPassword }),
    async login(data: Credentials) {
      const value = await client.sessionRequest<
        AccessTokenResponse & { user: unknown }
      >('login', data);
      if (
        !value ||
        typeof value.accessToken !== 'string' ||
        !value.accessToken ||
        value.tokenType !== 'Bearer' ||
        !Number.isInteger(value.expiresIn) ||
        value.expiresIn <= 0
      )
        throw new ApiError(
          'Réponse de connexion invalide.',
          200,
          'INVALID_RESPONSE',
        );
      return { ...value, user: userResponse(value.user) };
    },
    refresh: () => client.refresh(),
    logout: () => client.sessionRequest<void>('logout'),
  };
}
export type AuthApi = ReturnType<typeof createAuthApi>;
export type { User, Preferences };
