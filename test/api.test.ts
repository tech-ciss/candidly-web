import { describe, it, expect, vi, afterEach } from 'vitest';
import { getApiBaseUrl } from '@/lib/api/config';
import { apiRequest, ApiError } from '@/lib/api/client';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('client API', () => {
  it('centralise et valide l’URL publique sans identifiants', () => {
    expect(getApiBaseUrl('http://localhost:3001/api/v1/')).toBe(
      'http://localhost:3001/api/v1',
    );
    expect(() => getApiBaseUrl('https://user:secret@example.com')).toThrow();
    expect(() => getApiBaseUrl('file:///tmp')).toThrow();
    expect(() => getApiBaseUrl('')).toThrow();
  });
  it('retourne le JSON typé, préserve les Headers et refuse le cache et inclut les cookies API', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api/v1');
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })));
    vi.stubGlobal('fetch', fetcher);
    expect(
      await apiRequest<{ status: string }>('/health', {
        headers: new Headers({ 'X-Test': 'example' }),
      }),
    ).toEqual({ status: 'ok' });
    const [url, options] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/api/v1/health');
    expect(options.cache).toBe('no-store');
    expect(options.credentials).toBe('include');
    expect(new Headers(options.headers).get('X-Test')).toBe('example');
  });
  it('gère une erreur réseau sans révéler les détails internes', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api/v1');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('private_connection_detail')),
    );
    await expect(apiRequest('/health')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: null,
    });
  });
  it('normalise les erreurs HTTP et les réponses illisibles', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api/v1');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('private_server_detail', { status: 503 }),
        ),
    );
    await expect(apiRequest('/health')).rejects.toMatchObject({
      status: 503,
      code: 'HTTP_ERROR',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('invalid-json')),
    );
    await expect(apiRequest('/health')).rejects.toBeInstanceOf(ApiError);
  });
  it('refuse les chemins qui changent d’origine ou sortent du préfixe', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api/v1');
    for (const path of [
      '//example.com',
      '/../private',
      '/%2e%2e/private',
      'https://example.com',
    ])
      await expect(apiRequest(path)).rejects.toMatchObject({
        code: 'INVALID_PATH',
      });
  });
});
