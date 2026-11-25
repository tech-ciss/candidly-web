'use client';
import { useState } from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { FieldErrors } from './validation';
export interface Field {
  name: string;
  label: string;
  max: number;
  required?: boolean;
  multiline?: boolean;
}
function DossierInput({
  field,
  values,
  errors,
}: {
  field: Field;
  values?: object;
  errors: FieldErrors;
}) {
  const value = String(
    (values as Record<string, unknown> | undefined)?.[field.name] ?? '',
  );
  const [length, setLength] = useState(Array.from(value).length);
  const [focused, setFocused] = useState(false);
  const id = `crm-${field.name}`;
  const hint =
    !!errors[field.name] ||
    length >= field.max * 0.85 ||
    (focused && ['website', 'phone', 'linkedinUrl'].includes(field.name));
  const props = {
    id,
    name: field.name,
    defaultValue: value,
    'aria-invalid': !!errors[field.name],
    'aria-describedby':
      [errors[field.name] ? `${id}-error` : '', hint ? `${id}-hint` : '']
        .filter(Boolean)
        .join(' ') || undefined,
    required: field.required,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setLength(Array.from(e.target.value).length),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
  const type =
    field.name === 'email'
      ? 'email'
      : field.name === 'phone'
        ? 'tel'
        : ['website', 'linkedinUrl'].includes(field.name)
          ? 'url'
          : 'text';
  const autocomplete: Record<string, string> = {
    firstName: 'given-name',
    lastName: 'family-name',
    email: 'email',
    phone: 'tel',
    website: 'url',
    country: 'country-name',
    city: 'address-level2',
    address: 'street-address',
  };
  return (
    <div
      className={`crm-input-cell ${field.multiline || ['name', 'address', 'jobTitle', 'linkedinUrl'].includes(field.name) ? 'crm-input-wide' : ''}`}
    >
      <FormField
        id={id}
        label={`${field.label}${field.required ? ' (obligatoire)' : ''}`}
        error={errors[field.name]}
      >
        {field.multiline ? (
          <textarea {...props} rows={4} />
        ) : (
          <Input
            {...props}
            type={type}
            autoComplete={autocomplete[field.name] ?? 'off'}
          />
        )}{' '}
        {hint && (
          <small id={`${id}-hint`}>
            {field.name === 'phone'
              ? 'Format international : + puis 7 à 15 chiffres. '
              : ''}
            {length} / {field.max} caractères
          </small>
        )}
      </FormField>
    </div>
  );
}
export function DossierInputs({
  fields,
  values,
  errors,
}: {
  fields: readonly Field[];
  values?: object;
  errors: FieldErrors;
}) {
  return (
    <div className="crm-input-grid">
      {fields.map((field) => (
        <DossierInput
          key={field.name}
          field={field}
          values={values}
          errors={errors}
        />
      ))}
    </div>
  );
}
export function FormSection({
  title,
  children,
  optional = false,
  initialOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  optional?: boolean;
  initialOpen?: boolean;
}) {
  return optional ? (
    <details className="crm-form-section" open={initialOpen}>
      <summary>
        <span>{title}</span>
        <span className="crm-optional">Facultatif</span>
      </summary>
      <div className="crm-form-section-body">{children}</div>
    </details>
  ) : (
    <section className="crm-form-section">
      <h2>{title}</h2>
      <div className="crm-form-section-body">{children}</div>
    </section>
  );
}
export function hasValues(
  values: object | undefined,
  fields: readonly Field[],
) {
  return (
    !!values &&
    fields.some(
      (f) => !!String((values as Record<string, unknown>)[f.name] ?? '').trim(),
    )
  );
}
export function focusInvalid(errors: FieldErrors) {
  for (const key of Object.keys(errors)) {
    let parent = document
      .getElementById(`crm-${key === 'companyId' ? 'company' : key}`)
      ?.closest('details');
    while (parent) {
      parent.open = true;
      parent = parent.parentElement?.closest('details') ?? null;
    }
  }
  const key = Object.keys(errors)[0];
  document
    .getElementById(`crm-${key === 'companyId' ? 'company' : key}`)
    ?.focus();
}
