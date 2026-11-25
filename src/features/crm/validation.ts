export type FieldErrors = Record<string, string>;
export function text(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}
export function lengthError(value: string, max: number, required = false) {
  const n = Array.from(value).length;
  return (required && !n) || n > max
    ? `Saisissez ${required ? 'entre 1 et' : 'au maximum'} ${max} caractères.`
    : undefined;
}
export function httpUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !!url.hostname &&
      !value.includes('\\') &&
      !/\s/u.test(value)
    );
  } catch {
    return false;
  }
}
export function changedFields<T extends object>(
  next: T,
  previous: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => value !== previous[key as keyof T],
    ),
  ) as Partial<T>;
}
export function safeExternal(value: string) {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
