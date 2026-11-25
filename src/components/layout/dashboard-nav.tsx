import Link from 'next/link';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarDays,
  Building2,
  UsersRound,
  Settings2,
  ArrowUpRight,
  Menu,
} from 'lucide-react';
import { Brand } from './brand';
import { Separator } from '@/components/ui/separator';
function Navigation() {
  return (
    <>
      <Link className="nav-item active" href="/dashboard" aria-current="page">
        <LayoutDashboard size={18} aria-hidden="true" />
        Vue d’ensemble<span>Démo</span>
      </Link>
      <Link className="nav-item" href="/dashboard#candidatures">
        <BriefcaseBusiness size={18} aria-hidden="true" />
        Candidatures<span>4</span>
      </Link>
      <Link className="nav-item" href="/dashboard#prochaines-actions">
        <CalendarDays size={18} aria-hidden="true" />
        Prochaines actions<span>2</span>
      </Link>
      <Separator className="my-4" />
      {[
        { label: 'Entreprises', icon: Building2 },
        { label: 'Contacts', icon: UsersRound },
        { label: 'Paramètres', icon: Settings2 },
      ].map((item) => (
        <button
          key={item.label}
          className="nav-item unavailable-nav"
          disabled
          title="Indisponible dans cette démonstration"
        >
          <item.icon size={18} aria-hidden="true" />
          {item.label}
          <span>À venir</span>
        </button>
      ))}
    </>
  );
}
export function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar">
      <Brand />
      <div className="workspace-label">
        <span className="workspace-icon">C</span>
        <div>
          <strong>Espace de démonstration</strong>
          <small>Personnel, données fictives</small>
        </div>
      </div>
      <p className="sidebar-label">Mon espace</p>
      <nav aria-label="Navigation du dashboard">
        <Navigation />
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <strong>Un premier aperçu.</strong>
          <p>
            Cet espace est public et fictif. Les fonctionnalités arrivent
            progressivement.
          </p>
        </div>
        <Link className="back-home" href="/">
          Revenir à l’accueil <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
export function DashboardMobileNav() {
  return (
    <details className="dashboard-mobile-nav">
      <summary>
        <Menu size={20} aria-hidden="true" />
        <span>Navigation</span>
      </summary>
      <nav aria-label="Navigation mobile du dashboard">
        <Navigation />
      </nav>
    </details>
  );
}
