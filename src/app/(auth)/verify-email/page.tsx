import { VerifyEmail } from '@/features/auth/forms';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Vérifier mon adresse email' };
export default function Page() {
  return (
    <>
      <h1>Vérifier mon adresse email</h1>
      <VerifyEmail />
    </>
  );
}
