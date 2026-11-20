import { AuthForm } from '@/features/auth/forms';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Inscription' };
export default function Page() {
  return (
    <>
      <h1>Inscription</h1>
      <AuthForm kind="register" />
    </>
  );
}
