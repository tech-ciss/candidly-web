import Link from 'next/link';
import type { Metadata } from 'next';
import { Brand } from '@/components/layout/brand';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="auth-shell">
      <Brand />
      <section className="auth-card">{children}</section>
      <nav className="auth-links" aria-label="Authentification">
        <Link href="/login">Connexion</Link>
        <Link href="/register">Inscription</Link>
        <Link href="/forgot-password">Mot de passe oublié</Link>
        <Link href="/verify-email">Vérifier mon email</Link>
        <Link href="/">Accueil</Link>
      </nav>
    </main>
  );
}
