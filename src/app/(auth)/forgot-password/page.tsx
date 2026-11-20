import { AuthForm } from '@/features/auth/forms';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Mot de passe oublié' };
export default function Page() {
  return (
    <>
      <h1>Mot de passe oublié</h1>
      <AuthForm kind="forgot" />
    </>
  );
}
