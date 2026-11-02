import { getApiBaseUrl } from './config';
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export async function apiRequest<T>(
  path: string,
  options: Omit<RequestInit, 'credentials' | 'cache'> = {},
): Promise<T> {
  const base = getApiBaseUrl();
  // Une requête ne peut pas changer d'origine ni sortir du préfixe API configuré.
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('..') ||
    /%2e|%2f|%5c/i.test(path) ||
    /[\\?#]/.test(path)
  )
    throw new ApiError('Chemin API invalide.', null, 'INVALID_PATH');
  const timeout = AbortSignal.timeout(8000);
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  let response: Response;
  try {
    response = await fetch(base + path, {
      ...options,
      headers,
      signal: options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout,
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      'Le service est injoignable. Réessayez plus tard.',
      null,
      'NETWORK_ERROR',
    );
  }
  if (!response.ok)
    throw new ApiError(
      'La requête ne peut pas être traitée.',
      response.status,
      'HTTP_ERROR',
    );
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      'La réponse du service est invalide.',
      response.status,
      'INVALID_RESPONSE',
    );
  }
}
