'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ExternalLink, Plus, Pencil } from 'lucide-react';
import { Feedback } from '@/components/ui/feedback';
import { CompanyContacts } from '@/features/contacts/components/list';
import { useCrm, useCrmAction, useCrmQuery } from '@/features/crm/provider';
import {
  CompanyStatus,
  Confirmation,
  CrmHeading,
  DetailSection,
  DossierFields,
  Notice,
  QueryBoundary,
  crmError,
} from '@/features/crm/shared';
import { safeExternal } from '@/features/crm/validation';
import { safeListReturn, recordDestination } from '@/features/crm/navigation';
export function CompanyDetail({ id }: { id: string }) {
  const { companies } = useCrm();
  const state = useCrmQuery(`company:${id}`, (s) => companies.get(id, s));
  const action = useCrmAction();
  const router = useRouter();
  const params = useSearchParams();
  const back = safeListReturn('companies', params.get('returnTo'));
  return (
    <section className="crm">
      <Link className="crm-back-link" href={back}>
        Toutes les entreprises
      </Link>
      <Notice />
      <QueryBoundary state={state}>
        {(company) => {
          const website = company.website
            ? safeExternal(company.website)
            : null;
          return (
            <>
              <div className="crm-dossier-identity">
                <span className="crm-dossier-symbol" aria-hidden="true">
                  <Building2 size={30} />
                </span>
                <div>
                  <CrmHeading
                    title={company.name}
                    description={
                      [company.industry, company.city, company.country]
                        .filter(Boolean)
                        .join(', ') || 'Dossier entreprise'
                    }
                  />
                  <CompanyStatus status={company.status} />
                </div>
              </div>
              <div
                className="crm-quick-actions"
                aria-label="Actions du dossier"
              >
                <Link
                  className="crm-primary-link"
                  href={recordDestination(
                    `/account/companies/${id}/edit`,
                    back,
                  )}
                >
                  <Pencil size={17} aria-hidden="true" />
                  Modifier
                </Link>
                {website && (
                  <a
                    className="crm-secondary-link"
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                    Ouvrir le site web
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                )}
                <Link
                  className="crm-secondary-link"
                  href={`/account/contacts/new?companyId=${id}`}
                >
                  <Plus size={17} aria-hidden="true" />
                  Ajouter un contact
                </Link>
              </div>
              <div className="crm-detail-grid">
                <DetailSection title="Informations générales">
                  <DossierFields
                    entries={[
                      ['Nom', company.name],
                      ['Secteur', company.industry],
                      ['Site web', company.website],
                    ]}
                  />
                </DetailSection>
                <DetailSection title="Localisation">
                  <DossierFields
                    entries={[
                      ['Pays', company.country],
                      ['Ville', company.city],
                      ['Adresse', company.address],
                    ]}
                  />
                </DetailSection>
              </div>
              <CompanyContacts companyId={id} />
              <DetailSection title="Description et notes personnelles">
                <DossierFields
                  entries={[
                    ['Description', company.description],
                    ['Notes', company.notes],
                  ]}
                />
              </DetailSection>
              <details className="crm-admin">
                <summary>Informations du dossier</summary>
                <DossierFields
                  entries={[
                    [
                      'Création',
                      new Date(company.createdAt).toLocaleDateString('fr'),
                    ],
                    [
                      'Dernière modification',
                      new Date(company.updatedAt).toLocaleDateString('fr'),
                    ],
                    ...(company.archivedAt
                      ? [
                          [
                            'Archivage',
                            new Date(company.archivedAt).toLocaleDateString(
                              'fr',
                            ),
                          ] as [string, string],
                        ]
                      : []),
                  ]}
                />
              </details>
              <section
                className="crm-management"
                aria-label="Gestion du dossier"
              >
                <h2>Gestion du dossier</h2>
                <p>
                  L’archivage conserve les contacts et les relations. Une
                  suppression est définitive et peut être refusée si ce dossier
                  est utilisé.
                </p>
                <div className="crm-actions">
                  <Confirmation
                    key={company.status}
                    label={
                      company.status === 'ACTIVE' ? 'Archiver' : 'Restaurer'
                    }
                    description={
                      company.status === 'ACTIVE'
                        ? 'Archiver cette entreprise ? Ses contacts seront conservés.'
                        : 'Restaurer cette entreprise dans la liste des entreprises actives ?'
                    }
                    pending={action.pending}
                    onConfirm={() =>
                      void action.run(
                        () =>
                          company.status === 'ACTIVE'
                            ? companies.archive(id)
                            : companies.restore(id),
                        () =>
                          router.replace(
                            `/account/companies/${id}?${new URLSearchParams({ notice: company.status === 'ACTIVE' ? 'archived' : 'restored', returnTo: back })}`,
                          ),
                      )
                    }
                  />
                  <Confirmation
                    destructive
                    label="Supprimer l’entreprise"
                    description="Supprimer définitivement ce dossier ? Cette action est irréversible et reste soumise aux relations existantes."
                    pending={action.pending}
                    onConfirm={() =>
                      void action.run(
                        () => companies.remove(id),
                        () =>
                          router.push(
                            `${back}${back.includes('?') ? '&' : '?'}notice=deleted`,
                          ),
                      )
                    }
                  />
                </div>
                {action.error != null && (
                  <Feedback>
                    {crmError(
                      action.error,
                      'Cette entreprise possède des relations. Archivez-la pour conserver les contacts et l’historique.',
                      true,
                    )}
                  </Feedback>
                )}
              </section>
            </>
          );
        }}
      </QueryBoundary>
    </section>
  );
}
