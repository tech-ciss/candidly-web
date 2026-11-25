import { Suspense } from 'react';
import { CompanyEditor } from '@/features/companies/components/form';
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Chargement…</p>}>
      <CompanyEditor />
    </Suspense>
  );
}
