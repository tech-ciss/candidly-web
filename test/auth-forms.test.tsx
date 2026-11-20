import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { createAuthApi } from '@/features/auth/api';
import { createApiClient, ApiError } from '@/lib/api/client';
import { SessionManager } from '@/features/auth/session';
import { AuthProvider } from '@/features/auth/provider';
import { PrivateRoute } from '@/features/auth/private-route';
import { AuthForm, VerifyEmail } from '@/features/auth/forms';
import { validateForm, consumeActionToken } from '@/features/auth/validation';
const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
const user = {
  id: 'fixture',
  email: 'awa@example.com',
  firstName: 'Awa',
  lastName: 'Fixture',
  createdAt: '2026-01-01T00:00:00Z',
  emailVerifiedAt: '2026-01-01T00:00:00Z',
};
function harness() {
  const api = createAuthApi(createApiClient('http://localhost:3001/api/v1'));
  api.refresh = vi
    .fn()
    .mockRejectedValue(new ApiError('refus', 401, 'UNAUTHORIZED'));
  api.login = vi.fn().mockResolvedValue({
    accessToken: 'access',
    expiresIn: 900,
    tokenType: 'Bearer',
    user,
  });
  api.readUser = vi.fn().mockResolvedValue(user);
  api.register = vi
    .fn()
    .mockResolvedValue({ success: true, message: 'neutre' });
  api.verify = vi.fn().mockResolvedValue({ success: true, message: 'ok' });
  api.reset = vi.fn().mockResolvedValue({ success: true, message: 'ok' });
  api.forgot = vi.fn().mockResolvedValue({ success: true, message: 'neutre' });
  api.resend = vi.fn().mockResolvedValue({ success: true, message: 'neutre' });
  const manager = new SessionManager(api);
  return { api, manager };
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { selector: 'input' }), {
    target: { value },
  });
}
afterEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
});
describe('formulaires et routes auth', () => {
  it('validation locale et contrat sans règle de composition inventée', () => {
    expect(
      validateForm('register', {
        firstName: ' ',
        lastName: 'Nom',
        email: 'bad',
        password: 'short',
      }),
    ).toHaveProperty('email');
    expect(
      validateForm('login', {
        email: 'awa@example.com',
        password: 'abcdefghijkl',
      }),
    ).toEqual({});
    expect(validateForm('profile', { firstName: 'A', lastName: 'B' })).toEqual(
      {},
    );
  });
  it('inscription connectée, double soumission bloquée et confirmation de vérification', async () => {
    const { api, manager } = harness();
    render(
      <AuthProvider manager={manager}>
        <AuthForm kind="register" />
      </AuthProvider>,
    );
    fill('Prénom', 'Awa');
    fill('Nom', 'Fixture');
    fill('Adresse email', ' AWA@example.com ');
    fill('Mot de passe', 'MotDePasse2026!');
    fireEvent.submit(screen.getByRole('form'));
    fireEvent.submit(screen.getByRole('form'));
    await screen.findByText(/Vérifiez votre adresse avant/);
    expect(api.register).toHaveBeenCalledTimes(1);
    expect(api.register).toHaveBeenCalledWith({
      firstName: 'Awa',
      lastName: 'Fixture',
      email: 'awa@example.com',
      password: 'MotDePasse2026!',
    });
  });
  it('inscription refusée et champs invalides restent contrôlés', async () => {
    const { api, manager } = harness();
    vi.mocked(api.register).mockRejectedValue(
      new ApiError('refus', 400, 'BAD_REQUEST'),
    );
    render(
      <AuthProvider manager={manager}>
        <AuthForm kind="register" />
      </AuthProvider>,
    );
    fireEvent.submit(screen.getByRole('form'));
    expect(api.register).not.toHaveBeenCalled();
    expect(await screen.findByText(/adresse email valide/)).toBeInTheDocument();
    fill('Prénom', 'A');
    fill('Nom', 'B');
    fill('Adresse email', 'a@example.com');
    fill('Mot de passe', 'MotDePasse2026!');
    fireEvent.submit(screen.getByRole('form'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /demande est invalide/,
    );
  });
  it('login confirme identité et ignore toute redirection returnUrl externe', async () => {
    window.history.replaceState(
      null,
      '',
      '/login?returnUrl=https://external.example',
    );
    const { api, manager } = harness();
    render(
      <AuthProvider manager={manager}>
        <AuthForm kind="login" />
      </AuthProvider>,
    );
    fill('Adresse email', user.email);
    fill('Mot de passe', 'MotDePasse2026!');
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/account'));
    expect(api.login).toHaveBeenCalledTimes(1);
  });
  it('401 et 429 restent lisibles sans énumération de comptes', async () => {
    const { api, manager } = harness();
    vi.mocked(api.login)
      .mockRejectedValueOnce(new ApiError('refus', 401, 'UNAUTHORIZED'))
      .mockRejectedValueOnce(
        new ApiError('limite', 429, 'TOO_MANY_REQUESTS', undefined, '60'),
      );
    render(
      <AuthProvider manager={manager}>
        <AuthForm kind="login" />
      </AuthProvider>,
    );
    fill('Adresse email', user.email);
    fill('Mot de passe', 'MotDePasse2026!');
    fireEvent.submit(screen.getByRole('form'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Connexion refusée/,
    );
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/60 secondes/),
    );
  });
  it('consomme le fragment en mémoire, efface l’URL et vérifie une seule fois', async () => {
    const raw = 'x'.repeat(43);
    window.history.replaceState(null, '', '/verify-email#token=' + raw);
    const { api, manager } = harness();
    render(
      <AuthProvider manager={manager}>
        <VerifyEmail />
      </AuthProvider>,
    );
    await waitFor(() => expect(window.location.hash).toBe(''));
    const button = screen.getByRole('button', {
      name: 'Vérifier mon adresse email',
    });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(
      await screen.findByText(/Votre adresse email est vérifiée/),
    ).toBeInTheDocument();
    expect(api.verify).toHaveBeenCalledTimes(1);
    expect(api.verify).toHaveBeenCalledWith(raw);
  });
  it('lien expiré/invalide/consommé : même message et renvoi disponible', async () => {
    window.history.replaceState(
      null,
      '',
      '/verify-email#token=' + 'x'.repeat(43),
    );
    const { api, manager } = harness();
    vi.mocked(api.verify).mockRejectedValue(
      new ApiError('refus', 400, 'BAD_REQUEST'),
    );
    render(
      <AuthProvider manager={manager}>
        <VerifyEmail />
      </AuthProvider>,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Vérifier mon adresse email' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalide, expiré ou déjà utilisé/,
    );
    fill('Adresse email', user.email);
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() => expect(api.resend).toHaveBeenCalledWith(user.email));
  });
  it('forgot neutre et reset réel sans persistance du jeton', async () => {
    const { api, manager } = harness();
    const view = render(
      <AuthProvider manager={manager}>
        <AuthForm kind="forgot" />
      </AuthProvider>,
    );
    fill('Adresse email', user.email);
    fireEvent.submit(screen.getByRole('form'));
    expect(
      await screen.findByText(/Si cette demande est éligible/),
    ).toBeInTheDocument();
    view.unmount();
    window.history.replaceState(
      null,
      '',
      '/reset-password#token=' + 'z'.repeat(43),
    );
    render(
      <AuthProvider manager={manager}>
        <AuthForm kind="reset" />
      </AuthProvider>,
    );
    fill('Nouveau mot de passe', 'NouveauMot2026!');
    fireEvent.submit(screen.getByRole('form'));
    expect(
      await screen.findByText(/Mot de passe réinitialisé/),
    ).toBeInTheDocument();
    expect(api.reset).toHaveBeenCalledWith('z'.repeat(43), 'NouveauMot2026!');
    expect(window.location.hash).toBe('');
  });
  it('protège pendant initialisation sans flash puis affiche, retire au logout', async () => {
    const { api, manager } = harness();
    let resolve!: (value: {
      accessToken: string;
      tokenType: 'Bearer';
      expiresIn: number;
    }) => void;
    api.refresh = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    api.logout = vi.fn().mockResolvedValue(undefined);
    render(
      <AuthProvider manager={manager}>
        <PrivateRoute>
          <p>Données privées</p>
        </PrivateRoute>
      </AuthProvider>,
    );
    expect(screen.queryByText('Données privées')).not.toBeInTheDocument();
    await act(async () => {
      resolve({ accessToken: 'access', tokenType: 'Bearer', expiresIn: 900 });
    });
    expect(await screen.findByText('Données privées')).toBeInTheDocument();
    await act(() => manager.logout());
    expect(screen.queryByText('Données privées')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/login');
  });
  it('panne réseau ne redirige pas vers login et propose une reprise', async () => {
    const { api, manager } = harness();
    api.refresh = vi
      .fn()
      .mockRejectedValue(new ApiError('réseau', null, 'NETWORK_ERROR'));
    render(
      <AuthProvider manager={manager}>
        <PrivateRoute>
          <p>Privé</p>
        </PrivateRoute>
      </AuthProvider>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /encore être valide/,
    );
    expect(replace).not.toHaveBeenCalled();
  });
  it('refuse un token en query et les fragments ambigus', () => {
    window.history.replaceState(
      null,
      '',
      '/reset-password?token=bad#token=a&token=b',
    );
    expect(consumeActionToken()).toBeNull();
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('');
  });
});
