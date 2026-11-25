import { act, render, screen, within, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { PublicHeader } from '@/components/layout/public-header';
import { ProductPreview } from '@/components/shared/product-preview';
import { AuthProvider } from '@/features/auth/provider';
import { SessionManager } from '@/features/auth/session';
import { createAuthApi } from '@/features/auth/api';
import { ApiError, createApiClient } from '@/lib/api/client';

const user = {
  id: 'header-fixture',
  firstName: 'Awa',
  lastName: 'Fixture',
  email: 'awa@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  emailVerifiedAt: '2026-01-01T00:00:00Z',
};
function harness() {
  const api = createAuthApi(createApiClient('http://localhost:3001/api/v1'));
  let resolve!: (value: {
    accessToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
  }) => void;
  let reject!: (error: unknown) => void;
  api.refresh = vi.fn().mockReturnValue(
    new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    }),
  );
  api.readUser = vi.fn().mockResolvedValue(user);
  const manager = new SessionManager(api);
  return { manager, api, resolve, reject };
}
function header(manager: SessionManager) {
  return (
    <AuthProvider manager={manager}>
      <PublicHeader />
    </AuthProvider>
  );
}
function desktop() {
  return screen
    .getByRole('banner')
    .querySelector('.desktop-session') as HTMLElement;
}

describe('navigation publique liée à la session', () => {
  it('reste neutre pendant l’initialisation puis présente les liens visiteurs', async () => {
    const h = harness();
    render(header(h.manager));
    expect(
      screen.queryByRole('link', { name: 'Connexion' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Mon espace' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Vérification du compte…')).toHaveLength(2);
    await act(async () => h.reject(new ApiError('refus', 401, 'UNAUTHORIZED')));
    expect(
      within(desktop()).getByRole('link', { name: 'Connexion' }),
    ).toHaveAttribute('href', '/login');
    expect(
      within(desktop()).getByRole('link', { name: 'Créer mon espace' }),
    ).toHaveAttribute('href', '/register');
    expect(
      screen.queryByRole('link', { name: 'Mon espace' }),
    ).not.toBeInTheDocument();
  });
  it('n’affiche Mon espace qu’après refresh ET confirmation de l’identité', async () => {
    const h = harness();
    let confirm!: (value: typeof user) => void;
    h.api.readUser = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        confirm = resolve;
      }),
    );
    render(header(h.manager));
    await act(async () =>
      h.resolve({
        accessToken: 'fixture',
        expiresIn: 900,
        tokenType: 'Bearer',
      }),
    );
    expect(
      screen.queryByRole('link', { name: 'Mon espace' }),
    ).not.toBeInTheDocument();
    await act(async () => confirm(user));
    expect(
      within(desktop()).getByRole('link', { name: 'Mon espace' }),
    ).toHaveAttribute('href', '/account');
    expect(
      screen.queryByRole('link', { name: 'Connexion' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Créer mon espace' }),
    ).not.toBeInTheDocument();
    h.api.logout = vi.fn().mockResolvedValue(undefined);
    await act(() => h.manager.logout());
    expect(
      within(desktop()).getByRole('link', { name: 'Connexion' }),
    ).toBeInTheDocument();
  });
  it('ne transforme pas une erreur réseau en état visiteur certain', async () => {
    const h = harness();
    render(header(h.manager));
    await act(async () =>
      h.reject(new ApiError('réseau', null, 'NETWORK_ERROR')),
    );
    expect(
      within(desktop()).getByRole('link', { name: 'Accès au compte' }),
    ).toHaveAttribute('href', '/account');
    expect(
      screen.queryByRole('link', { name: 'Connexion' }),
    ).not.toBeInTheDocument();
  });
  it('conserve les sections réelles dans les deux navigations', () => {
    const h = harness();
    render(header(h.manager));
    const mobile = screen.getByRole('navigation', {
      name: 'Navigation mobile',
      hidden: true,
    });
    const main = screen.getByRole('navigation', {
      name: 'Navigation principale',
    });
    for (const nav of [mobile, main]) {
      expect(
        within(nav).getByRole('link', {
          name: 'Fonctionnalités',
          hidden: true,
        }),
      ).toHaveAttribute('href', '/#approche');
      expect(
        within(nav).getByRole('link', {
          name: 'Comment ça marche',
          hidden: true,
        }),
      ).toHaveAttribute('href', '/#apercu');
    }
    const disclosure = mobile.closest('details')!;
    disclosure.open = true;
    within(mobile).getByRole('link', { name: 'Fonctionnalités' }).click();
    expect(disclosure.open).toBe(false);
  });
  it('produit un SSR neutre même avec un manager authentifié puis hydrate sans mismatch', async () => {
    const h = harness();
    const initial = h.manager.initialize();
    h.resolve({ accessToken: 'fixture', expiresIn: 900, tokenType: 'Bearer' });
    await initial;
    const markup = renderToString(header(h.manager));
    expect(markup).not.toContain('>Connexion<');
    expect(markup).not.toContain('>Mon espace<');
    expect(markup).not.toContain(user.email);
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);
    const errors: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(host, header(h.manager), {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    await waitFor(() =>
      expect(
        within(host.querySelector('.desktop-session') as HTMLElement).getByRole(
          'link',
          { name: 'Mon espace' },
        ),
      ).toBeInTheDocument(),
    );
    expect(errors).toEqual([]);
    await act(async () => root.unmount());
    host.remove();
  });
});

it('illustre dossier, échanges et action avec des données explicitement fictives, sans requête', () => {
  const network = vi.spyOn(globalThis, 'fetch');
  render(<ProductPreview />);
  expect(
    screen.getByRole('region', { name: 'Le fil d’une candidature' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Atelier Horizon')).toBeInTheDocument();
  expect(screen.getByRole('list')).toHaveTextContent('Candidature envoyée');
  expect(screen.getByRole('list')).toHaveTextContent('Premier échange RH');
  expect(
    screen.getByRole('heading', { name: 'Prochaine action fictive' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Relancer le contact RH')).toBeInTheDocument();
  expect(screen.getByText(/Données et dates fictives/)).toBeInTheDocument();
  expect(network).not.toHaveBeenCalled();
  network.mockRestore();
});
