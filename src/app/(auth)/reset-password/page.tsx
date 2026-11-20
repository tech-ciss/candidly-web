import { AuthForm } from '@/features/auth/forms';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Réinitialiser mon mot de passe' };
export default function Page() {
  return (
    <>
      <h1>Réinitialiser mon mot de passe</h1>
      <AuthForm kind="reset" />
    </>
  );
}
