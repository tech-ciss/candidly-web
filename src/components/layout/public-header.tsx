'use client';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Brand } from './brand';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/provider';
import type { SessionStatus } from '@/features/auth/types';

function SessionLinks({ status }: { status: SessionStatus }) {
  if (status === 'initializing' || status === 'refreshing')
    return (
      <span className="public-session-placeholder" role="status">
        Vérification du compte…
      </span>
    );
  if (status === 'authenticated')
    return (
      <Link className={buttonVariants({ variant: 'outline' })} href="/account">
        Mon espace
      </Link>
    );
  if (status === 'error')
    return (
      <Link className="public-account-link" href="/account">
        Accès au compte
      </Link>
    );
  return (
    <>
      <Link className="public-account-link" href="/login">
        Connexion
      </Link>
      <Link className={buttonVariants()} href="/register">
        Créer mon espace
      </Link>
    </>
  );
}

export function PublicHeader() {
  const { status } = useAuth();
  return (
    <header className="public-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navigation principale">
          <Link href="/#approche">Fonctionnalités</Link>
          <Link href="/#apercu">Comment ça marche</Link>
        </nav>
        <div className="desktop-session">
          <SessionLinks status={status} />
        </div>
        <details
          className="mobile-menu"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a'))
              event.currentTarget.open = false;
          }}
        >
          <summary aria-label="Ouvrir la navigation">
            <Menu aria-hidden="true" />
          </summary>
          <nav aria-label="Navigation mobile">
            <Link href="/#approche">Fonctionnalités</Link>
            <Link href="/#apercu">Comment ça marche</Link>
            <div className="mobile-session">
              <SessionLinks status={status} />
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
