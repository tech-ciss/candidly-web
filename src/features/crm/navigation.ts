import type { Query } from './contracts';
export function listDestination(kind: 'companies' | 'contacts', query: Query) {
  const params = new URLSearchParams(query);
  return `/account/${kind}${params.size ? `?${params}` : ''}`;
}
export function recordDestination(path: string, returnTo: string) {
  return `${path}?${new URLSearchParams({ returnTo })}`;
}
export function safeListReturn(
  kind: 'companies' | 'contacts',
  value: string | null,
) {
  const base = `/account/${kind}`;
  return value &&
    value.length < 3000 &&
    !Array.from(value).some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 92,
    ) &&
    (value === base || value.startsWith(base + '?'))
    ? value
    : base;
}
