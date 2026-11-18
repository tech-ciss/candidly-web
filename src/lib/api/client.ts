import { getApiBaseUrl } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly code: string,
    public readonly requestId?: string,
    public readonly retryAfter?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
const errors: Record<number, { code: string; message: string }> = {
  400: { code: 'BAD_REQUEST', message: 'La requête est invalide.' },
  401: { code: 'UNAUTHORIZED', message: 'Authentification requise.' },
  403: { code: 'FORBIDDEN', message: 'Accès interdit.' },
  404: { code: 'NOT_FOUND', message: 'Ressource introuvable.' },
  405: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' },
  409: {
    code: 'CONFLICT',
    message: 'La requête est en conflit avec la ressource.',
  },
  413: {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'La requête est trop volumineuse.',
  },
  415: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Le format de la requête est refusé.',
  },
  422: {
    code: 'UNPROCESSABLE_ENTITY',
    message: 'Les données fournies sont invalides.',
  },
  429: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Trop de requêtes. Réessayer plus tard.',
  },
  500: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Une erreur interne est survenue.',
  },
  503: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Un service est temporairement indisponible.',
  },
};
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = (value: unknown): string | undefined =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : undefined;
function retryAfter(value: string | null): string | undefined {
  if (!value || value.length > 100) return undefined;
  return /^\d{1,10}$/.test(value) ||
    (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(
      value,
    ) &&
      Number.isFinite(Date.parse(value)))
    ? value
    : undefined;
}
export type ApiRequestOptions = Omit<
  RequestInit,
  'credentials' | 'cache' | 'redirect' | 'mode'
> & { query?: URLSearchParams };
export interface AccessTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
export type SessionAction = 'login' | 'refresh' | 'logout';

export function createApiClient(apiUrl = getApiBaseUrl()) {
  const base = getApiBaseUrl(apiUrl);
  let refreshing: Promise<AccessTokenResponse> | undefined;
  async function request<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      path.includes('..') ||
      /%2e|%2f|%5c/i.test(path) ||
      /[\\?#\s\u0000-\u001f\u007f]/.test(path)
    )
      throw new ApiError('Chemin API invalide.', null, 'INVALID_PATH');
    const { query, ...init } = options;
    const url = new URL(base + path);
    if (query) url.search = query.toString();
    const headers = new Headers(init.headers);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    let response: Response;
    let text: string;
    try {
      response = await fetch(url.toString(), {
        ...init,
        headers,
        signal: init.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(8000)])
          : AbortSignal.timeout(8000),
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error',
        mode: 'cors',
      });
      text = await response.text();
    } catch {
      throw new ApiError(
        'Le service est injoignable. Réessayez plus tard.',
        null,
        'NETWORK_ERROR',
      );
    }
    let payload: unknown;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        /* Réponse non JSON : traitée selon le statut. */
      }
    }
    if (!response.ok) {
      const expected = errors[response.status];
      const detail =
        object(payload) && payload.success === false && object(payload.error)
          ? payload.error
          : undefined;
      const recognized =
        expected &&
        detail?.code === expected.code &&
        typeof detail.message === 'string';
      // Le code est conservé ; seul un message contrôlé par le contrat est affichable.
      throw new ApiError(
        recognized ? expected.message : 'La requête ne peut pas être traitée.',
        response.status,
        recognized ? expected.code : 'HTTP_ERROR',
        uuid(response.headers.get('X-Request-Id')) ??
          (object(payload) ? uuid(payload.requestId) : undefined),
        retryAfter(response.headers.get('Retry-After')),
      );
    }
    if (response.status === 204 || response.status === 205 || !text)
      return undefined as T;
    if (payload === undefined)
      throw new ApiError(
        'La réponse du service est invalide.',
        response.status,
        'INVALID_RESPONSE',
      );
    return payload as T;
  }
  function sendSession<T>(action: SessionAction, body?: unknown): Promise<T> {
    if (!['login', 'refresh', 'logout'].includes(action))
      return Promise.reject(
        new ApiError('Action de session invalide.', null, 'INVALID_PATH'),
      );
    return request<T>('/auth/' + action, {
      method: 'POST',
      headers: {
        'X-Candidly-CSRF': '1',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  function refresh(): Promise<AccessTokenResponse> {
    if (!refreshing) {
      refreshing = sendSession<unknown>('refresh')
        .then((value) => {
          if (
            !object(value) ||
            typeof value.accessToken !== 'string' ||
            !value.accessToken ||
            value.tokenType !== 'Bearer' ||
            !Number.isInteger(value.expiresIn) ||
            Number(value.expiresIn) <= 0
          )
            throw new ApiError(
              'La réponse du service est invalide.',
              200,
              'INVALID_RESPONSE',
            );
          return value as unknown as AccessTokenResponse;
        })
        .finally(() => {
          refreshing = undefined;
        });
    }
    return refreshing;
  }
  function sessionRequest<T>(
    action: SessionAction,
    body?: unknown,
  ): Promise<T> {
    return action === 'refresh'
      ? (refresh() as Promise<T>)
      : sendSession<T>(action, body);
  }
  return { request, sessionRequest, refresh };
}
// Pas de session ni de token partagé sur le serveur : la future couche navigateur
// créera et conservera sa propre instance pour utiliser refresh().
export function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return createApiClient().request<T>(path, options);
}
