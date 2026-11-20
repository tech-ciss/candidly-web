import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createApiClient, type ApiRequestOptions } from '@/lib/api/client';
import { createAuthApi } from '@/features/auth/api';
import { SessionManager } from '@/features/auth/session';
import { AuthProvider } from '@/features/auth/provider';
import { Profile } from '@/features/auth/account';
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
it('affiche le profil réel et modifie uniquement les noms et la préférence de fuseau', async () => {
  let user = {
    id: 'fixture-id',
    firstName: 'Awa',
    lastName: 'Fixture',
    email: 'awa@example.com',
    createdAt: '2026-01-01T00:00:00Z',
    emailVerifiedAt: '2026-01-01T00:00:00Z',
  };
  let pref = {
    locale: 'fr',
    timezone: 'Africa/Abidjan',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const api = createAuthApi(createApiClient('http://localhost:3001/api/v1'));
  api.refresh = vi.fn().mockResolvedValue({
    accessToken: 'fixture-access',
    tokenType: 'Bearer',
    expiresIn: 900,
  });
  api.readUser = vi.fn().mockImplementation(() => Promise.resolve(user));
  const send = vi.fn(async (path: string, options: ApiRequestOptions = {}) => {
    if (options.method === 'PATCH') {
      const data = JSON.parse(String(options.body)) as Record<string, string>;
      if (path.endsWith('preferences'))
        pref = { ...pref, timezone: data.timezone! };
      else
        user = {
          ...user,
          firstName: data.firstName!,
          lastName: data.lastName!,
        };
    }
    return path.endsWith('preferences') ? pref : user;
  });
  api.client.request = async <T,>(
    path: string,
    options: ApiRequestOptions = {},
  ) => (await send(path, options)) as unknown as T;
  const manager = new SessionManager(api);
  await manager.initialize();
  render(
    <AuthProvider manager={manager}>
      <Profile />
    </AuthProvider>,
  );
  expect(await screen.findByText(user.email)).toBeInTheDocument();
  expect(screen.getByLabelText('Fuseau horaire')).toHaveValue('Africa/Abidjan');
  fireEvent.change(screen.getByLabelText('Prénom'), {
    target: { value: 'Fatou' },
  });
  fireEvent.submit(screen.getByRole('form', { name: 'Modifier mon profil' }));
  expect(await screen.findByText('Profil enregistré.')).toBeInTheDocument();
  expect(manager.getSnapshot().user?.firstName).toBe('Fatou');
  fireEvent.change(screen.getByLabelText('Fuseau horaire'), {
    target: { value: 'Invalid/Zone' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Enregistrer les préférences' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('IANA');
  fireEvent.change(screen.getByLabelText('Fuseau horaire'), {
    target: { value: 'UTC' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Enregistrer les préférences' }),
  );
  await waitFor(() =>
    expect(screen.getByText('Préférences enregistrées.')).toBeInTheDocument(),
  );
  const writes = send.mock.calls.filter(
    ([, options]) => options?.method === 'PATCH',
  );
  expect(writes).toHaveLength(2);
  expect(JSON.parse(String(writes[0]![1]!.body))).toEqual({
    firstName: 'Fatou',
    lastName: 'Fixture',
  });
  expect(JSON.parse(String(writes[1]![1]!.body))).toEqual({ timezone: 'UTC' });
});
