'use client';
import Link from 'next/link';
import { useState, useRef, useId } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Page, Query } from './contracts';
import type { QueryState } from './store';
export function crmError(error: unknown, conflict?: string, mutation = false) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Vérifiez les champs et les formats saisis.';
      case 401:
        return 'Votre session a expiré. Reconnectez-vous.';
      case 403:
        return 'Cette action n’est pas autorisée.';
      case 404:
        return 'Ce dossier est introuvable ou inaccessible.';
      case 409:
        return (
          conflict ??
          'Cette opération est bloquée par les relations du dossier.'
        );
      case 429:
        return `Trop de demandes. Réessayez plus tard.${error.retryAfter ? ` Délai indiqué : ${error.retryAfter}.` : ''}`;
    }
  }
  return mutation
    ? 'La confirmation n’a pas été reçue. Consultez le dossier avant de renouveler cette action.'
    : 'Le service est indisponible. Vérifiez votre connexion puis réessayez.';
}
export function QueryBoundary<T>({
  state,
  children,
}: {
  state: QueryState<T> & { retry: () => void };
  children: (data: T) => React.ReactNode;
}) {
  if (state.status === 'error')
    return (
      <div>
        <Feedback>{crmError(state.error)}</Feedback>
        <Button variant="outline" onClick={state.retry}>
          Réessayer
        </Button>
      </div>
    );
  if (state.status !== 'ready' || !state.data)
    return (
      <div className="crm-loading" aria-busy="true">
        <p className="loading-state" role="status">
          Chargement des dossiers…
        </p>
        <div className="crm-loading-lines" aria-hidden="true">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </div>
    );
  return children(state.data);
}
export function CrmHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="crm-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="crm-actions">{children}</div>
    </header>
  );
}
export function CompanyStatus({ status }: { status: 'ACTIVE' | 'ARCHIVED' }) {
  return (
    <span
      className={`crm-status ${status === 'ACTIVE' ? 'crm-status-active' : ''}`}
    >
      {status === 'ACTIVE' ? 'Active' : 'Archivée'}
    </span>
  );
}
export function Empty({
  children,
  title = 'Aucun dossier à afficher',
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="crm-empty">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function useListQuery(keys: readonly string[]) {
  const params = useSearchParams();
  const query: Query = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value) query[key] = value;
  }
  return query;
}
export function FilterField({
  name,
  label,
  query,
  children,
}: {
  name: string;
  label: string;
  query: Query;
  children?: React.ReactNode;
}) {
  return (
    <label className="crm-filter-field">
      {label}
      {children ? (
        <select name={name} defaultValue={query[name] ?? ''}>
          {children}
        </select>
      ) : (
        <input name={name} defaultValue={query[name] ?? ''} />
      )}
    </label>
  );
}
export function Pagination({
  meta,
  query,
  onPage,
}: {
  meta: Page<unknown>['meta'];
  query?: Query;
  onPage?: (page: number) => void;
}) {
  const pathname = usePathname();
  function control(page: number, label: string) {
    if (onPage)
      return (
        <Button type="button" variant="outline" onClick={() => onPage(page)}>
          {label}
        </Button>
      );
    return (
      <Link
        href={`${pathname}?${new URLSearchParams({ ...query, page: String(page) })}`}
      >
        {label}
      </Link>
    );
  }
  return (
    <nav className="crm-pagination" aria-label="Pagination">
      <p>
        {meta.total} résultat{meta.total !== 1 ? 's' : ''}
        {meta.totalPages > 0
          ? ` — Page ${meta.page} sur ${meta.totalPages}`
          : ''}
      </p>
      <div className="crm-actions">
        {meta.page > 1 && control(meta.page - 1, 'Précédente')}
        {meta.page < meta.totalPages && control(meta.page + 1, 'Suivante')}
      </div>
    </nav>
  );
}
export function Confirmation({
  label,
  description,
  pending,
  onConfirm,
  destructive = false,
}: {
  label: string;
  description: string;
  pending: boolean;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className={`crm-confirm ${destructive ? 'is-destructive' : ''}`}>
      <Button
        ref={trigger}
        variant="outline"
        disabled={pending}
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => cancel.current?.focus());
        }}
      >
        {label}
      </Button>
      {open && (
        <section
          className="crm-confirm-panel"
          aria-label={`Confirmation : ${label}`}
        >
          <p>{description}</p>
          <div className="crm-actions">
            <Button disabled={pending} onClick={onConfirm}>
              {pending ? 'Traitement…' : `Confirmer : ${label.toLowerCase()}`}
            </Button>
            <Button
              ref={cancel}
              variant="outline"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              Annuler
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
export function Notice() {
  const p = useSearchParams();
  const messages: Record<string, string> = {
    created: 'Dossier créé.',
    saved: 'Modifications enregistrées.',
    deleted: 'Dossier supprimé.',
    archived: 'Entreprise archivée.',
    restored: 'Entreprise restaurée.',
  };
  const message = messages[p.get('notice') ?? ''];
  return message ? <Feedback tone="success">{message}</Feedback> : null;
}
export function DossierFields({
  entries,
}: {
  entries: [string, string | null | undefined][];
}) {
  return (
    <dl className="crm-fields">
      {entries.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || 'Non renseigné'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <section className="crm-detail-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
