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
    url.hash
  )
    throw new Error(
      'NEXT_PUBLIC_API_URL doit être une URL HTTP(S) sans identifiants ni paramètres.',
    );
  return url.toString().replace(/\/$/, '');
}
