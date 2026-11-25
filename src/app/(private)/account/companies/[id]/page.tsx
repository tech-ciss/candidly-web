import { Suspense } from 'react';
import { CompanyDetail } from '@/features/companies/components/detail';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p role="status">Chargement…</p>}>
      <CompanyDetail id={id} />
    </Suspense>
  );
}
