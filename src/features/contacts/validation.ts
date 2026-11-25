import type { ContactInput } from './types';
import { isUuid } from '../crm/contracts';
import { text, lengthError, type FieldErrors } from '../crm/validation';
export const contactFields = [
  { name: 'firstName', label: 'Prénom', max: 100, required: true },
  { name: 'lastName', label: 'Nom', max: 100, required: true },
  { name: 'jobTitle', label: 'Fonction', max: 150 },
  { name: 'department', label: 'Service', max: 100 },
  { name: 'email', label: 'Email professionnel', max: 254 },
  { name: 'phone', label: 'Téléphone international', max: 32 },
  { name: 'linkedinUrl', label: 'Profil LinkedIn', max: 2048 },
  { name: 'notes', label: 'Notes', max: 5000, multiline: true },
] as const;
export function linkedinUrl(value: string) {
  if (/[\s\\]/u.test(value)) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      ['linkedin.com', 'www.linkedin.com'].includes(u.hostname) &&
      !u.username &&
      !u.password &&
      !u.port
    );
  } catch {
    return false;
  }
}
export function contactValues(form: FormData) {
  const errors: FieldErrors = {};
  const data: Record<string, string | null> = {
    companyId: text(form.get('companyId')),
  };
  if (!isUuid(data.companyId))
    errors.companyId = 'Choisissez une entreprise de votre espace.';
  for (const f of contactFields) {
    let value = text(form.get(f.name));
    if (f.name === 'email') value = value.toLowerCase();
    if (f.name === 'phone') value = value.replace(/[ ().-]/g, '');
    const error = lengthError(
      value,
      f.max,
      f.name === 'firstName' || f.name === 'lastName',
    );
    if (error) errors[f.name] = error;
    data[f.name] = value || null;
  }
  if (data.email && (!data.email.includes('@') || data.email.endsWith('@')))
    errors.email = 'Saisissez une adresse email valide.';
  if (data.phone && !/^\+[1-9][0-9]{6,14}$/.test(data.phone))
    errors.phone = 'Utilisez + puis 7 à 15 chiffres, sans extension.';
  if (data.linkedinUrl && !linkedinUrl(data.linkedinUrl))
    errors.linkedinUrl =
      'Utilisez une URL HTTPS linkedin.com ou www.linkedin.com, sans identifiants ni port non standard.';
  return { data: data as unknown as ContactInput, errors };
}
