'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from './dialog';
import type { Query } from './contracts';
export function filterCount(query: Query, sortDefault: string) {
  const defaults: Query = {
    status: 'ACTIVE',
    sortBy: sortDefault,
    sortOrder: 'asc',
    limit: '20',
  };
  return Object.entries(query).filter(
    ([k, v]) => !['page', 'search'].includes(k) && v && v !== defaults[k],
  ).length;
}
export function ListToolbar({
  query,
  children,
  kind,
}: {
  query: Query;
  children: React.ReactNode;
  kind: 'companies' | 'contacts';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const committed = useRef(query.search ?? '');
  const queryKey = new URLSearchParams(query).toString();
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => {
    const params = new URLSearchParams(queryKey);
    const search = params.get('search') ?? '';
    if (committed.current !== search) {
      if (input.current) input.current.value = search;
      committed.current = search;
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [queryKey]);
  function search(value: string) {
    cancel();
    committed.current = value.trim();
    const params = new URLSearchParams(query);
    if (value.trim()) params.set('search', value.trim());
    else params.delete('search');
    params.set('page', '1');
    router.replace(`${pathname}?${params}`, { scroll: false });
  }
  const count = filterCount(query, kind === 'companies' ? 'name' : 'lastName');
  return (
    <div className="crm-toolbar">
      <form
        role="search"
        className="crm-search"
        onSubmit={(e) => {
          e.preventDefault();
          search(input.current?.value ?? '');
        }}
      >
        <label htmlFor="crm-list-search" className="sr-only">
          {kind === 'companies'
            ? 'Rechercher une entreprise'
            : 'Rechercher un contact'}
        </label>
        <Search size={19} aria-hidden="true" />
        <input
          ref={input}
          id="crm-list-search"
          name="search"
          type="search"
          placeholder={
            kind === 'companies'
              ? 'Nom, secteur ou ville…'
              : 'Nom, email ou fonction…'
          }
          defaultValue={query.search ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            cancel();
            timer.current = setTimeout(() => search(value), 350);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          aria-label="Effacer la recherche"
          onClick={() => {
            if (input.current) input.current.value = '';
            search('');
            input.current?.focus();
          }}
        >
          <X size={17} aria-hidden="true" />
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
        Filtres et tri
        {count > 0 && (
          <span className="crm-filter-count">
            {count}
            <span className="sr-only"> actifs</span>
          </span>
        )}
      </Button>
      <DialogPanel
        open={open}
        title="Filtres et tri"
        onClose={() => setOpen(false)}
      >
        <form
          key={queryKey}
          className="crm-filter-form"
          onSubmit={(e) => {
            e.preventDefault();
            cancel();
            const params = new URLSearchParams();
            for (const [key, value] of new FormData(e.currentTarget)) {
              if (typeof value === 'string' && value.trim())
                params.set(key, value.trim());
            }
            const term = input.current?.value.trim();
            if (term) params.set('search', term);
            params.set('page', '1');
            router.push(`${pathname}?${params}`, { scroll: false });
            setOpen(false);
          }}
        >
          <div className="crm-filter-grid">{children}</div>
          <footer className="crm-dialog-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                cancel();
                if (input.current) input.current.value = '';
                committed.current = '';
                router.push(pathname, { scroll: false });
                setOpen(false);
              }}
            >
              Réinitialiser
            </Button>
            <Button type="submit">Appliquer</Button>
          </footer>
        </form>
      </DialogPanel>
    </div>
  );
}
