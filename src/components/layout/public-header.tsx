import Link from 'next/link';
import { ArrowUpRight, Menu } from 'lucide-react';
import { Brand } from './brand';
import { buttonVariants } from '@/components/ui/button';
export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navigation principale">
          <Link href="/#approche">L’approche</Link>
          <Link href="/#apercu">Aperçu du produit</Link>
        </nav>
        <Link
          className={buttonVariants({ variant: 'default' }) + ' desktop-cta'}
          href="/dashboard"
        >
          Explorer la démo <ArrowUpRight aria-hidden="true" />
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Ouvrir la navigation">
            <Menu aria-hidden="true" />
          </summary>
          <nav aria-label="Navigation mobile">
            <Link href="/#approche">L’approche</Link>
            <Link href="/#apercu">Aperçu du produit</Link>
            <Link href="/dashboard">Explorer la démo</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
