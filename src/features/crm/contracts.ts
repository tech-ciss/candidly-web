import { ApiError } from '@/lib/api/client';
export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export type Query = Record<string, string>;
export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
export function resourceId(id: string) {
  if (!isUuid(id))
    throw new ApiError('Identifiant invalide.', 400, 'BAD_REQUEST');
  return id;
}
export const invalidResponse = () =>
  new ApiError('La réponse du service est invalide.', 200, 'INVALID_RESPONSE');
export const nullableString = (v: unknown) =>
  v === null || typeof v === 'string';
export function pageResponse<T>(
  v: unknown,
  decode: (value: unknown) => T,
): Page<T> {
  if (!isObject(v) || !Array.isArray(v.data) || !isObject(v.meta))
    throw invalidResponse();
  const { page, limit, total, totalPages } = v.meta;
  if (
    ![page, limit, total, totalPages].every((n) => Number.isInteger(n)) ||
    Number(page) < 1 ||
    Number(limit) < 1 ||
    Number(limit) > 100 ||
    Number(total) < 0 ||
    Number(totalPages) < 0
  )
    throw invalidResponse();
  return {
    data: v.data.map(decode),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Number(totalPages),
    },
  };
}
export function queryParams(
  query: Query,
  allowed: readonly string[],
): URLSearchParams {
  return new URLSearchParams(
    allowed.flatMap((key) =>
      query[key]?.trim() ? [[key, query[key]!.trim()]] : [],
    ),
  );
}
