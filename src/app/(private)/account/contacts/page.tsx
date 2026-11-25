import { Suspense } from 'react';
import { ContactList } from '@/features/contacts/components/list';
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Chargement…</p>}>
      <ContactList />
    </Suspense>
  );
}
