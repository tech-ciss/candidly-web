'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { companyQueryKeys } from '../api';
import { useCrm, useCrmQuery } from '@/features/crm/provider';
import {
  CrmHeading,
  Empty,
  FilterField,
  Notice,
  Pagination,
  QueryBoundary,
  useListQuery,
} from '@/features/crm/shared';
import { ListToolbar } from '@/features/crm/toolbar';
import { CompanyRecords } from '@/features/crm/records';
import { listDestination } from '@/features/crm/navigation';
export function CompanyList() {
  const { companies } = useCrm();
  const query = useListQuery(companyQueryKeys);
  const state = useCrmQuery(`companies:${new URLSearchParams(query)}`, (s) =>
    companies.list(query, s),
  );
  const filtered = Object.entries(query).some(
    ([k, v]) => v && !['page', 'limit', 'sortBy', 'sortOrder'].includes(k),
  );
  return (
    <section className="crm">
      <CrmHeading
        title="Entreprises"
        description="Vos organisations cibles, au même endroit."
      >
        <Link className="crm-primary-link" href="/account/companies/new">
          <Plus size={18} aria-hidden="true" />
          Ajouter une entreprise
        </Link>
      </CrmHeading>
      <Notice />
      <ListToolbar query={query} kind="companies">
        <FilterField name="status" label="État" query={query}>
          <option value="ACTIVE">Actives</option>
          <option value="ARCHIVED">Archivées</option>
        </FilterField>
        <FilterField name="industry" label="Secteur exact" query={query} />
        <FilterField name="country" label="Pays exact" query={query} />
        <FilterField name="city" label="Ville exacte" query={query} />
        <FilterField name="sortBy" label="Trier par" query={query}>
          <option value="name">Nom</option>
          <option value="createdAt">Date de création</option>
          <option value="updatedAt">Dernière modification</option>
        </FilterField>
        <SortFields query={query} />
      </ListToolbar>
      <QueryBoundary state={state}>
        {(page) => (
          <>
            {page.data.length ? (
              <CompanyRecords
                companies={page.data}
                returnTo={listDestination('companies', query)}
              />
            ) : (
              <Empty
                title={
                  filtered
                    ? 'Aucun résultat pour ces critères'
                    : 'Vos premières entreprises vous attendent'
                }
              >
                {filtered ? (
                  'Essayez un autre nom ou ajustez vos filtres.'
                ) : (
                  <>
                    Créez un dossier pour réunir ses informations et ses
                    contacts.{' '}
                    <Link href="/account/companies/new">
                      Ajouter une entreprise
                    </Link>
                  </>
                )}
              </Empty>
            )}
            <Pagination meta={page.meta} query={query} />
          </>
        )}
      </QueryBoundary>
    </section>
  );
}
export function SortFields({ query }: { query: Record<string, string> }) {
  return (
    <>
      <FilterField name="sortOrder" label="Ordre" query={query}>
        <option value="asc">Croissant</option>
        <option value="desc">Décroissant</option>
      </FilterField>
      <FilterField name="limit" label="Résultats par page" query={query}>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </FilterField>
    </>
  );
}
