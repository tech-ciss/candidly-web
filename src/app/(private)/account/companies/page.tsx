import { Suspense } from 'react';
import { CompanyList } from '@/features/companies/components/list';
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Chargement…</p>}>
      <CompanyList />
    </Suspense>
  );
}
