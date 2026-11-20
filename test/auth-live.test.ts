// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createApiClient } from '@/lib/api/client';
import { createAuthApi } from '@/features/auth/api';
import { SessionManager } from '@/features/auth/session';
const base = process.env.CAND016B_API_URL;
afterEach(() => vi.unstubAllGlobals());
it.skipIf(!base)(
  'parcours web réel PostgreSQL/Redis : inscription, vérification, sessions, profil, reset, révocation et rotation concurrente',
  async () => {
    if (
      !base ||
      new URL(base).hostname !== '127.0.0.1' ||
      !process.env.CAND016B_MAIL_DIRECTORY ||
      !process.env.CAND016B_EMAIL_PREFIX
    )
      throw Error('Harnais local explicite requis.');
    const nativeFetch = globalThis.fetch;
    let cookie = '';
    const origin = 'http://127.0.0.1:13017';
    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL, init: RequestInit = {}) => {
        const target = new URL(String(input));
        if (target.origin !== new URL(base).origin)
          throw Error('Origine test refusée.');
        const headers = new Headers(init.headers);
        headers.set('Origin', origin);
        if (cookie && target.pathname.startsWith('/api/v1/auth/'))
          headers.set('Cookie', cookie);
        const response = await nativeFetch(input, { ...init, headers });
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          expect(setCookie.includes('HttpOnly')).toBe(true);
          expect(setCookie.includes('SameSite=Strict')).toBe(true);
          cookie = setCookie.split(';')[0]!;
          if (cookie === 'candidly_refresh=') cookie = '';
        }
        return response;
      },
    );
    const api = createAuthApi(createApiClient(base)),
      manager = new SessionManager(api);
    const email =
      process.env.CAND016B_EMAIL_PREFIX + '-' + randomUUID() + '@example.com';
    const password = 'MotDePasseIntegration2026!';
    const next = 'NouveauMotIntegration2026!';
    async function mailToken(subject: string) {
      for (let i = 0; i < 40; i++) {
        for (const filename of await readdir(
          process.env.CAND016B_MAIL_DIRECTORY!,
        )) {
          if (!filename.endsWith('.json')) continue;
          const message = JSON.parse(
            await readFile(
              process.env.CAND016B_MAIL_DIRECTORY! + '/' + filename,
              'utf8',
            ),
          ) as { to: string; subject: string; text: string };
          if (message.to === email && message.subject.includes(subject)) {
            const link = message.text.match(/http[^\s]+/u)?.[0];
            if (link) {
              const token = new URLSearchParams(
                new URL(link).hash.slice(1),
              ).get('token');
              if (token) return token;
            }
          }
        }
        await delay(100);
      }
      throw Error('Email de test absent.');
    }
    const requested = await api.register({
      email,
      password,
      firstName: 'Awa',
      lastName: 'Fixture',
    });
    expect(requested.success).toBe(true);
    await expect(manager.login({ email, password })).rejects.toMatchObject({
      status: 401,
    });
    const verification = await mailToken('Vérifiez');
    expect((await api.verify(verification)).success).toBe(true);
    await expect(api.verify(verification)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      manager.login({ email, password: 'MauvaisMotDePasse2026!' }),
    ).rejects.toMatchObject({ status: 401 });
    await manager.login({ email, password });
    expect(manager.getSnapshot().status).toBe('authenticated');
    const profile = await manager.request<{ firstName: string; email: string }>(
      '/users/me',
    );
    expect(profile.firstName).toBe('Awa');
    expect(profile.email).toBe(email);
    await manager.retry();
    expect(manager.getSnapshot().status).toBe('authenticated');
    await manager.updateProfile({ firstName: 'Fatou', lastName: 'Fixture' });
    expect(manager.getSnapshot().user?.firstName).toBe('Fatou');
    const pref = await manager.request<{ timezone: string }>(
      '/users/me/preferences',
    );
    expect(pref.timezone).toBe('Africa/Abidjan');
    await manager.request('/users/me/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: 'UTC' }),
    });
    expect(
      (await manager.request<{ timezone: string }>('/users/me/preferences'))
        .timezone,
    ).toBe('UTC');
    const restored = new SessionManager(createAuthApi(createApiClient(base)));
    await restored.initialize();
    expect(restored.getSnapshot().user?.firstName).toBe('Fatou');
    await restored.logout();
    expect(restored.getSnapshot().user).toBeNull();
    await expect(manager.request('/users/me')).rejects.toMatchObject({
      status: 401,
    });
    expect((await api.forgot(email)).success).toBe(true);
    const reset = await mailToken('Réinitialisez');
    expect((await api.reset(reset, next)).success).toBe(true);
    await expect(api.reset(reset, next)).rejects.toMatchObject({ status: 400 });
    await manager.login({ email, password: next });
    expect(manager.getSnapshot().status).toBe('authenticated');
    // Contournement volontaire du single-flight UNIQUEMENT pour vérifier la politique serveur stricte.
    const original = cookie;
    const responses = await Promise.all(
      [1, 2].map(() =>
        nativeFetch(base + '/auth/refresh', {
          method: 'POST',
          headers: { Origin: origin, 'X-Candidly-CSRF': '1', Cookie: original },
        }),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 401,
    ]);
    await expect(manager.request('/users/me')).rejects.toMatchObject({
      status: 401,
    });
    expect(manager.getSnapshot().user).toBeNull();
  },
  15000,
);
