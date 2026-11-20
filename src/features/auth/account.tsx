'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './provider';
import { AuthForm, errorMessage } from './forms';
import type { Preferences, User } from './types';
export function AccountHome() {
  const { user, session, message } = useAuth();
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  return (
    <section>
      <h1>Mon espace privé</h1>
      <p>
        Bonjour {user?.firstName} {user?.lastName}.
      </p>
      <p>{user?.email}</p>
      <p>
        Vos informations de compte sont réelles. Aucun module CRM n’est connecté
        dans cet écran.
      </p>
      <nav className="auth-links" aria-label="Navigation du compte">
        <Link href="/account/profile">Mon profil et mes préférences</Link>
        <Link href="/dashboard">Ouvrir la démonstration fictive séparée</Link>
      </nav>
      <Button
        onClick={() => {
          if (!session || pending.current) return;
          pending.current = true;
          void session
            .logout()
            .catch((error) => setNotice(errorMessage(error)))
            .finally(() => {
              pending.current = false;
            });
        }}
      >
        Se déconnecter
      </Button>
      {(notice || message) && <p role="alert">{notice || message}</p>}
    </section>
  );
}
export function Profile() {
  const { session, user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null),
    [preferences, setPreferences] = useState<Preferences | null>(null),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(''),
    [pending, setPending] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    if (session)
      void Promise.all([
        session.request<User>('/users/me'),
        session.request<Preferences>('/users/me/preferences'),
      ])
        .then(([data, pref]) => {
          if (active) {
            setProfile(data);
            setPreferences(pref);
          }
        })
        .catch((e) => {
          if (active) setError(errorMessage(e));
        });
    return () => {
      active = false;
    };
  }, [session]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy.current) return;
    const data = new FormData(event.currentTarget);
    const timezone = String(data.get('timezone') ?? '');
    const supported = new Set(['UTC', ...Intl.supportedValuesOf('timeZone')]);
    if (!supported.has(timezone) || timezone.length > 100) {
      setError('Choisissez un fuseau horaire IANA valide, ou UTC.');
      return;
    }
    busy.current = true;
    setPending(true);
    setError('');
    setSaved('');
    try {
      const value = await session.request<Preferences>(
        '/users/me/preferences',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone }),
        },
      );
      setPreferences(value);
      setSaved('Préférences enregistrées.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  if (!profile || !preferences)
    return (
      <>
        <p role="status">Chargement du profil…</p>
        {error && <p role="alert">{error}</p>}
      </>
    );
  return (
    <>
      <h1>Mon profil</h1>
      <dl>
        <dt>Adresse email</dt>
        <dd>{user?.email}</dd>
        <dt>Email vérifié le</dt>
        <dd>{new Date(profile.emailVerifiedAt).toLocaleDateString('fr')}</dd>
        <dt>Compte créé le</dt>
        <dd>{new Date(profile.createdAt).toLocaleDateString('fr')}</dd>
      </dl>
      <AuthForm kind="profile" />
      <h2>Mes préférences</h2>
      <form onSubmit={save} className="auth-form">
        <p>Langue : français</p>
        <label htmlFor="account-timezone">Fuseau horaire</label>
        <Input
          id="account-timezone"
          name="timezone"
          defaultValue={preferences.timezone}
          maxLength={100}
          list="timezones"
          disabled={pending}
        />
        <datalist id="timezones">
          {['UTC', ...Intl.supportedValuesOf('timeZone')].map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        <Button disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer les préférences'}
        </Button>
      </form>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">{saved}</p>}
      <Link href="/account">Retour au compte</Link>
    </>
  );
}
