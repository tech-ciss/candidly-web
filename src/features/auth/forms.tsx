'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './provider';
import { validateForm, consumeActionToken, type FormKind } from './validation';
import type { Registration } from './types';
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 429)
      return (
        'Trop de demandes. Réessayez plus tard.' +
        (error.retryAfter && /^\d+$/.test(error.retryAfter)
          ? ` Délai indiqué : ${error.retryAfter} secondes.`
          : '')
      );
    if (error.status === 401)
      return 'Connexion refusée. Vérifiez vos identifiants et la vérification de votre email.';
    if (error.status === 400)
      return 'La demande est invalide. Vérifiez les champs ou demandez un nouveau lien.';
    return error.message;
  }
  return 'Le service est temporairement indisponible. Réessayez plus tard.';
}
const titles: Record<FormKind, string> = {
  login: 'Se connecter',
  register: 'Créer mon compte',
  forgot: 'Mot de passe oublié',
  reset: 'Nouveau mot de passe',
  resend: 'Recevoir un nouveau lien',
  profile: 'Modifier mon profil',
};
export function AuthForm({ kind }: { kind: FormKind }) {
  const { session, user, message: sessionMessage } = useAuth(),
    router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(''),
    [success, setSuccess] = useState(false),
    [token, setToken] = useState<string | null>(null);
  const consumed = useRef(false);
  useEffect(() => {
    if (kind === 'reset' && !consumed.current) {
      consumed.current = true;
      setToken(consumeActionToken());
    }
  }, [kind]);
  const fields =
    kind === 'profile'
      ? ['firstName', 'lastName']
      : kind === 'reset'
        ? ['newPassword']
        : kind === 'register'
          ? ['firstName', 'lastName', 'email', 'password']
          : kind === 'login'
            ? ['email', 'password']
            : ['email'];
  const labels: Record<string, string> = {
    email: 'Adresse email',
    firstName: 'Prénom',
    lastName: 'Nom',
    password: 'Mot de passe',
    newPassword: 'Nouveau mot de passe',
  };
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !session) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >;
    if (data.email) data.email = data.email.trim().toLowerCase();
    if (data.firstName) data.firstName = data.firstName.trim();
    if (data.lastName) data.lastName = data.lastName.trim();
    const invalid = validateForm(kind, data);
    setErrors(invalid);
    setMessage('');
    if (Object.keys(invalid).length) return;
    if (kind === 'reset' && !token) {
      setMessage(
        'Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien.',
      );
      return;
    }
    busy.current = true;
    setPending(true);
    setSuccess(false);
    try {
      if (kind === 'login') {
        await session.login({ email: data.email!, password: data.password! });
        form.reset();
        router.replace('/account');
      } else if (kind === 'register') {
        await session.api.register(data as unknown as Registration);
        form.reset();
        setMessage(
          'Si votre demande est éligible, un email de vérification sera préparé. Vérifiez votre adresse avant de vous connecter.',
        );
        setSuccess(true);
      } else if (kind === 'forgot' || kind === 'resend') {
        await (kind === 'forgot'
          ? session.api.forgot(data.email!)
          : session.api.resend(data.email!));
        form.reset();
        setMessage(
          'Si cette demande est éligible, un message sera préparé. Consultez votre messagerie.',
        );
        setSuccess(true);
      } else if (kind === 'reset') {
        await session.api.reset(token!, data.newPassword!);
        setToken(null);
        session.invalidate();
        form.reset();
        setMessage(
          'Mot de passe réinitialisé. Connectez-vous avec votre nouveau mot de passe.',
        );
        setSuccess(true);
      } else {
        await session.updateProfile({
          firstName: data.firstName!,
          lastName: data.lastName!,
        });
        setMessage('Profil enregistré.');
        setSuccess(true);
      }
    } catch (error) {
      setMessage(
        kind === 'reset' && error instanceof ApiError && error.status === 400
          ? 'Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien.'
          : errorMessage(error),
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="auth-form"
      aria-label={titles[kind]}
    >
      {kind === 'login' && sessionMessage && (
        <div role="alert">
          <p>{sessionMessage}</p>
          <Button
            type="button"
            onClick={() => void session?.logout().catch(() => undefined)}
          >
            Réessayer la déconnexion serveur
          </Button>
        </div>
      )}
      {fields.map((name) => (
        <div key={name}>
          <label htmlFor={kind + '-' + name}>{labels[name]}</label>
          <Input
            id={kind + '-' + name}
            name={name}
            type={
              name.includes('Password') || name === 'password'
                ? 'password'
                : name === 'email'
                  ? 'email'
                  : 'text'
            }
            autoComplete={
              name === 'email'
                ? 'email'
                : name === 'password'
                  ? kind === 'register'
                    ? 'new-password'
                    : 'current-password'
                  : name === 'newPassword'
                    ? 'new-password'
                    : name === 'firstName'
                      ? 'given-name'
                      : 'family-name'
            }
            required
            maxLength={
              name === 'email'
                ? 254
                : name.toLowerCase().includes('password')
                  ? 128
                  : 100
            }
            defaultValue={
              kind === 'profile'
                ? name === 'firstName'
                  ? user?.firstName
                  : user?.lastName
                : undefined
            }
            aria-invalid={!!errors[name]}
            aria-describedby={
              errors[name] ? kind + '-' + name + '-error' : undefined
            }
            disabled={pending}
          />
          {errors[name] && (
            <p id={kind + '-' + name + '-error'} className="auth-error">
              {errors[name]}
            </p>
          )}
        </div>
      ))}
      {kind === 'reset' && !token && !success && (
        <p>Ouvrez le lien reçu par email pour définir votre mot de passe.</p>
      )}
      {message && <p role={success ? 'status' : 'alert'}>{message}</p>}
      <Button
        type="submit"
        disabled={
          pending || !session || (kind === 'reset' && (!token || success))
        }
      >
        {pending ? 'Traitement…' : titles[kind]}
      </Button>
      {kind === 'reset' && (
        <Link href="/forgot-password">Demander un nouveau lien</Link>
      )}
    </form>
  );
}
export function VerifyEmail() {
  const { session } = useAuth();
  const consumed = useRef(false),
    busy = useRef(false);
  const [token, setToken] = useState<string | null>(null),
    [message, setMessage] = useState(''),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  useEffect(() => {
    if (!consumed.current) {
      consumed.current = true;
      setToken(consumeActionToken());
    }
  }, []);
  async function verify() {
    if (!token || !session || busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await session.api.verify(token);
      setDone(true);
      setToken(null);
      setMessage(
        'Votre adresse email est vérifiée. Vous pouvez vous connecter.',
      );
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 400
          ? 'Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien.'
          : errorMessage(error),
      );
    } finally {
      setPending(false);
      busy.current = false;
    }
  }
  return (
    <>
      <p>Confirmez votre adresse avec le lien reçu par email.</p>
      {!token && !done && (
        <p>
          Le lien est absent ou invalide. Vous pouvez demander un nouveau lien
          ci-dessous.
        </p>
      )}
      <Button
        disabled={!token || !session || pending || done}
        onClick={() => void verify()}
      >
        {pending ? 'Vérification…' : 'Vérifier mon adresse email'}
      </Button>
      {message && <p role={done ? 'status' : 'alert'}>{message}</p>}
      {!done && <AuthForm kind="resend" />}
      <Link href="/login">Se connecter</Link>
    </>
  );
}
