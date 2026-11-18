export function getApiBaseUrl(value = process.env.NEXT_PUBLIC_API_URL): string {
  if (!value) throw new Error('NEXT_PUBLIC_API_URL est obligatoire.');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL doit être une URL HTTP(S) valide.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /[\\\s]/.test(value) ||
    /%2e|%2f|%5c/i.test(url.pathname) ||
    (url.pathname !== '/api/v1' && url.pathname !== '/api/v1/') ||
    (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
  )
    throw new Error(
      'NEXT_PUBLIC_API_URL exige une URL HTTP(S) sans identifiants ni paramètres, préfixe /api/v1 et HTTPS en production.',
    );
  return url.toString().replace(/\/$/, '');
}
