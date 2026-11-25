import { Suspense } from 'react';
import { ContactEditor } from '@/features/contacts/components/form';
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Chargement…</p>}>
      <ContactEditor />
    </Suspense>
  );
}
