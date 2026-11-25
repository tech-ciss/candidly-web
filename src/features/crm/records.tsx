'use client';
import Link from 'next/link';
import { Building2, Ellipsis, UserRound } from 'lucide-react';
import { CompanyStatus } from './shared';
import { recordDestination } from './navigation';
import type { Company } from '@/features/companies/types';
import type { Contact } from '@/features/contacts/types';
function Actions({
  name,
  view,
  edit,
}: {
  name: string;
  view: string;
  edit: string;
}) {
  return (
    <details className="crm-row-menu">
      <summary aria-label={`Actions pour ${name}`}>
        <Ellipsis aria-hidden="true" size={21} />
      </summary>
      <div>
        <Link href={view}>Ouvrir le dossier</Link>
        <Link href={edit}>
          Modifier<span className="sr-only"> {name}</span>
        </Link>
      </div>
    </details>
  );
}
export function CompanyRecords({
  companies,
  returnTo,
}: {
  companies: Company[];
  returnTo: string;
}) {
  return (
    <>
      <div className="crm-table-wrap">
        <table className="crm-table" aria-label="Entreprises">
          <thead>
            <tr>
              <th scope="col">Entreprise</th>
              <th scope="col">Secteur</th>
              <th scope="col">Localisation</th>
              <th scope="col">État</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  <Link
                    href={recordDestination(
                      `/account/companies/${c.id}`,
                      returnTo,
                    )}
                    className="crm-record-name"
                  >
                    {c.name}
                  </Link>
                </th>
                <td>{c.industry || 'Non renseigné'}</td>
                <td>
                  {[c.city, c.country].filter(Boolean).join(', ') ||
                    'Non renseignée'}
                </td>
                <td>
                  <CompanyStatus status={c.status} />
                </td>
                <td>
                  <Actions
                    name={c.name}
                    view={recordDestination(
                      `/account/companies/${c.id}`,
                      returnTo,
                    )}
                    edit={recordDestination(
                      `/account/companies/${c.id}/edit`,
                      returnTo,
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="crm-mobile-records" aria-label="Dossiers entreprises">
        {companies.map((c) => (
          <li key={c.id}>
            <div className="crm-record-symbol">
              <Building2 size={21} aria-hidden="true" />
            </div>
            <div className="crm-record-body">
              <Link
                href={recordDestination(`/account/companies/${c.id}`, returnTo)}
                className="crm-record-name"
              >
                {c.name}
              </Link>
              <p>{c.industry || 'Secteur non renseigné'}</p>
              <p>
                {[c.city, c.country].filter(Boolean).join(', ') ||
                  'Localisation non renseignée'}
              </p>
              <CompanyStatus status={c.status} />
            </div>
            <Actions
              name={c.name}
              view={recordDestination(`/account/companies/${c.id}`, returnTo)}
              edit={recordDestination(
                `/account/companies/${c.id}/edit`,
                returnTo,
              )}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
export function ContactRecords({
  contacts,
  returnTo = '/account/contacts',
}: {
  contacts: Contact[];
  returnTo?: string;
}) {
  const back = returnTo;
  return (
    <>
      <div className="crm-table-wrap">
        <table className="crm-table" aria-label="Contacts">
          <thead>
            <tr>
              <th scope="col">Contact</th>
              <th scope="col">Fonction</th>
              <th scope="col">Entreprise</th>
              <th scope="col">Coordonnées</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  <Link
                    className="crm-record-name"
                    href={recordDestination(`/account/contacts/${c.id}`, back)}
                  >
                    {c.firstName} {c.lastName}
                  </Link>
                </th>
                <td>{c.jobTitle || 'Non renseignée'}</td>
                <td>
                  <Link href={`/account/companies/${c.companyId}`}>
                    {c.company.name}
                  </Link>
                </td>
                <td>{c.email || c.phone || 'Non renseignées'}</td>
                <td>
                  <Actions
                    name={`${c.firstName} ${c.lastName}`}
                    view={recordDestination(`/account/contacts/${c.id}`, back)}
                    edit={recordDestination(
                      `/account/contacts/${c.id}/edit`,
                      back,
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="crm-mobile-records" aria-label="Dossiers contacts">
        {contacts.map((c) => (
          <li key={c.id}>
            <div className="crm-record-symbol">
              <UserRound size={21} aria-hidden="true" />
            </div>
            <div className="crm-record-body">
              <Link
                className="crm-record-name"
                href={recordDestination(`/account/contacts/${c.id}`, back)}
              >
                {c.firstName} {c.lastName}
              </Link>
              <p>{c.jobTitle || 'Fonction non renseignée'}</p>
              <Link
                className="crm-record-company"
                href={`/account/companies/${c.companyId}`}
              >
                {c.company.name}
              </Link>
              {(c.email || c.phone) && <p>{c.email || c.phone}</p>}
            </div>
            <Actions
              name={`${c.firstName} ${c.lastName}`}
              view={recordDestination(`/account/contacts/${c.id}`, back)}
              edit={recordDestination(`/account/contacts/${c.id}/edit`, back)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
