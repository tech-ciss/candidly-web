'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Feedback } from '@/components/ui/feedback';
import { useAuth } from './provider';
import { AuthForm, errorMessage } from './forms';
import type { Preferences, User } from './types';
import { Building2, UsersRound, Plus } from 'lucide-react';
import { useCrm, useCrmQuery } from '@/features/crm/provider';
import {
  CrmHeading,
  DetailSection,
  DossierFields,
  crmError,
} from '@/features/crm/shared';
import { initials, LogoutButton } from '@/features/crm/account-shell';
export function AccountHome() {
  const { user } = useAuth();
  const { companies, contacts } = useCrm();
  const organizations = useCrmQuery('overview:companies', (signal) =>
    companies.list({ limit: '1', status: 'ACTIVE' }, signal),
  );
  const people = useCrmQuery('overview:contacts', (signal) =>
    contacts.list({ limit: '1' }, signal),
  );
  const empty =
    organizations.status === 'ready' &&
    people.status === 'ready' &&
    organizations.data?.meta.total === 0 &&
    people.data?.meta.total === 0;
  return (
    <section className="crm crm-overview">
      <CrmHeading
        title={`Bonjour ${user?.firstName ?? ''},`}
        description="Gardez le fil de vos relations professionnelles."
      >
        <Link className="crm-primary-link" href="/account/companies/new">
          <Plus size={18} aria-hidden="true" />
          Ajouter une entreprise
        </Link>
        <Link className="crm-secondary-link" href="/account/contacts/new">
          <Plus size={18} aria-hidden="true" />
          Ajouter un contact
        </Link>
      </CrmHeading>
      <div className="crm-overview-grid">
        {[
          {
            title: 'Entreprises',
            href: '/account/companies',
            label: 'entreprises actives',
            singular: 'entreprise active',
            state: organizations,
            Icon: Building2,
          },
          {
            title: 'Contacts',
            href: '/account/contacts',
            label: 'contacts professionnels',
            singular: 'contact professionnel',
            state: people,
            Icon: UsersRound,
          },
        ].map(({ title, href, label, singular, state, Icon }) => (
          <section className="crm-overview-item" key={href}>
            <div className="crm-overview-title">
              <Icon size={22} aria-hidden="true" />
              <h2>
                <Link href={href}>{title}</Link>
              </h2>
            </div>
            {state.status === 'ready' ? (
              <p className="crm-overview-total">
                <strong>{state.data?.meta.total}</strong>
                <span>{state.data?.meta.total === 1 ? singular : label}</span>
              </p>
            ) : state.status === 'error' ? (
              <>
                <p role="alert">{crmError(state.error)}</p>
                <Button variant="outline" onClick={state.retry}>
                  Réessayer {title.toLowerCase()}
                </Button>
              </>
            ) : (
              <p role="status">Chargement…</p>
            )}
            <Link href={href}>Ouvrir mes {title.toLowerCase()}</Link>
          </section>
        ))}
      </div>
      <section className="crm-overview-guide">
        <div className="crm-record-symbol">
          <Building2 size={26} aria-hidden="true" />
        </div>
        <div>
          <h2>
            {empty
              ? 'Votre prochain dossier commence ici'
              : 'Un espace qui garde les liens'}
          </h2>
          <p>
            {empty
              ? 'Commencez par une entreprise, puis ajoutez les personnes avec qui vous échangez.'
              : 'Retrouvez chaque organisation, ses informations et les personnes qui lui sont associées.'}
          </p>
          <Link href="/account/companies">Parcourir mes entreprises</Link>
        </div>
      </section>
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
        <p role="status" className="loading-state">
          Chargement du profil…
        </p>
        {error && <Feedback>{error}</Feedback>}
      </>
    );
  return (
    <section className="crm crm-profile">
      <CrmHeading
        title="Mon profil"
        description="Vos informations et vos préférences, au même endroit."
      />
      <div className="crm-profile-identity">
        <span className="app-avatar app-avatar-large" aria-hidden="true">
          {initials(user?.firstName, user?.lastName)}
        </span>
        <div>
          <h2>
            {user?.firstName} {user?.lastName}
          </h2>
          <p>{user?.email}</p>
        </div>
      </div>
      <div className="crm-profile-grid">
        <DetailSection title="Identité">
          <AuthForm kind="profile" />
        </DetailSection>
        <DetailSection title="Informations du compte">
          <DossierFields
            entries={[
              ['Adresse email', user?.email],
              [
                'Email vérifié le',
                new Date(profile.emailVerifiedAt).toLocaleDateString('fr'),
              ],
              [
                'Compte créé le',
                new Date(profile.createdAt).toLocaleDateString('fr'),
              ],
            ]}
          />
        </DetailSection>
        <DetailSection title="Préférences">
          <form onSubmit={save} className="auth-form" aria-busy={pending}>
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
          {error && <Feedback>{error}</Feedback>}
          {saved && <Feedback tone="success">{saved}</Feedback>}
        </DetailSection>
        <DetailSection title="Gestion de la session">
          <p>Déconnectez-vous lorsque vous utilisez un appareil partagé.</p>
          <LogoutButton />
        </DetailSection>
      </div>
    </section>
  );
}
