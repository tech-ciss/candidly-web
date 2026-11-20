import type { Metadata } from 'next';
import Link from 'next/link';
import { PrivateRoute } from '@/features/auth/private-route';
export const metadata: Metadata = {
  title: 'Mon compte',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="auth-shell">
      <Link href="/">Candidly</Link>
      <div className="auth-card">
        <PrivateRoute>{children}</PrivateRoute>
      </div>
    </main>
  );
}
