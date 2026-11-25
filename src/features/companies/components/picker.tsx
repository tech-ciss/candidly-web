'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCrm, useCrmQuery } from '@/features/crm/provider';
import { Pagination, QueryBoundary } from '@/features/crm/shared';
import { DialogPanel } from '@/features/crm/dialog';
import type { Company } from '../types';
type Selection = Pick<Company, 'id' | 'name' | 'status'>;
export function CompanyPicker({
  initial,
  error,
  required = false,
  defaultId = '',
}: {
  initial?: Selection;
  error?: string;
  required?: boolean;
  defaultId?: string;
}) {
  const { companies } = useCrm();
  const [selected, setSelected] = useState(initial?.id ?? defaultId);
  const [known, setKnown] = useState(initial);
  const [open, setOpen] = useState(false);
  const initialState = useCrmQuery(`picker-selected:${defaultId}`, (s) =>
    defaultId ? companies.get(defaultId, s) : Promise.resolve(null),
  );
  const company =
    known?.id === selected
      ? known
      : initialState.data?.id === selected
        ? initialState.data
        : undefined;
  return (
    <div className="crm-company-picker">
      <label htmlFor="crm-company">
        Entreprise{required ? ' (obligatoire)' : ''}
      </label>
      <input type="hidden" name="companyId" value={company?.id ?? ''} />
      <Button
        id="crm-company"
        type="button"
        variant="outline"
        className="crm-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={!!error}
        aria-describedby={error ? 'crm-company-error' : undefined}
        aria-label={
          company
            ? `Entreprise : ${company.name}. Changer`
            : 'Choisir une entreprise'
        }
        onClick={() => setOpen(true)}
      >
        <Building2 size={19} aria-hidden="true" />
        <span>
          {company?.name ??
            (required ? 'Choisir une entreprise' : 'Toutes les entreprises')}
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </Button>
      {company && (
        <small>
          {company.status === 'ARCHIVED'
            ? 'Entreprise archivée sélectionnée'
            : 'Entreprise sélectionnée'}{' '}
          : {company.name}
        </small>
      )}
      {error && (
        <p id="crm-company-error" role="alert">
          {error}
        </p>
      )}
      {defaultId && initialState.status === 'error' && (
        <p role="alert">
          L’entreprise proposée est introuvable ou inaccessible. Choisissez une
          autre entreprise.
        </p>
      )}
      <DialogPanel
        open={open}
        title="Choisir une entreprise"
        onClose={() => setOpen(false)}
      >
        <CompanyChoices
          selected={company?.id ?? ''}
          required={required}
          onPick={(value) => {
            setKnown(value);
            setSelected(value?.id ?? '');
            setOpen(false);
          }}
        />
      </DialogPanel>
    </div>
  );
}
function CompanyChoices({
  selected,
  required,
  onPick,
}: {
  selected: string;
  required: boolean;
  onPick: (company: Selection | undefined) => void;
}) {
  const { companies } = useCrm();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState({
    search: '',
    status: 'ACTIVE',
    page: '1',
    limit: '20',
  });
  // The timer belongs to this transient panel; closing it cancels the pending search.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const state = useCrmQuery(`picker:${new URLSearchParams(query)}`, (s) =>
    companies.list(query, s),
  );
  return (
    <div className="crm-picker-options">
      <label className="crm-picker-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Rechercher une entreprise</span>
        <input
          autoFocus
          type="search"
          placeholder="Rechercher par nom, secteur ou ville…"
          value={draft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const value = e.target.value;
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(
              () =>
                setQuery((q) => ({ ...q, search: value.trim(), page: '1' })),
              350,
            );
          }}
        />
      </label>
      <label className="crm-picker-status">
        État des entreprises
        <select
          value={query.status}
          onChange={(e) =>
            setQuery((q) => ({ ...q, status: e.target.value, page: '1' }))
          }
        >
          <option value="ACTIVE">Actives</option>
          <option value="ARCHIVED">Archivées</option>
        </select>
      </label>
      {!required && (
        <Button type="button" variant="ghost" onClick={() => onPick(undefined)}>
          Toutes les entreprises
        </Button>
      )}
      <QueryBoundary state={state}>
        {(page) => (
          <>
            {page.data.length ? (
              <ul
                className="crm-company-options"
                aria-label="Entreprises accessibles"
              >
                {page.data.map((company) => (
                  <li key={company.id}>
                    <button
                      data-company-choice
                      type="button"
                      aria-pressed={selected === company.id}
                      onClick={() => onPick(company)}
                    >
                      <span>
                        <strong>{company.name}</strong>
                        <small>
                          {[company.industry, company.city]
                            .filter(Boolean)
                            .join(', ') || 'Entreprise de votre espace'}
                        </small>
                      </span>
                      {selected === company.id && (
                        <Check size={20} aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="crm-empty">
                <p>Aucune entreprise ne correspond.</p>
                <Link href="/account/companies/new">Créer une entreprise</Link>
              </div>
            )}
            <Pagination
              meta={page.meta}
              onPage={(page) => setQuery((q) => ({ ...q, page: String(page) }))}
            />
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
