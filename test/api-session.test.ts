import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApiClient, ApiError } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/api/config';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const base = 'http://localhost:3001/api/v1';
const token = {
  accessToken: 'fixture-access',
  tokenType: 'Bearer',
  expiresIn: 900,
};
const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers });
describe('compatibilité client HTTP/session', () => {
  it('transmet GET/POST/PATCH/DELETE, payloads CRM, query, Bearer et credentials sans modifier le corps', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(json({ id: 'fixture' })));
    vi.stubGlobal('fetch', fetcher);
    const client = createApiClient(base);
    const body = JSON.stringify({
      companyId: '55ada78f-c270-49bb-820c-d6d0babecbbb',
      dueAt: '2026-11-23T09:00:00Z',
      contactId: null,
      title: 'Échange',
    });
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE'])
      await client.request('/tasks', {
        method,
        body: method === 'GET' ? undefined : body,
        headers: {
          Authorization: 'Bearer fixture-access',
          'Content-Type': 'application/json',
        },
        query: new URLSearchParams({
          page: '2',
          limit: '10',
          search: '% _ & ?',
        }),
      });
    for (const [url, opts] of fetcher.mock.calls as [string, RequestInit][]) {
      expect(url).toContain(base + '/tasks?page=2&limit=10&search=');
      expect(opts.credentials).toBe('include');
      expect(opts.cache).toBe('no-store');
      expect(opts.redirect).toBe('error');
      expect(new Headers(opts.headers).get('Authorization')).toBe(
        'Bearer fixture-access',
      );
      expect(new Headers(opts.headers).has('X-Candidly-CSRF')).toBe(false);
      if (opts.method !== 'GET') expect(opts.body).toBe(body);
    }
  });
  it('gère 204 et réponses vides sans parser JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(new Response('')),
    );
    const client = createApiClient(base);
    expect(
      await client.request('/tasks/id', { method: 'DELETE' }),
    ).toBeUndefined();
    expect(await client.request('/health')).toBeUndefined();
  });
  it('préserve codes HTTP reconnus et métadonnées sans exposer les détails arbitraires', async () => {
    const requestId = '55ada78f-c270-49bb-820c-d6d0babecbbb';
    for (const [status, code] of [
      [400, 'BAD_REQUEST'],
      [401, 'UNAUTHORIZED'],
      [403, 'FORBIDDEN'],
      [404, 'NOT_FOUND'],
      [409, 'CONFLICT'],
      [429, 'TOO_MANY_REQUESTS'],
    ] as const) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          json(
            {
              success: false,
              error: { code, message: 'private technical detail' },
            },
            status,
            { 'X-Request-Id': requestId, 'Retry-After': '60' },
          ),
        ),
      );
      const error = await createApiClient(base)
        .request('/tasks')
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status,
        code,
        requestId,
        retryAfter: '60',
      });
      expect((error as ApiError).message).not.toContain('private');
    }
  });
  it('tolère erreurs non JSON, corps vide et structures malformées, code inconnu, header date Retry-After', async () => {
    for (const body of [
      '<html>private</html>',
      '',
      JSON.stringify({
        success: false,
        error: { code: 'ARBITRARY', message: 'private' },
      }),
      JSON.stringify({ success: false, error: null }),
    ]) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(body, {
            status: 409,
            headers: { 'Retry-After': 'Wed, 18 Nov 2026 10:00:00 GMT' },
          }),
        ),
      );
      await expect(
        createApiClient(base).request('/tasks'),
      ).rejects.toMatchObject({
        status: 409,
        code: 'HTTP_ERROR',
        retryAfter: 'Wed, 18 Nov 2026 10:00:00 GMT',
      });
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('broken', { status: 200 })),
    );
    await expect(createApiClient(base).request('/tasks')).rejects.toMatchObject(
      { code: 'INVALID_RESPONSE', status: 200 },
    );
  });
  it('distingue réseau/HTTP et filtre request ID et Retry-After non contrôlés', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('private token')),
    );
    await expect(
      createApiClient(base).request('/health'),
    ).rejects.toMatchObject({ status: null, code: 'NETWORK_ERROR' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentification requise.',
            },
          },
          401,
          { 'X-Request-Id': 'private', 'Retry-After': 'arbitrary' },
        ),
      ),
    );
    await expect(
      createApiClient(base).request('/health'),
    ).rejects.toMatchObject({
      status: 401,
      requestId: undefined,
      retryAfter: undefined,
    });
  });
  it('centralise CSRF pour login/refresh/logout, sans Origin forgée ni token refresh JS', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(json(token)));
    vi.stubGlobal('fetch', fetcher);
    const client = createApiClient(base);
    await client.sessionRequest('login', {
      email: 'fixture@example.com',
      password: 'fixture-password',
    });
    await client.refresh();
    await client.sessionRequest('logout');
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual(
      ['login', 'refresh', 'logout'].map((action) => base + '/auth/' + action),
    );
    for (const [, opts] of fetcher.mock.calls as [string, RequestInit][]) {
      const headers = new Headers(opts.headers);
      expect(headers.get('X-Candidly-CSRF')).toBe('1');
      expect(headers.has('Origin')).toBe(false);
      expect(headers.has('Cookie')).toBe(false);
      expect(opts.credentials).toBe('include');
      expect(opts.method).toBe('POST');
    }
  });
  it('partage exactement une Promise refresh et libère l’état après succès', async () => {
    let resolve!: (value: Response) => void;
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    vi.stubGlobal('fetch', fetcher);
    const client = createApiClient(base);
    const first = client.refresh(),
      second = client.refresh(),
      third = client.sessionRequest('refresh');
    expect(first).toBe(second);
    expect(third).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
    resolve(json(token));
    expect(await Promise.all([first, second, third])).toEqual([
      token,
      token,
      token,
    ]);
    const next = client.refresh();
    expect(next).not.toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(2);
    resolve(json(token));
    await next;
  });
  it('propage le même échec, libère après erreur et ne rejoue aucune mutation ni ne boucle', async () => {
    const fetcher = vi.fn().mockImplementation(() =>
      Promise.resolve(
        json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentification requise.',
            },
          },
          401,
        ),
      ),
    );
    vi.stubGlobal('fetch', fetcher);
    const client = createApiClient(base);
    const results = await Promise.allSettled([
      client.refresh(),
      client.refresh(),
      client.refresh(),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const errors = results.map((r) =>
      r.status === 'rejected' ? (r.reason as unknown) : undefined,
    );
    expect(errors[0]).toBe(errors[1]);
    expect(errors[0]).toBe(errors[2]);
    await expect(client.refresh()).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    await expect(
      client.request('/tasks', { method: 'POST', body: '{}' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('nettoie aussi après panne réseau ou réponse refresh invalide, instances indépendantes', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('private'))
      .mockResolvedValueOnce(json({ accessToken: 123 }))
      .mockImplementation(() => Promise.resolve(json(token)));
    vi.stubGlobal('fetch', fetcher);
    const client = createApiClient(base);
    await expect(client.refresh()).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    await expect(client.refresh()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
    await expect(client.refresh()).resolves.toEqual(token);
    await Promise.all([
      createApiClient(base).refresh(),
      createApiClient(base).refresh(),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(5);
  });
  it('refuse origines arbitraires, chemins déviants et configuration manquante/invalide avant fetch', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const client = createApiClient(base);
    for (const path of [
      'https://external.example/x',
      '//external.example/x',
      '/../x',
      '/%2e%2e/x',
      '/\\external',
      '/auth/refresh\n',
      '/tasks?redirect=https://external.example',
    ])
      await expect(client.request(path)).rejects.toMatchObject({
        code: 'INVALID_PATH',
      });
    for (const url of [
      '',
      'ftp://example.com/api/v1',
      'https://a:b@example.com/api/v1',
      'https://example.com/api/v1?q=x',
      'https://example.com/private',
    ])
      expect(() => getApiBaseUrl(url)).toThrow();
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => getApiBaseUrl(base)).toThrow();
    expect(getApiBaseUrl('https://api.example.com/api/v1')).toBe(
      'https://api.example.com/api/v1',
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
