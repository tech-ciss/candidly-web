'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { contactQueryKeys } from '../api';
import { CompanyPicker } from '@/features/companies/components/picker';
import { SortFields } from '@/features/companies/components/list';
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
import { ContactRecords } from '@/features/crm/records';
import { listDestination } from '@/features/crm/navigation';
export { ContactRecords } from '@/features/crm/records';
export function ContactList() {
  const { contacts } = useCrm();
  const query = useListQuery(contactQueryKeys);
  const state = useCrmQuery(`contacts:${new URLSearchParams(query)}`, (s) =>
    contacts.list(query, s),
  );
  const filtered = Object.entries(query).some(
    ([k, v]) => v && !['page', 'limit', 'sortBy', 'sortOrder'].includes(k),
  );
  return (
    <section className="crm">
      <CrmHeading
        title="Contacts"
        description="Les personnes qui font avancer votre parcours."
      >
        <Link className="crm-primary-link" href="/account/contacts/new">
          <Plus size={18} aria-hidden="true" />
          Ajouter un contact
        </Link>
      </CrmHeading>
      <Notice />
      <ListToolbar query={query} kind="contacts">
        <FilterField name="jobTitle" label="Fonction exacte" query={query} />
        <FilterField name="department" label="Service exact" query={query} />
        <FilterField name="sortBy" label="Trier par" query={query}>
          <option value="lastName">Nom</option>
          <option value="firstName">Prénom</option>
          <option value="createdAt">Date de création</option>
          <option value="updatedAt">Dernière modification</option>
        </FilterField>
        <SortFields query={query} />
        <CompanyPicker defaultId={query.companyId} />
      </ListToolbar>
      <QueryBoundary state={state}>
        {(page) => (
          <>
            {page.data.length ? (
              <ContactRecords
                contacts={page.data}
                returnTo={listDestination('contacts', query)}
              />
            ) : (
              <Empty
                title={
                  filtered
                    ? 'Aucun résultat pour ces critères'
                    : 'Un espace pour vos relations professionnelles'
                }
              >
                {filtered ? (
                  'Essayez un autre nom ou ajustez vos filtres.'
                ) : (
                  <>
                    Ajoutez un premier contact et associez-le à une entreprise.{' '}
                    <Link href="/account/contacts/new">Ajouter un contact</Link>
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
export function CompanyContacts({ companyId }: { companyId: string }) {
  const { contacts } = useCrm();
  const [page, setPage] = useState(1);
  const query = { page: String(page), limit: '20' };
  const state = useCrmQuery(`company-contacts:${companyId}:${page}`, (s) =>
    contacts.forCompany(companyId, query, s),
  );
  return (
    <section
      aria-labelledby="associated-contacts"
      className="crm-detail-section"
    >
      <div className="crm-section-heading">
        <h2 id="associated-contacts">Contacts associés</h2>
        <Link href={`/account/contacts/new?companyId=${companyId}`}>
          <Plus size={17} aria-hidden="true" />
          Ajouter un contact
        </Link>
      </div>
      <QueryBoundary state={state}>
        {(result) => (
          <>
            {result.data.length ? (
              <ContactRecords contacts={result.data} />
            ) : (
              <p className="crm-muted">
                Aucun contact associé. Ajoutez une personne avec qui vous
                souhaitez garder le lien.
              </p>
            )}
            <Pagination meta={result.meta} onPage={setPage} />
          </>
        )}
      </QueryBoundary>
    </section>
  );
}
