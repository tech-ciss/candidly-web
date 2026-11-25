import './support/dialog';
import { StrictMode } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { createApiClient, ApiError } from '@/lib/api/client';
import { createAuthApi } from '@/features/auth/api';
import { SessionManager } from '@/features/auth/session';
import { AuthProvider } from '@/features/auth/provider';
import { CrmProvider } from '@/features/crm/provider';
import { CrmStore } from '@/features/crm/store';
import { CompanyList } from '@/features/companies/components/list';
import {
  CompanyForm,
  CompanyEditor,
} from '@/features/companies/components/form';
import { CompanyDetail } from '@/features/companies/components/detail';
import { ContactList } from '@/features/contacts/components/list';
import { ContactForm } from '@/features/contacts/components/form';
import { ContactDetail } from '@/features/contacts/components/detail';
import { AccountShell } from '@/features/crm/account-shell';
import { companyValues } from '@/features/companies/validation';
import { contactValues, linkedinUrl } from '@/features/contacts/validation';
import { companiesApi } from '@/features/companies/api';
import { contactsApi } from '@/features/contacts/api';
import { crmError } from '@/features/crm/shared';
import { changedFields, httpUrl } from '@/features/crm/validation';
const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  params: new URLSearchParams(),
  pathname: '/account/companies',
}));
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.params,
}));
const id = '55ada78f-c270-49bb-820c-d6d0babecbbb';
const cid = '65ada78f-c270-49bb-820c-d6d0babecbbb';
const company = {
  id,
  name: 'Entreprise Fixture',
  industry: null,
  website: null,
  country: 'Côte d’Ivoire',
  city: 'Abidjan',
  address: null,
  description: null,
  notes: null,
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  archivedAt: null,
};
const contact = {
  id: cid,
  companyId: id,
  firstName: 'Awa',
  lastName: 'Fixture',
  jobTitle: 'Recrutement',
  department: null,
  email: 'awa@example.com',
  phone: null,
  linkedinUrl: null,
  notes: null,
  createdAt: company.createdAt,
  updatedAt: company.updatedAt,
  company: { id, name: company.name, status: company.status },
};
const user = {
  id,
  firstName: 'Awa',
  lastName: 'Fixture',
  email: 'fixture@example.com',
  createdAt: company.createdAt,
  emailVerifiedAt: company.createdAt,
};
const token = {
  accessToken: 'fixture-access',
  tokenType: 'Bearer' as const,
  expiresIn: 900,
};
const page = <T,>(data: T[], total = data.length) => ({
  data,
  meta: { page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) },
});
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { resolve, promise };
}
async function harness(
  handler: (path: string, options?: RequestInit) => unknown = (path) =>
    path.startsWith('/companies') ? page([company]) : page([contact]),
) {
  const api = createAuthApi(createApiClient('http://localhost:3001/api/v1'));
  api.refresh = vi.fn().mockResolvedValue(token);
  api.readUser = vi.fn().mockResolvedValue(user);
  api.login = vi.fn().mockResolvedValue({ ...token, user });
  api.logout = vi.fn().mockResolvedValue(undefined);
  api.client.request = vi
    .fn()
    .mockImplementation(async (path, options) => handler(path, options));
  const manager = new SessionManager(api);
  await manager.initialize();
  return {
    manager,
    api,
    render: (children: React.ReactNode) =>
      render(
        <StrictMode>
          <AuthProvider manager={manager}>
            <CrmProvider>{children}</CrmProvider>
          </AuthProvider>
        </StrictMode>,
      ),
  };
}
afterEach(() => {
  vi.restoreAllMocks();
  navigation.params = new URLSearchParams();
  navigation.pathname = '/account/companies';
  navigation.push.mockClear();
  navigation.replace.mockClear();
});
describe('contrats et validation CRM', () => {
  it('normalise le nom, conserve null pour effacer, refuse tailles et URL incorrectes', () => {
    const f = new FormData();
    f.set('name', '  Entreprise   Fixture ');
    f.set('website', 'javascript:alert(1)');
    let r = companyValues(f);
    expect(r.data.name).toBe('Entreprise Fixture');
    expect(r.data.notes).toBeNull();
    expect(r.errors.website).toBeTruthy();
    f.set('name', 'x'.repeat(151));
    r = companyValues(f);
    expect(r.errors.name).toBeTruthy();
    expect(httpUrl('https://example.com')).toBe(true);
    expect(httpUrl('https://example.com/a b')).toBe(false);
    expect(httpUrl('https://example.com\\x')).toBe(false);
  });
  it('valide rattachement, téléphone international, email et LinkedIn', () => {
    const f = new FormData();
    f.set('companyId', id);
    f.set('firstName', 'Awa');
    f.set('lastName', 'Fixture');
    f.set('email', 'AWA@example.com');
    f.set('phone', '+225 07 00 00 00 00');
    expect(contactValues(f).errors).toEqual({});
    expect(contactValues(f).data.phone).toBe('+2250700000000');
    expect(contactValues(f).data.email).toBe('awa@example.com');
    f.set('companyId', 'foreign');
    f.set('phone', '123');
    f.set('email', 'bad');
    expect(Object.keys(contactValues(f).errors)).toEqual(
      expect.arrayContaining(['companyId', 'phone', 'email']),
    );
    expect(linkedinUrl('https://www.linkedin.com/in/fixture')).toBe(true);
    for (const u of [
      'http://linkedin.com',
      'https://evil.com',
      'https://linkedin.com.evil.com',
      'https://u:p@linkedin.com',
      'https://linkedin.com:444',
      'https://linkedin.com\\evil',
    ])
      expect(linkedinUrl(u)).toBe(false);
  });
  it('PATCH uniquement les champs changés, y compris les effacements', () => {
    expect(
      changedFields({ name: 'A', notes: null }, { name: 'A', notes: 'note' }),
    ).toEqual({ notes: null });
  });
  it('n’envoie aucun propriétaire et respecte les routes, verbes, paramètres et corps vides', async () => {
    const h = await harness((path, options) =>
      options?.method === 'DELETE'
        ? undefined
        : path.endsWith('/contacts')
          ? page([contact])
          : options?.method
            ? company
            : page([company]),
    );
    const api = companiesApi(h.manager);
    await api.list({ search: 'Fixture', userId: 'foreign' });
    expect(
      vi.mocked(h.api.client.request).mock.calls.at(-1)?.[1]?.query?.toString(),
    ).toBe('search=Fixture');
    await api.archive(id);
    expect(vi.mocked(h.api.client.request).mock.calls.at(-1)).toMatchObject([
      `/companies/${id}/archive`,
      { method: 'POST' },
    ]);
    expect(
      vi.mocked(h.api.client.request).mock.calls.at(-1)?.[1]?.body,
    ).toBeUndefined();
    await api.restore(id);
    await api.remove(id);
    await contactsApi(h.manager).forCompany(id);
    expect(() => api.get('invalid')).toThrow('Identifiant invalide.');
  });
  it.each([400, 401, 403, 404, 409, 429, 500])(
    'affiche une erreur contrôlée pour HTTP %s',
    (status) => {
      expect(
        crmError(new ApiError('secret backend', status, 'ERROR')),
      ).not.toContain('secret backend');
    },
  );
});
describe('écrans CRM réels', () => {
  it('charge les entreprises, recherche et pagination dans l’URL', async () => {
    const h = await harness(() => page([company], 21));
    h.render(<CompanyList />);
    expect(
      await within(
        await screen.findByRole('table', { name: 'Entreprises' }),
      ).findByRole('link', { name: company.name }),
    ).toHaveAttribute(
      'href',
      `/account/companies/${id}?returnTo=%2Faccount%2Fcompanies`,
    );
    expect(screen.getByRole('link', { name: 'Suivante' })).toHaveAttribute(
      'href',
      '/account/companies?page=2',
    );
    fireEvent.change(screen.getByLabelText('Rechercher une entreprise'), {
      target: { value: 'Abidjan' },
    });
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        expect.stringContaining('search=Abidjan'),
        { scroll: false },
      ),
    );
    expect(navigation.replace).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
      { scroll: false },
    );
  });
  it('affiche vide, erreur réseau puis reprise explicite', async () => {
    let fail = true;
    const h = await harness(() => {
      if (fail) throw new ApiError('private', null, 'NETWORK_ERROR');
      return page([]);
    });
    h.render(<CompanyList />);
    expect(await screen.findByRole('alert')).toHaveTextContent('indisponible');
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(
      await screen.findByText('Vos premières entreprises vous attendent'),
    ).toBeInTheDocument();
  });
  it('valide le formulaire avant création et attend la confirmation serveur sans doublon', async () => {
    const d = deferred<typeof company>();
    const h = await harness(() => d.promise);
    h.render(<CompanyEditor />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Créer l’entreprise' }),
    );
    expect(
      screen.getByText('Saisissez entre 1 et 150 caractères.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom de l’entreprise/)).toHaveFocus();
    fireEvent.change(screen.getByLabelText(/Nom de l’entreprise/), {
      target: { value: 'Entreprise Fixture' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer l’entreprise' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrement…' }));
    expect(h.api.client.request).toHaveBeenCalledTimes(1);
    expect(navigation.push).not.toHaveBeenCalled();
    d.resolve(company);
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        `/account/companies/${id}?notice=created`,
      ),
    );
  });
  it('modifie une entreprise avec un PATCH minimal et expose le conflit doublon', async () => {
    const h = await harness(() => {
      throw new ApiError('private', 409, 'CONFLICT');
    });
    h.render(<CompanyForm company={company} />);
    fireEvent.change(screen.getByLabelText('Ville'), {
      target: { value: 'Bouaké' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer les modifications' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('archives');
    expect(h.api.client.request).toHaveBeenCalledWith(
      `/companies/${id}`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ city: 'Bouaké' }),
      }),
    );
  });
  it('confirme archive et suppression ; conserve la fiche sur conflit relationnel', async () => {
    const h = await harness((path, opts) => {
      if (opts?.method === 'DELETE')
        throw new ApiError('private', 409, 'CONFLICT');
      if (path.endsWith('/contacts')) return page([]);
      return company;
    });
    h.render(<CompanyDetail id={id} />);
    await screen.findByRole('heading', { name: company.name });
    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer l’entreprise' }),
    );
    expect(h.api.client.request).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: 'DELETE' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmer : supprimer l’entreprise',
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Archivez-la');
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmer : archiver' }),
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        expect.stringContaining('notice=archived'),
      ),
    );
  });
  it('affiche les contacts, entreprise et coordonnées sans historique inventé', async () => {
    navigation.pathname = '/account/contacts';
    const h = await harness(() => page([contact]));
    h.render(<ContactList />);
    expect(
      await within(
        await screen.findByRole('table', { name: 'Contacts' }),
      ).findByRole('link', { name: 'Awa Fixture' }),
    ).toHaveAttribute(
      'href',
      `/account/contacts/${cid}?returnTo=%2Faccount%2Fcontacts`,
    );
    expect(
      within(screen.getByRole('table', { name: 'Contacts' })).getByText(
        'awa@example.com',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Historique des interactions'),
    ).not.toBeInTheDocument();
  });
  it('crée un contact uniquement avec une entreprise accessible sélectionnée', async () => {
    const h = await harness((path, opts) =>
      opts?.method === 'POST' ? contact : page([company]),
    );
    h.render(<ContactForm />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choisir une entreprise',
        exact: true,
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /Entreprise Fixture/ }),
    );
    fireEvent.change(screen.getByLabelText(/Prénom/), {
      target: { value: 'Awa' },
    });
    fireEvent.change(screen.getByLabelText(/^Nom \(/), {
      target: { value: 'Fixture' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le contact' }));
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        `/account/contacts/${cid}?notice=created`,
      ),
    );
    const call = vi
      .mocked(h.api.client.request)
      .mock.calls.find(([p, o]) => p === '/contacts' && o?.method === 'POST');
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      companyId: id,
      firstName: 'Awa',
      lastName: 'Fixture',
    });
  });
  it('modifie un contact et conserve le conflit de changement d’entreprise', async () => {
    const h = await harness((p, o) => {
      if (o?.method === 'PATCH') throw new ApiError('private', 409, 'CONFLICT');
      return p === `/companies/${id}` ? company : page([company]);
    });
    h.render(<ContactForm contact={contact} />);
    await screen.findByRole('button', {
      name: `Entreprise : ${company.name}. Changer`,
    });
    fireEvent.change(screen.getByLabelText('Fonction'), {
      target: { value: 'Direction' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer les modifications' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('historique');
  });
  it('supprime un contact après confirmation et réponse 204', async () => {
    const h = await harness((p, o) =>
      o?.method === 'DELETE' ? undefined : contact,
    );
    h.render(<ContactDetail id={cid} />);
    await screen.findByRole('heading', { name: 'Awa Fixture' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer le contact' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmer : supprimer le contact' }),
    );
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        '/account/contacts?notice=deleted',
      ),
    );
  });
  it('affiche les quatre destinations et active la section imbriquée', async () => {
    navigation.pathname = `/account/companies/${id}/edit`;
    const h = await harness();
    h.render(
      <AccountShell>
        <p>Dossier</p>
      </AccountShell>,
    );
    const nav = screen.getByRole('navigation', { name: 'Espace privé' });
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
    expect(
      within(nav).getByRole('link', { name: 'Entreprises' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
describe('cache privé, concurrence et session', () => {
  it('déduplique les lectures et invalide après mutation confirmée', async () => {
    const h = await harness();
    const store = new CrmStore(h.manager, id);
    const stop = store.connect();
    const d = deferred<string>();
    const fetcher = vi.fn(() => d.promise);
    const first = store.load('companies', fetcher);
    expect(store.load('companies', fetcher)).toBe(first);
    d.resolve('ready');
    await first;
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.get('companies').data).toBe('ready');
    await store.mutate(async () => company);
    expect(store.get('companies').status).toBe('idle');
    stop();
  });
  it('ignore une réponse tardive invalidée sans écraser une recherche récente', async () => {
    const h = await harness();
    const store = new CrmStore(h.manager, id);
    const stop = store.connect();
    const old = deferred<string>();
    const pending = store.load('old', () => old.promise);
    await store.load('new', async () => 'recent');
    store.invalidate();
    await store.load('new', async () => 'newer');
    old.resolve('obsolete');
    await pending;
    expect(store.get('old').data).toBeUndefined();
    expect(store.get('new').data).toBe('newer');
    stop();
  });
  it('logout pendant une lecture purge immédiatement et rejette une mutation tardive', async () => {
    const h = await harness();
    const store = new CrmStore(h.manager, id);
    const stop = store.connect();
    const d = deferred<string>();
    const pending = store.load('companies', () => d.promise);
    const mutation = store.mutate(() => d.promise);
    await h.manager.logout();
    expect(store.get('companies').status).toBe('idle');
    d.resolve('private A');
    await pending;
    await expect(mutation).rejects.toMatchObject({ status: 401 });
    expect(store.get('companies').data).toBeUndefined();
    stop();
  });
  it('changement de compte interdit les données du propriétaire précédent', async () => {
    const h = await harness();
    const store = new CrmStore(h.manager, id);
    const stop = store.connect();
    await store.load('companies', async () => 'private A');
    vi.mocked(h.api.readUser).mockResolvedValue({ ...user, id: cid });
    await h.manager.logout();
    await h.manager.login({ email: 'b@example.com', password: 'fictional' });
    await store.load('companies', async () => 'B');
    expect(store.get('companies').data).toBeUndefined();
    expect(store.getEpoch()).toBeGreaterThan(0);
    stop();
  });
  it('CRM GET 401 refresh single-flight puis replay unique ; mutation 401 jamais rejouée', async () => {
    const h = await harness();
    vi.mocked(h.api.client.request)
      .mockRejectedValueOnce(new ApiError('expired', 401, 'UNAUTHORIZED'))
      .mockResolvedValueOnce(page([company]));
    await companiesApi(h.manager).list();
    expect(h.api.refresh).toHaveBeenCalledTimes(2);
    expect(h.api.client.request).toHaveBeenCalledTimes(2);
    vi.mocked(h.api.client.request).mockRejectedValueOnce(
      new ApiError('expired', 401, 'UNAUTHORIZED'),
    );
    await expect(companiesApi(h.manager).archive(id)).rejects.toMatchObject({
      status: 401,
    });
    expect(h.api.client.request).toHaveBeenCalledTimes(3);
    expect(h.manager.getSnapshot().user).toBeNull();
  });
});
