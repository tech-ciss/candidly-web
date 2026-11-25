import { ActiveLink } from '@/components/layout/active-link';
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
        <ActiveLink href="/login">Connexion</ActiveLink>
        <ActiveLink href="/register">Inscription</ActiveLink>
        <ActiveLink href="/forgot-password">Mot de passe oublié</ActiveLink>
        <ActiveLink href="/verify-email">Vérifier mon email</ActiveLink>
        <ActiveLink href="/">Accueil</ActiveLink>
      </nav>
    </main>
  );
}
