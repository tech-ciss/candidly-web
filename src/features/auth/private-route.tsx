'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './provider';
import { Button } from '@/components/ui/button';
export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { status, session } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);
  if (status === 'initializing' || status === 'refreshing')
    return <p role="status">Vérification de votre session…</p>;
  if (status === 'error')
    return (
      <div role="alert">
        <p>
          Connexion au service interrompue. Votre session peut encore être
          valide.
        </p>
        <Button onClick={() => void session?.retry().catch(() => undefined)}>
          Réessayer la session
        </Button>
        <Link href="/login">Se reconnecter</Link>
      </div>
    );
  if (status !== 'authenticated')
    return <p role="status">Redirection vers la connexion…</p>;
  return children;
}
