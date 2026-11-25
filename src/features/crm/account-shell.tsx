'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Building2,
  House,
  UsersRound,
  UserRound,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ActiveLink } from '@/components/layout/active-link';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { useAuth } from '@/features/auth/provider';
import { errorMessage } from '@/features/auth/forms';
import { CrmProvider } from './provider';
const destinations = [
  { href: '/account', label: 'Vue d’ensemble', mobile: 'Accueil', Icon: House },
  {
    href: '/account/companies',
    label: 'Entreprises',
    mobile: 'Entreprises',
    Icon: Building2,
  },
  {
    href: '/account/contacts',
    label: 'Contacts',
    mobile: 'Contacts',
    Icon: UsersRound,
  },
  {
    href: '/account/profile',
    label: 'Profil',
    mobile: 'Profil',
    Icon: UserRound,
  },
];
export function initials(first = '', last = '') {
  return (
    ((first.trim()[0] ?? '') + (last.trim()[0] ?? '')).toLocaleUpperCase(
      'fr',
    ) || 'C'
  );
}
export function LogoutButton() {
  const { session } = useAuth();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!session || busy.current) return;
          busy.current = true;
          setPending(true);
          setError('');
          void session
            .logout()
            .catch((e) => setError(errorMessage(e)))
            .finally(() => {
              busy.current = false;
              setPending(false);
            });
        }}
      >
        <LogOut aria-hidden="true" size={18} />
        {pending ? 'Déconnexion…' : 'Se déconnecter'}
      </Button>
      {error && <Feedback>{error}</Feedback>}
    </>
  );
}
function UserMenu() {
  const { user } = useAuth();
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={ref}
      className="app-user-menu"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.currentTarget.open = false;
          e.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary aria-label="Menu utilisateur">
        <span className="app-avatar" aria-hidden="true">
          {initials(user?.firstName, user?.lastName)}
        </span>
        <span className="app-user-name">
          {user?.firstName} {user?.lastName}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="app-user-popover">
        <p>
          {user?.firstName} {user?.lastName}
        </p>
        <Link
          href="/account/profile"
          onClick={() => {
            if (ref.current) ref.current.open = false;
          }}
        >
          <UserRound aria-hidden="true" size={18} />
          Mon profil
        </Link>
        <LogoutButton />
      </div>
    </details>
  );
}
function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const frame = useRef<HTMLDivElement>(null);
  const current =
    destinations.find(
      (d) => d.href !== '/account' && pathname.startsWith(d.href),
    ) ?? destinations[0]!;
  const nested = pathname !== current.href;
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      if (!frame.current) return;
      const height = viewport?.height ?? window.innerHeight;
      const inset = Math.max(
        0,
        window.innerHeight - height - (viewport?.offsetTop ?? 0),
      );
      frame.current.style.setProperty('--app-visible-height', `${height}px`);
      frame.current.style.setProperty('--keyboard-inset', `${inset}px`);
      frame.current.dataset.keyboard = inset > 120 ? 'open' : 'closed';
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <div className="app-shell" ref={frame}>
      <aside className="app-sidebar">
        <Link href="/" className="brand" aria-label="Candidly — accueil">
          Candidly
        </Link>
        <nav aria-label="Espace privé">
          {destinations.map(({ href, label, Icon }) => (
            <ActiveLink
              key={href}
              href={href}
              section={href.includes('companies') || href.includes('contacts')}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </ActiveLink>
          ))}
        </nav>
        <p className="app-sidebar-note">Chaque candidature compte.</p>
      </aside>
      <div className="app-workspace">
        <header className="app-header">
          <Link href="/" className="brand app-mobile-brand">
            Candidly
          </Link>
          <nav className="app-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/account">Mon espace</Link>
            {current.href !== '/account' && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={current.href}>{current.label}</Link>
              </>
            )}
            {nested && (
              <>
                <span aria-hidden="true">/</span>
                <span>
                  {pathname.endsWith('/new')
                    ? 'Nouveau dossier'
                    : pathname.endsWith('/edit')
                      ? 'Modification'
                      : 'Dossier'}
                </span>
              </>
            )}
          </nav>
          <UserMenu />
        </header>
        <main id="main-content" className="app-main">
          {children}
        </main>
      </div>
      <nav
        className="app-mobile-navigation"
        aria-label="Navigation mobile privée"
      >
        {destinations.slice(0, 3).map(({ href, mobile, Icon }) => (
          <ActiveLink key={href} href={href} section={href !== '/account'}>
            <Icon size={22} aria-hidden="true" />
            <span>{mobile}</span>
          </ActiveLink>
        ))}
      </nav>
    </div>
  );
}
export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <AppFrame>{children}</AppFrame>
    </CrmProvider>
  );
}
