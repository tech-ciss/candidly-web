import type { Company } from '../companies/types';
export interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  company: Pick<Company, 'id' | 'name' | 'status'>;
}
export type ContactInput = Pick<
  Contact,
  | 'companyId'
  | 'firstName'
  | 'lastName'
  | 'jobTitle'
  | 'department'
  | 'email'
  | 'phone'
  | 'linkedinUrl'
  | 'notes'
>;
