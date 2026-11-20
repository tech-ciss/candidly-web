import { AuthForm } from '@/features/auth/forms';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Connexion' };
export default function Page() {
  return (
    <>
      <h1>Connexion</h1>
      <AuthForm kind="login" />
    </>
  );
}
