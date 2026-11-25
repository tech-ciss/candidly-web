'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { CompanyPicker } from '@/features/companies/components/picker';
import { useCrm, useCrmAction, useCrmQuery } from '@/features/crm/provider';
import { CrmHeading, QueryBoundary, crmError } from '@/features/crm/shared';
import {
  DossierInputs,
  focusInvalid,
  FormSection,
  hasValues,
} from '@/features/crm/form';
import { changedFields, type FieldErrors } from '@/features/crm/validation';
import { safeListReturn, recordDestination } from '@/features/crm/navigation';
import { contactFields, contactValues } from '../validation';
import type { Contact } from '../types';
export function ContactEditor({ id }: { id?: string }) {
  const { contacts } = useCrm();
  const state = useCrmQuery<Contact | { new: boolean }>(
    `contact:${id ?? 'new'}`,
    (s) => (id ? contacts.get(id, s) : Promise.resolve({ new: true })),
  );
  return (
    <QueryBoundary state={state}>
      {(data) => (
        <ContactForm
          key={id ?? 'new'}
          contact={'id' in data ? data : undefined}
        />
      )}
    </QueryBoundary>
  );
}
export function ContactForm({ contact }: { contact?: Contact }) {
  const { contacts } = useCrm();
  const router = useRouter();
  const params = useSearchParams();
  const action = useCrmAction();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState('');
  const back = safeListReturn('contacts', params.get('returnTo'));
  return (
    <section className="crm">
      <CrmHeading title={contact ? 'Modifier le contact' : 'Nouveau contact'} />
      <form
        className="auth-form crm-form"
        noValidate
        aria-busy={action.pending}
        onSubmit={(e) => {
          e.preventDefault();
          const result = contactValues(new FormData(e.currentTarget));
          setErrors(result.errors);
          setNotice('');
          if (Object.keys(result.errors).length) {
            focusInvalid(result.errors);
            return;
          }
          const patch = contact
            ? changedFields(result.data, contact)
            : result.data;
          if (!Object.keys(patch).length) {
            setNotice('Aucune modification à enregistrer.');
            return;
          }
          void action.run(
            () =>
              contact
                ? contacts.update(contact.id, patch)
                : contacts.create(result.data),
            (saved) =>
              router.push(
                `/account/contacts/${saved.id}?${new URLSearchParams({ notice: contact ? 'saved' : 'created', ...(params.get('returnTo') ? { returnTo: back } : {}) })}`,
              ),
          );
        }}
      >
        <fieldset disabled={action.pending}>
          <FormSection title="Informations principales">
            {' '}
            <CompanyPicker
              initial={contact?.company}
              defaultId={contact?.companyId ?? params.get('companyId') ?? ''}
              error={errors.companyId}
              required
            />
            <DossierInputs
              fields={contactFields.filter((f) =>
                ['firstName', 'lastName', 'jobTitle'].includes(f.name),
              )}
              values={contact}
              errors={errors}
            />
          </FormSection>
          <FormSection
            title="Coordonnées professionnelles"
            optional
            initialOpen={hasValues(
              contact,
              contactFields.filter((f) =>
                ['email', 'phone', 'linkedinUrl'].includes(f.name),
              ),
            )}
          >
            <DossierInputs
              fields={contactFields.filter((f) =>
                ['email', 'phone', 'linkedinUrl'].includes(f.name),
              )}
              values={contact}
              errors={errors}
            />
          </FormSection>
          <FormSection
            title="Informations complémentaires"
            optional
            initialOpen={hasValues(
              contact,
              contactFields.filter((f) =>
                ['department', 'notes'].includes(f.name),
              ),
            )}
          >
            <DossierInputs
              fields={contactFields.filter((f) =>
                ['department', 'notes'].includes(f.name),
              )}
              values={contact}
              errors={errors}
            />
          </FormSection>
        </fieldset>
        {action.error != null && (
          <Feedback>
            {crmError(
              action.error,
              'Le changement d’entreprise est bloqué par les relations ou l’historique de ce contact.',
              true,
            )}
          </Feedback>
        )}
        {notice && <Feedback tone="info">{notice}</Feedback>}
        <div className="crm-actions crm-form-actions">
          <Button disabled={action.pending}>
            {action.pending
              ? 'Enregistrement…'
              : contact
                ? 'Enregistrer les modifications'
                : 'Créer le contact'}
          </Button>
          <Link
            href={
              contact
                ? params.get('returnTo')
                  ? recordDestination(`/account/contacts/${contact.id}`, back)
                  : `/account/contacts/${contact.id}`
                : back
            }
          >
            Annuler
          </Link>
        </div>
      </form>
    </section>
  );
}
