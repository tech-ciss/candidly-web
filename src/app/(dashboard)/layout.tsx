import type { Metadata } from 'next';
import {
  DashboardSidebar,
  DashboardMobileNav,
} from '@/components/layout/dashboard-nav';
import { Badge } from '@/components/ui/badge';
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <DashboardSidebar />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <DashboardMobileNav />
            <span className="dashboard-breadcrumb">
              Mon espace <span>/</span> Vue d’ensemble
            </span>
          </div>
          <Badge variant="outline">
            <span className="blue-dot" /> DÉMONSTRATION
          </Badge>
        </header>
        <main id="main-content" className="dashboard-content">
          {children}
        </main>
        <footer className="dashboard-footer">
          Candidly · Chaque candidature compte.
          <span>Démo publique · aucune donnée enregistrée</span>
        </footer>
      </div>
    </div>
  );
}
