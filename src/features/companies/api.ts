import type { SessionManager } from '@/features/auth/session';
import type { Company, CompanyInput } from './types';
import {
  invalidResponse,
  isObject,
  isUuid,
  nullableString,
  pageResponse,
  queryParams,
  resourceId,
  type Query,
} from '../crm/contracts';
export const companyQueryKeys = [
  'page',
  'limit',
  'status',
  'sortBy',
  'sortOrder',
  'search',
  'industry',
  'country',
  'city',
] as const;
export function companyResponse(value: unknown): Company {
  if (
    !isObject(value) ||
    !isUuid(value.id) ||
    typeof value.name !== 'string' ||
    !['ACTIVE', 'ARCHIVED'].includes(String(value.status)) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !nullableString(value.archivedAt)
  )
    throw invalidResponse();
  const optional = [
    'industry',
    'website',
    'country',
    'city',
    'address',
    'description',
    'notes',
  ] as const;
  if (!optional.every((key) => nullableString(value[key])))
    throw invalidResponse();
  return {
    id: value.id,
    name: value.name,
    status: value.status as Company['status'],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    archivedAt: value.archivedAt as string | null,
    ...Object.fromEntries(optional.map((key) => [key, value[key]])),
  } as Company;
}
export function companiesApi(session: SessionManager) {
  const path = (id: string): `/companies/${string}` =>
    `/companies/${resourceId(id)}`;
  return {
    list: (query: Query = {}, signal?: AbortSignal) =>
      session
        .request<unknown>('/companies', {
          query: queryParams(query, companyQueryKeys),
          signal,
        })
        .then((value) => pageResponse(value, companyResponse)),
    get: (id: string, signal?: AbortSignal) =>
      session.request<unknown>(path(id), { signal }).then(companyResponse),
    create: (data: CompanyInput) =>
      session
        .request<unknown>('/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        .then(companyResponse),
    update: (id: string, data: Partial<CompanyInput>) =>
      session
        .request<unknown>(path(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        .then(companyResponse),
    archive: (id: string) =>
      session
        .request<unknown>(`${path(id)}/archive`, { method: 'POST' })
        .then(companyResponse),
    restore: (id: string) =>
      session
        .request<unknown>(`${path(id)}/restore`, { method: 'POST' })
        .then(companyResponse),
    remove: (id: string) =>
      session.request<void>(path(id), { method: 'DELETE' }),
  };
}
