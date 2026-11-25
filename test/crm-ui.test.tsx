import './support/dialog';
import { StrictMode } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { AuthProvider } from '@/features/auth/provider';
import { SessionManager } from '@/features/auth/session';
import { createAuthApi } from '@/features/auth/api';
import { createApiClient, type ApiRequestOptions } from '@/lib/api/client';
import { CrmProvider } from '@/features/crm/provider';
import { AccountShell } from '@/features/crm/account-shell';
import { CompanyList } from '@/features/companies/components/list';
import { CompanyForm } from '@/features/companies/components/form';
import { ContactForm } from '@/features/contacts/components/form';
import { safeListReturn } from '@/features/crm/navigation';
const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  params: new URLSearchParams(),
  pathname: '/account/companies',
}));
vi.mock('next/navigation', () => ({
  useRouter: () => nav,
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params,
}));
const id = '55ada78f-c270-49bb-820c-d6d0babecbbb',
  otherId = '65ada78f-c270-49bb-820c-d6d0babecbbb';
const company = {
  id,
  name: 'Entreprise Alpha',
  industry: null,
  website: null,
  country: null,
  city: null,
  address: null,
  description: null,
  notes: null,
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  archivedAt: null,
};
const user = {
  id,
  firstName: 'Awa',
  lastName: 'Fixture',
  email: 'fixture@example.com',
  createdAt: company.createdAt,
  emailVerifiedAt: company.createdAt,
};
function page<T>(data: T[]) {
  return {
    data,
    meta: {
      page: 1,
      limit: 20,
      total: data.length,
      totalPages: data.length ? 1 : 0,
    },
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { resolve, promise };
}
async function harness(
  handler: (path: string, options?: ApiRequestOptions) => unknown = () =>
    page([company]),
) {
  const api = createAuthApi(createApiClient('http://localhost:3001/api/v1'));
  api.refresh = vi.fn().mockResolvedValue({
    accessToken: 'fixture-access',
    tokenType: 'Bearer',
    expiresIn: 900,
  });
  api.readUser = vi.fn().mockResolvedValue(user);
  api.logout = vi.fn().mockResolvedValue(undefined);
  api.client.request = vi
    .fn()
    .mockImplementation(async (path, options) => handler(path, options));
  const manager = new SessionManager(api);
  await manager.initialize();
  const wrapper = (children: React.ReactNode) => (
    <StrictMode>
      <AuthProvider manager={manager}>
        <CrmProvider>{children}</CrmProvider>
      </AuthProvider>
    </StrictMode>
  );
  return {
    api,
    manager,
    wrapper,
    render: (children: React.ReactNode) => render(wrapper(children)),
  };
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.params = new URLSearchParams();
  nav.pathname = '/account/companies';
});
describe('UI-CRM ciblé', () => {
  it('navigation privée active, trois destinations mobiles et profil depuis le menu', async () => {
    nav.pathname = `/account/companies/${id}/edit`;
    const h = await harness();
    render(
      <AuthProvider manager={h.manager}>
        <AccountShell>
          <p>Dossier</p>
        </AccountShell>
      </AuthProvider>,
    );
    const desktop = await screen.findByRole('navigation', {
      name: 'Espace privé',
    });
    expect(
      within(desktop).getByRole('link', { name: 'Entreprises' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(within(desktop).getAllByRole('link')).toHaveLength(4);
    const mobile = screen.getByRole('navigation', {
      name: 'Navigation mobile privée',
    });
    expect(within(mobile).getAllByRole('link')).toHaveLength(3);
    fireEvent.click(screen.getByLabelText('Menu utilisateur'));
    expect(
      screen.getByRole('link', { name: 'Mon profil', exact: true }),
    ).toHaveAttribute('href', '/account/profile');
    expect(safeListReturn('companies', 'https://evil.example')).toBe(
      '/account/companies',
    );
    expect(safeListReturn('companies', '/account/companies?city=Abidjan')).toBe(
      '/account/companies?city=Abidjan',
    );
  });
  it('recherche à 350 ms, page réinitialisée, filtre conservé et réponse tardive ignorée', async () => {
    const old = deferred<ReturnType<typeof page<typeof company>>>();
    nav.params = new URLSearchParams('page=3&status=ARCHIVED');
    const recent = {
      ...company,
      id: otherId,
      name: 'Atelier récent',
      status: 'ARCHIVED' as const,
    };
    const h = await harness((_path, options) =>
      options?.query?.get('search') ? page([recent]) : old.promise,
    );
    vi.useFakeTimers();
    const view = h.render(<CompanyList />);
    await act(async () => {});
    nav.replace.mockImplementation((url: string) => {
      nav.params = new URLSearchParams(url.split('?')[1]);
      view.rerender(h.wrapper(<CompanyList />));
    });
    fireEvent.change(screen.getByLabelText('Rechercher une entreprise'), {
      target: { value: 'At' },
    });
    fireEvent.change(screen.getByLabelText('Rechercher une entreprise'), {
      target: { value: 'Atelier' },
    });
    await act(async () => {
      vi.advanceTimersByTime(349);
    });
    expect(nav.replace).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(nav.replace).toHaveBeenCalledTimes(1);
    const query = new URLSearchParams(
      nav.replace.mock.calls[0]![0].split('?')[1],
    );
    expect(query.get('page')).toBe('1');
    expect(query.get('status')).toBe('ARCHIVED');
    expect(query.get('search')).toBe('Atelier');
    expect(
      within(screen.getByRole('table', { name: 'Entreprises' })).getByRole(
        'link',
        { name: recent.name },
      ),
    ).toBeInTheDocument();
    await act(async () => {
      old.resolve(page([{ ...company, name: 'Résultat obsolète' }]));
    });
    expect(screen.queryByText('Résultat obsolète')).not.toBeInTheDocument();
    expect(
      vi
        .mocked(h.api.client.request)
        .mock.calls.filter(
          ([, options]) => options?.query?.get('search') === 'Atelier',
        ),
    ).toHaveLength(1);
  });
  it('sections repliables : valeurs conservées, section invalide ouverte et premier champ ciblé', async () => {
    const h = await harness();
    h.render(<CompanyForm />);
    fireEvent.change(screen.getByLabelText(/Nom de l’entreprise/), {
      target: { value: 'Entreprise Alpha' },
    });
    const summary = screen
      .getByText('Localisation', { exact: true })
      .closest('summary')!;
    fireEvent.click(summary);
    fireEvent.change(screen.getByLabelText('Pays'), {
      target: { value: 'Côte d’Ivoire' },
    });
    fireEvent.change(screen.getByLabelText('Ville'), {
      target: { value: 'x'.repeat(101) },
    });
    fireEvent.click(summary);
    expect(summary.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(
      screen.getByRole('button', { name: 'Créer l’entreprise', exact: true }),
    );
    expect(summary.closest('details')).toHaveAttribute('open');
    expect(screen.getByLabelText('Ville')).toHaveFocus();
    expect(screen.getByLabelText('Ville')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Pays')).toHaveValue('Côte d’Ivoire');
    expect(h.api.client.request).not.toHaveBeenCalled();
  });
  it('sélecteur : sélection conservée après recherche et saisie du contact intacte', async () => {
    const beta = { ...company, id: otherId, name: 'Entreprise Bêta' };
    const h = await harness((_path, options) =>
      page(options?.query?.get('search') ? [beta] : [company]),
    );
    h.render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/Prénom/), {
      target: { value: 'Brouillon Awa' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choisir une entreprise',
        exact: true,
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /Entreprise Alpha/ }),
    );
    const trigger = screen.getByRole('button', {
      name: 'Entreprise : Entreprise Alpha. Changer',
      exact: true,
    });
    fireEvent.click(trigger);
    await screen.findByRole('button', { name: /^Entreprise Alpha/ });
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText('Rechercher une entreprise'), {
      target: { value: 'Bêta' },
    });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(
      screen.getByRole('button', { name: /Entreprise Bêta/ }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Fermer : Choisir une entreprise',
        exact: true,
      }),
    );
    expect(screen.getByLabelText(/Prénom/)).toHaveValue('Brouillon Awa');
    const form = screen
      .getByRole('button', { name: 'Créer le contact', exact: true })
      .closest('form')!;
    expect(new FormData(form).get('companyId')).toBe(id);
    expect(
      screen.getByRole('button', {
        name: 'Entreprise : Entreprise Alpha. Changer',
        exact: true,
      }),
    ).toBeInTheDocument();
  });
});
