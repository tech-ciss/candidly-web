import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import HomePage from '@/app/(public)/page';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { StateDemo } from '@/components/shared/state-demo';
import { PublicHeader } from '@/components/layout/public-header';
import { DashboardMobileNav } from '@/components/layout/dashboard-nav';
import { Button } from '@/components/ui/button';

describe('pages de démonstration', () => {
  it('présente Candidly et un appel à la démonstration existante', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Chaque candidature',
    );
    expect(
      screen.getByRole('link', { name: /Découvrir mon futur espace/ }),
    ).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText(/sans inscription/)).toBeInTheDocument();
  });
  it('affiche un dashboard explicitement fictif et filtre localement', () => {
    render(<DashboardPage />);
    expect(
      screen.getByText(/Vous explorez une démonstration/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Atelier Horizon').length).toBeGreaterThan(0);
    fireEvent.change(
      screen.getByRole('textbox', {
        name: /Rechercher dans les candidatures fictives/,
      }),
      { target: { value: 'introuvable' } },
    );
    expect(
      within(
        screen.getByRole('region', { name: 'Vos candidatures' }),
      ).getByText('Tout commence par une première piste.'),
    ).toBeInTheDocument();
  });
  it('présente les états loading, error et success sans enregistrement', () => {
    render(<StateDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Chargement' }));
    expect(
      screen.getByRole('status', { name: 'Chargement de démonstration' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Erreur' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Erreur simulée');
    fireEvent.click(
      screen.getByRole('button', { name: 'Réessayer la démonstration' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Aucune donnée n’a été enregistrée',
    );
  });
  it('préserve la sémantique et l’état désactivé des boutons', () => {
    render(<Button disabled>Indisponible</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('fournit des navigations mobiles sémantiques', () => {
    render(
      <>
        <PublicHeader />
        <DashboardMobileNav />
      </>,
    );
    expect(
      screen.getByRole('navigation', {
        name: 'Navigation mobile',
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', {
        name: 'Navigation mobile du dashboard',
        hidden: true,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Navigation'));
    expect(screen.getByRole('button', { name: /Contacts/ })).toBeDisabled();
  });
});
