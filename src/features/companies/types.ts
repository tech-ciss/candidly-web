export interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
export type CompanyInput = Pick<
  Company,
  | 'name'
  | 'industry'
  | 'website'
  | 'country'
  | 'city'
  | 'address'
  | 'description'
  | 'notes'
>;
