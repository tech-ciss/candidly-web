import type { SessionManager } from '@/features/auth/session';
import type { Contact, ContactInput } from './types';
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
export const contactQueryKeys = [
  'page',
  'limit',
  'companyId',
  'search',
  'jobTitle',
  'department',
  'sortBy',
  'sortOrder',
] as const;
export function contactResponse(v: unknown): Contact {
  const optional = [
    'jobTitle',
    'department',
    'email',
    'phone',
    'linkedinUrl',
    'notes',
  ] as const;
  if (
    !isObject(v) ||
    !isUuid(v.id) ||
    !isUuid(v.companyId) ||
    typeof v.firstName !== 'string' ||
    typeof v.lastName !== 'string' ||
    typeof v.createdAt !== 'string' ||
    typeof v.updatedAt !== 'string' ||
    !optional.every((k) => nullableString(v[k])) ||
    !isObject(v.company) ||
    v.company.id !== v.companyId ||
    typeof v.company.name !== 'string' ||
    !['ACTIVE', 'ARCHIVED'].includes(String(v.company.status))
  )
    throw invalidResponse();
  return {
    id: v.id,
    companyId: v.companyId,
    firstName: v.firstName,
    lastName: v.lastName,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    company: {
      id: v.companyId,
      name: v.company.name,
      status: v.company.status as 'ACTIVE' | 'ARCHIVED',
    },
    ...Object.fromEntries(optional.map((k) => [k, v[k]])),
  } as Contact;
}
export function contactsApi(session: SessionManager) {
  const path = (id: string): `/contacts/${string}` =>
    `/contacts/${resourceId(id)}`;
  return {
    list: (query: Query = {}, signal?: AbortSignal) =>
      session
        .request<unknown>('/contacts', {
          query: queryParams(query, contactQueryKeys),
          signal,
        })
        .then((v) => pageResponse(v, contactResponse)),
    forCompany: (id: string, query: Query = {}, signal?: AbortSignal) =>
      session
        .request<unknown>(`/companies/${resourceId(id)}/contacts`, {
          query: queryParams(query, contactQueryKeys),
          signal,
        })
        .then((v) => pageResponse(v, contactResponse)),
    get: (id: string, signal?: AbortSignal) =>
      session.request<unknown>(path(id), { signal }).then(contactResponse),
    create: (data: ContactInput) =>
      session
        .request<unknown>('/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        .then(contactResponse),
    update: (id: string, data: Partial<ContactInput>) =>
      session
        .request<unknown>(path(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        .then(contactResponse),
    remove: (id: string) =>
      session.request<void>(path(id), { method: 'DELETE' }),
  };
}
