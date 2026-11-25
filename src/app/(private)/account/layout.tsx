import type { Metadata } from 'next';
import { AccountShell } from '@/features/crm/account-shell';
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
    <PrivateRoute>
      <AccountShell>{children}</AccountShell>
    </PrivateRoute>
  );
}
