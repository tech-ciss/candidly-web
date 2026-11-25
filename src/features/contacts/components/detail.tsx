'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Mail, Phone, Pencil } from 'lucide-react';
import { Feedback } from '@/components/ui/feedback';
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
import { initials } from '@/features/crm/account-shell';
import { linkedinUrl } from '../validation';
export function contactAction(
  protocol: 'mailto' | 'tel',
  value: string | null,
) {
  if (!value) return null;
  if (protocol === 'mailto' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value))
    return `mailto:${encodeURIComponent(value)}`;
  if (protocol === 'tel' && /^\+[1-9][0-9]{6,14}$/.test(value))
    return `tel:${value}`;
  return null;
}
export function ContactDetail({ id }: { id: string }) {
  const { contacts } = useCrm();
  const state = useCrmQuery(`contact:${id}`, (s) => contacts.get(id, s));
  const action = useCrmAction();
  const router = useRouter();
  const params = useSearchParams();
  const back = safeListReturn('contacts', params.get('returnTo'));
  return (
    <section className="crm">
      <Link className="crm-back-link" href={back}>
        Tous les contacts
      </Link>
      <Notice />
      <QueryBoundary state={state}>
        {(contact) => {
          const email = contactAction('mailto', contact.email);
          const phone = contactAction('tel', contact.phone);
          const linkedin =
            contact.linkedinUrl && linkedinUrl(contact.linkedinUrl)
              ? safeExternal(contact.linkedinUrl)
              : null;
          return (
            <>
              <div className="crm-dossier-identity">
                <span
                  className="app-avatar app-avatar-large"
                  aria-hidden="true"
                >
                  {initials(contact.firstName, contact.lastName)}
                </span>
                <div>
                  <CrmHeading
                    title={`${contact.firstName} ${contact.lastName}`}
                    description={contact.jobTitle ?? 'Contact professionnel'}
                  />
                  <Link href={`/account/companies/${contact.companyId}`}>
                    {contact.company.name}
                  </Link>
                </div>
              </div>
              <div
                className="crm-quick-actions"
                aria-label="Actions du contact"
              >
                <Link
                  className="crm-primary-link"
                  href={recordDestination(`/account/contacts/${id}/edit`, back)}
                >
                  <Pencil size={17} aria-hidden="true" />
                  Modifier
                </Link>
                {email && (
                  <a className="crm-secondary-link" href={email}>
                    <Mail size={17} aria-hidden="true" />
                    Envoyer un email
                  </a>
                )}
                {phone && (
                  <a className="crm-secondary-link" href={phone}>
                    <Phone size={17} aria-hidden="true" />
                    Appeler
                  </a>
                )}
                {linkedin && (
                  <a
                    className="crm-secondary-link"
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                    Ouvrir LinkedIn
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                )}
              </div>
              <div className="crm-detail-grid">
                <DetailSection title="Informations professionnelles">
                  <DossierFields
                    entries={[
                      ['Prénom', contact.firstName],
                      ['Nom', contact.lastName],
                      ['Fonction', contact.jobTitle],
                      ['Service', contact.department],
                    ]}
                  />
                </DetailSection>
                <DetailSection title="Coordonnées">
                  <DossierFields
                    entries={[
                      ['Email professionnel', contact.email],
                      ['Téléphone', contact.phone],
                      ['LinkedIn', contact.linkedinUrl],
                    ]}
                  />
                </DetailSection>
              </div>
              <DetailSection title="Entreprise associée">
                <p>
                  <Link href={`/account/companies/${contact.companyId}`}>
                    {contact.company.name}
                  </Link>
                </p>
                <CompanyStatus status={contact.company.status} />
              </DetailSection>
              <DetailSection title="Notes personnelles">
                <p className="crm-prose">
                  {contact.notes || 'Aucune note personnelle pour le moment.'}
                </p>
              </DetailSection>
              <details className="crm-admin">
                <summary>Informations du dossier</summary>
                <DossierFields
                  entries={[
                    [
                      'Création',
                      new Date(contact.createdAt).toLocaleDateString('fr'),
                    ],
                    [
                      'Dernière modification',
                      new Date(contact.updatedAt).toLocaleDateString('fr'),
                    ],
                  ]}
                />
              </details>
              <section
                className="crm-management"
                aria-label="Gestion du contact"
              >
                <h2>Gestion du contact</h2>
                <p>
                  La suppression est définitive. Les relations existantes
                  peuvent empêcher cette opération.
                </p>
                <Confirmation
                  destructive
                  label="Supprimer le contact"
                  description="Supprimer définitivement ce contact ? Cette action est irréversible et peut être refusée si des relations existent."
                  pending={action.pending}
                  onConfirm={() =>
                    void action.run(
                      () => contacts.remove(id),
                      () =>
                        router.push(
                          `${back}${back.includes('?') ? '&' : '?'}notice=deleted`,
                        ),
                    )
                  }
                />
                {action.error != null && (
                  <Feedback>
                    {crmError(
                      action.error,
                      'Ce contact est utilisé par d’autres dossiers. Ses relations empêchent sa suppression.',
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
