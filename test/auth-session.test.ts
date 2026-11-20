import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient, ApiError } from '@/lib/api/client';
import { createAuthApi } from '@/features/auth/api';
import { SessionManager } from '@/features/auth/session';
const user = {
  id: '55ada78f-c270-49bb-820c-d6d0babecbbb',
  firstName: 'Awa',
  lastName: 'Fixture',
  email: 'fixture@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  emailVerifiedAt: '2026-01-01T00:00:00Z',
};
const token = {
  accessToken: 'fixture-access',
  tokenType: 'Bearer' as const,
  expiresIn: 900,
};
function harness() {
  const api = createAuthApi(createApiClient('http://localhost:3001/api/v1'));
  api.refresh = vi.fn().mockResolvedValue(token);
  api.readUser = vi.fn().mockResolvedValue(user);
  api.login = vi.fn().mockResolvedValue({ ...token, user });
  api.logout = vi.fn().mockResolvedValue(undefined);
  api.client.request = vi.fn().mockResolvedValue(user);
  return { api, manager: new SessionManager(api) };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('gestionnaire de session mémoire', () => {
  it('initialise une seule fois, même Promise et identité réelle après refresh', async () => {
    const { api, manager } = harness();
    const first = manager.initialize();
    expect(manager.initialize()).toBe(first);
    await first;
    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(api.readUser).toHaveBeenCalledTimes(1);
    expect(manager.getSnapshot()).toEqual({ status: 'authenticated', user });
    await manager.initialize();
    expect(api.refresh).toHaveBeenCalledTimes(1);
  });
  it('refus définitif 401 contre panne temporaire et reprise explicite', async () => {
    const { api, manager } = harness();
    vi.mocked(api.refresh).mockRejectedValueOnce(
      new ApiError('refus', 401, 'UNAUTHORIZED'),
    );
    await expect(manager.initialize()).rejects.toMatchObject({ status: 401 });
    expect(manager.getSnapshot().status).toBe('unauthenticated');
    vi.mocked(api.refresh).mockRejectedValueOnce(
      new ApiError('réseau', null, 'NETWORK_ERROR'),
    );
    await expect(manager.retry()).rejects.toMatchObject({ status: null });
    expect(manager.getSnapshot()).toMatchObject({
      status: 'error',
      user: null,
    });
    await manager.retry();
    expect(manager.getSnapshot().status).toBe('authenticated');
  });
  it('connexion réelle confirmée via me ; échec 401 neutre et 429 conservé', async () => {
    const { api, manager } = harness();
    await manager.login({ email: user.email, password: 'fixture-password' });
    expect(api.readUser).toHaveBeenCalledWith(token.accessToken);
    expect(manager.getSnapshot().user).toEqual(user);
    vi.mocked(api.login).mockRejectedValueOnce(
      new ApiError('refus', 401, 'UNAUTHORIZED'),
    );
    await expect(
      manager.login({ email: user.email, password: 'fixture-password' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(manager.getSnapshot().user).toBeNull();
    vi.mocked(api.login).mockRejectedValueOnce(
      new ApiError('limite', 429, 'TOO_MANY_REQUESTS', undefined, '900'),
    );
    await expect(
      manager.login({ email: user.email, password: 'fixture-password' }),
    ).rejects.toMatchObject({ status: 429, retryAfter: '900' });
  });
  it('deux lectures 401 partagent une seule rotation, puis sont rejouées une fois', async () => {
    const { api, manager } = harness();
    await manager.initialize();
    vi.mocked(api.client.request)
      .mockRejectedValueOnce(new ApiError('expired', 401, 'UNAUTHORIZED'))
      .mockRejectedValueOnce(new ApiError('expired', 401, 'UNAUTHORIZED'))
      .mockResolvedValue(user);
    await Promise.all([
      manager.request('/users/me'),
      manager.request('/users/me'),
    ]);
    expect(api.refresh).toHaveBeenCalledTimes(2);
    expect(api.client.request).toHaveBeenCalledTimes(4);
  });
  it('ne rejoue pas PATCH après 401 et ne boucle pas après un second refus GET', async () => {
    const { api, manager } = harness();
    await manager.initialize();
    vi.mocked(api.client.request).mockRejectedValue(
      new ApiError('refus', 401, 'UNAUTHORIZED'),
    );
    await expect(
      manager.request('/users/me', { method: 'PATCH', body: '{}' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(api.client.request).toHaveBeenCalledTimes(1);
    expect(api.refresh).toHaveBeenCalledTimes(1);
    await manager.login({ email: user.email, password: 'fixture-password' });
    await expect(manager.request('/users/me')).rejects.toMatchObject({
      status: 401,
    });
    expect(api.client.request).toHaveBeenCalledTimes(3);
    expect(api.refresh).toHaveBeenCalledTimes(2);
    expect(manager.getSnapshot().status).toBe('unauthenticated');
  });
  it('renouvelle avant échéance puis envoie une mutation exactement une fois', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T10:00:00Z'));
    const { api, manager } = harness();
    await manager.initialize();
    vi.setSystemTime(new Date('2026-11-18T10:16:00Z'));
    await manager.request('/users/me', { method: 'PATCH', body: '{}' });
    expect(api.refresh).toHaveBeenCalledTimes(2);
    expect(api.client.request).toHaveBeenCalledTimes(1);
  });
  it('logout retire le contenu immédiatement et ignore la réponse tardive de refresh', async () => {
    const { api, manager } = harness();
    const pending = deferred<typeof token>();
    vi.mocked(api.refresh).mockReturnValueOnce(pending.promise);
    const init = manager.initialize();
    const result = init.catch((e) => e as unknown);
    await Promise.resolve();
    const logout = manager.logout();
    expect(manager.getSnapshot()).toMatchObject({
      status: 'unauthenticated',
      user: null,
    });
    pending.resolve(token);
    await result;
    await logout;
    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(api.readUser).not.toHaveBeenCalled();
    expect(manager.getSnapshot().user).toBeNull();
  });
  it('réponse de profil tardive après logout ne restaure pas les données privées', async () => {
    const { api, manager } = harness();
    await manager.initialize();
    const pending = deferred<unknown>();
    vi.mocked(api.client.request).mockReturnValueOnce(pending.promise);
    const read = manager.request('/users/me').catch((e) => e as unknown);
    await manager.logout();
    pending.resolve(user);
    expect(await read).toMatchObject({ code: 'SESSION_CHANGED' });
    expect(manager.getSnapshot().user).toBeNull();
  });
  it('échec logout distingue nettoyage local et révocation non confirmée', async () => {
    const { api, manager } = harness();
    await manager.initialize();
    vi.mocked(api.logout).mockRejectedValueOnce(
      new ApiError('réseau', null, 'NETWORK_ERROR'),
    );
    await expect(manager.logout()).rejects.toBeInstanceOf(ApiError);
    expect(manager.getSnapshot()).toMatchObject({
      status: 'unauthenticated',
      user: null,
    });
    expect(manager.getSnapshot().message).toContain('reste à confirmer');
    await manager.logout();
  });
  it('aucun token n’est persistant ni exposé par le snapshot', async () => {
    const local = vi.spyOn(Storage.prototype, 'setItem');
    const { manager } = harness();
    await manager.initialize();
    expect(JSON.stringify(manager.getSnapshot())).not.toContain(
      token.accessToken,
    );
    await manager.logout();
    expect(local).not.toHaveBeenCalled();
  });
});
it('un ancien 401 tardif ne répète pas le refresh, même si le JWT signé reste identique dans la même seconde', async () => {
  const { api, manager } = harness();
  await manager.initialize();
  const old = deferred<unknown>();
  vi.mocked(api.client.request)
    .mockReturnValueOnce(old.promise)
    .mockRejectedValueOnce(new ApiError('expired', 401, 'UNAUTHORIZED'))
    .mockResolvedValue(user);
  const slow = manager.request('/users/me');
  await manager.request('/users/me');
  expect(api.refresh).toHaveBeenCalledTimes(2);
  old.reject(new ApiError('old 401', 401, 'UNAUTHORIZED'));
  await slow;
  expect(api.refresh).toHaveBeenCalledTimes(2);
});
