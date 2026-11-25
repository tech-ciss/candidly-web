import { Suspense } from 'react';
import { CompanyEditor } from '@/features/companies/components/form';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p role="status">Chargement…</p>}>
      <CompanyEditor id={id} />
    </Suspense>
  );
}
