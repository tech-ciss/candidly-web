import type { CompanyInput } from './types';
import {
  text,
  lengthError,
  httpUrl,
  type FieldErrors,
} from '../crm/validation';
export const companyFields = [
  { name: 'name', label: 'Nom de l’entreprise', max: 150, required: true },
  { name: 'industry', label: 'Secteur', max: 100 },
  { name: 'website', label: 'Site web', max: 2048 },
  { name: 'country', label: 'Pays', max: 100 },
  { name: 'city', label: 'Ville', max: 100 },
  { name: 'address', label: 'Adresse', max: 255 },
  { name: 'description', label: 'Description', max: 2000, multiline: true },
  { name: 'notes', label: 'Notes', max: 5000, multiline: true },
] as const;
export function companyValues(form: FormData) {
  const errors: FieldErrors = {};
  const data: Record<string, string | null> = {};
  for (const field of companyFields) {
    let value = text(form.get(field.name));
    if (field.name === 'name')
      value = value.normalize('NFC').replace(/\s+/gu, ' ');
    const error = lengthError(value, field.max, field.name === 'name');
    if (error) errors[field.name] = error;
    data[field.name] = value || null;
  }
  if (data.website && !httpUrl(data.website))
    errors.website = 'Saisissez une URL complète HTTP ou HTTPS.';
  return { data: data as unknown as CompanyInput, errors };
}
