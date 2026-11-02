import { CircleCheck, Inbox, TriangleAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
export type InterfaceStatus = 'loading' | 'empty' | 'error' | 'success';
export function InterfaceState({
  status,
  onRetry,
}: {
  status: InterfaceStatus;
  onRetry?: () => void;
}) {
  if (status === 'loading')
    return (
      <div
        role="status"
        aria-label="Chargement de démonstration"
        className="state-box"
      >
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <p>Chargement — aperçu visuel uniquement.</p>
      </div>
    );
  const content = {
    empty: {
      icon: Inbox,
      title: 'Tout commence par une première piste.',
      text: 'Aucun élément dans cet aperçu. Les données restent fictives.',
    },
    error: {
      icon: TriangleAlert,
      title: 'Une pause, puis on reprend.',
      text: 'Erreur simulée pour présenter l’interface. Aucun service n’a été appelé.',
    },
    success: {
      icon: CircleCheck,
      title: 'Votre espace est prêt.',
      text: 'État de réussite de démonstration. Aucune donnée n’a été enregistrée.',
    },
  }[status];
  const Icon = content.icon;
  return (
    <div
      className={'state-box state-' + status}
      role={status === 'error' ? 'alert' : 'status'}
    >
      <Icon size={24} aria-hidden="true" />
      <strong>{content.title}</strong>
      <p>{content.text}</p>
      {status === 'error' && onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Réessayer la démonstration
        </Button>
      )}
    </div>
  );
}
