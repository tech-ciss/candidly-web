import { Suspense } from 'react';
import { ContactDetail } from '@/features/contacts/components/detail';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p role="status">Chargement…</p>}>
      <ContactDetail id={id} />
    </Suspense>
  );
}
