import { ApiError, type ApiRequestOptions } from '@/lib/api/client';
import { createAuthApi, userResponse, type AuthApi } from './api';
import type { Credentials, SessionSnapshot, User } from './types';
const stale = () =>
  new ApiError(
    'La session a changé. Reconnectez-vous.',
    null,
    'SESSION_CHANGED',
  );
export const isRefused = (error: unknown) =>
  error instanceof ApiError && error.status === 401;
export class SessionManager {
  private token?: string;
  private expiresAt = 0;
  private tokenVersion = 0;
  private generation = 0;
  private started = false;
  private flight?: Promise<void>;
  private controls: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  private snapshot: SessionSnapshot = { status: 'initializing', user: null };
  private configuredApi?: AuthApi;
  constructor(api?: AuthApi) {
    this.configuredApi = api;
  }
  get api(): AuthApi {
    return (this.configuredApi ??= createAuthApi());
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(snapshot: SessionSnapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
  private clear(status: 'unauthenticated' | 'error', message?: string) {
    this.token = undefined;
    this.expiresAt = 0;
    this.publish({ status, user: null, message });
  }
  private current(generation: number) {
    if (generation !== this.generation) throw stale();
  }
  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.controls.then(operation, operation);
    this.controls = next.catch(() => undefined);
    return next;
  }
  initialize(): Promise<void> {
    if (this.started) return this.flight ?? Promise.resolve();
    this.started = true;
    return this.renew();
  }
  retry(): Promise<void> {
    return this.renew();
  }
  renew(): Promise<void> {
    if (this.flight) return this.flight;
    const generation = this.generation;
    this.publish({
      status: this.snapshot.user ? 'refreshing' : 'initializing',
      user: this.snapshot.user,
    });
    this.flight = this.serialize(async () => {
      this.current(generation);
      try {
        const response = await this.api.refresh();
        this.current(generation);
        this.token = response.accessToken;
        this.tokenVersion++;
        this.expiresAt = Date.now() + response.expiresIn * 1000;
        const user = await this.api.readUser(this.token);
        this.current(generation);
        this.publish({ status: 'authenticated', user });
      } catch (error) {
        if (generation === this.generation) {
          if (isRefused(error)) this.clear('unauthenticated');
          else
            this.clear(
              'error',
              'Le service est temporairement indisponible. Réessayez sans vous reconnecter.',
            );
        }
        throw error;
      }
    }).finally(() => {
      this.flight = undefined;
    });
    return this.flight;
  }
  login(data: Credentials): Promise<void> {
    const generation = ++this.generation;
    this.clear('unauthenticated');
    return this.serialize(async () => {
      this.current(generation);
      try {
        const result = await this.api.login(data);
        this.current(generation);
        this.token = result.accessToken;
        this.tokenVersion++;
        this.expiresAt = Date.now() + result.expiresIn * 1000;
        const user = await this.api.readUser(this.token);
        this.current(generation);
        this.publish({ status: 'authenticated', user });
      } catch (error) {
        if (generation === this.generation)
          this.clear(isRefused(error) ? 'unauthenticated' : 'error');
        throw error;
      }
    });
  }
  logout(): Promise<void> {
    const generation = ++this.generation;
    this.clear('unauthenticated');
    // Une réponse Set-Cookie tardive est suivie du logout serveur, pas seulement ignorée en UI.
    return this.serialize(() => this.api.logout()).catch((error) => {
      if (generation === this.generation)
        this.publish({
          status: 'unauthenticated',
          user: null,
          message:
            'La déconnexion locale est faite, mais la révocation serveur reste à confirmer. Réessayez la déconnexion.',
        });
      throw error;
    });
  }
  invalidate() {
    ++this.generation;
    this.clear('unauthenticated');
  }
  async request<T>(
    path:
      | '/users/me'
      | '/users/me/preferences'
      | '/companies'
      | `/companies/${string}`
      | '/contacts'
      | `/contacts/${string}`,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const generation = this.generation;
    if (this.flight) await this.flight;
    this.current(generation);
    if (!this.token || this.expiresAt <= Date.now() + 5000) await this.renew();
    this.current(generation);
    const sentVersion = this.tokenVersion;
    const send = () =>
      this.api.client.request<T>(path, {
        ...options,
        headers: {
          ...Object.fromEntries(new Headers(options.headers)),
          Authorization: 'Bearer ' + this.token,
        },
      });
    try {
      const value = await send();
      this.current(generation);
      return value;
    } catch (error) {
      this.current(generation);
      if (!isRefused(error)) throw error;
      if ((options.method ?? 'GET').toUpperCase() !== 'GET') {
        this.invalidate();
        throw new ApiError(
          'Session refusée. Reconnectez-vous avant de soumettre à nouveau.',
          401,
          'UNAUTHORIZED',
        );
      }
      // Un ancien 401 ne provoque pas une deuxième rotation si un autre lecteur l'a déjà faite.
      if (!this.flight && this.snapshot.status === 'error')
        throw new ApiError(
          'Service temporairement indisponible.',
          null,
          'NETWORK_ERROR',
        );
      if (this.tokenVersion === sentVersion) await this.renew();
      else if (this.flight) await this.flight;
      this.current(generation);
      try {
        const value = await send();
        this.current(generation);
        return value;
      } catch (next) {
        if (isRefused(next) && generation === this.generation)
          this.invalidate();
        throw next;
      }
    }
  }
  async updateProfile(data: {
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const generation = this.generation;
    const user = userResponse(
      await this.request('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    );
    this.current(generation);
    this.publish({ status: 'authenticated', user });
    return user;
  }
}
