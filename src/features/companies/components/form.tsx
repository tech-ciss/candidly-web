'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
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
import { companyFields, companyValues } from '../validation';
import type { Company } from '../types';
export function CompanyEditor({ id }: { id?: string }) {
  const { companies } = useCrm();
  const state = useCrmQuery<Company | { new: boolean }>(
    `company:${id ?? 'new'}`,
    (s) => (id ? companies.get(id, s) : Promise.resolve({ new: true })),
  );
  return (
    <QueryBoundary state={state}>
      {(data) => (
        <CompanyForm
          key={id ?? 'new'}
          company={'id' in data ? data : undefined}
        />
      )}
    </QueryBoundary>
  );
}
export function CompanyForm({ company }: { company?: Company }) {
  const { companies } = useCrm();
  const router = useRouter();
  const action = useCrmAction();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState('');
  const params = useSearchParams();
  const back = safeListReturn('companies', params.get('returnTo'));
  return (
    <section className="crm">
      <CrmHeading
        title={company ? 'Modifier l’entreprise' : 'Nouvelle entreprise'}
      />
      <form
        className="auth-form crm-form"
        noValidate
        aria-busy={action.pending}
        onSubmit={(e) => {
          e.preventDefault();
          const result = companyValues(new FormData(e.currentTarget));
          setErrors(result.errors);
          setNotice('');
          if (Object.keys(result.errors).length) {
            focusInvalid(result.errors);
            return;
          }
          const patch = company
            ? changedFields(result.data, company)
            : result.data;
          if (!Object.keys(patch).length) {
            setNotice('Aucune modification à enregistrer.');
            return;
          }
          void action.run(
            () =>
              company
                ? companies.update(company.id, patch)
                : companies.create(result.data),
            (saved) =>
              router.push(
                `/account/companies/${saved.id}?${new URLSearchParams({ notice: company ? 'saved' : 'created', ...(params.get('returnTo') ? { returnTo: back } : {}) })}`,
              ),
          );
        }}
      >
        <fieldset disabled={action.pending}>
          <FormSection title="Informations principales">
            <DossierInputs
              fields={companyFields.slice(0, 3)}
              values={company}
              errors={errors}
            />
          </FormSection>
          <FormSection
            title="Localisation"
            optional
            initialOpen={hasValues(company, companyFields.slice(3, 6))}
          >
            <DossierInputs
              fields={companyFields.slice(3, 6)}
              values={company}
              errors={errors}
            />
          </FormSection>
          <FormSection
            title="Informations complémentaires"
            optional
            initialOpen={hasValues(company, companyFields.slice(6))}
          >
            <DossierInputs
              fields={companyFields.slice(6)}
              values={company}
              errors={errors}
            />
          </FormSection>
        </fieldset>
        {action.error != null && (
          <Feedback>
            {crmError(
              action.error,
              'Une entreprise porte déjà ce nom, éventuellement dans les archives.',
              true,
            )}
          </Feedback>
        )}
        {notice && <Feedback tone="info">{notice}</Feedback>}
        <div className="crm-actions crm-form-actions">
          <Button disabled={action.pending}>
            {action.pending
              ? 'Enregistrement…'
              : company
                ? 'Enregistrer les modifications'
                : 'Créer l’entreprise'}
          </Button>
          <Link
            href={
              company
                ? params.get('returnTo')
                  ? recordDestination(`/account/companies/${company.id}`, back)
                  : `/account/companies/${company.id}`
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
