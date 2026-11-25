'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InterfaceState, type InterfaceStatus } from './interface-state';
export function StateDemo() {
  const [status, setStatus] = useState<InterfaceStatus>('empty');
  return (
    <section className="state-demo" aria-labelledby="states-title">
      <div>
        <h2 id="states-title">Un espace qui reste clair.</h2>
        <p>
          Les quatre états de l’interface, à explorer sans rien enregistrer.
        </p>
        <div className="state-controls" aria-label="États de démonstration">
          {(['empty', 'loading', 'error', 'success'] as const).map((key) => (
            <Button
              key={key}
              variant={status === key ? 'default' : 'outline'}
              aria-pressed={status === key}
              onClick={() => setStatus(key)}
            >
              {
                {
                  empty: 'Vide',
                  loading: 'Chargement',
                  error: 'Erreur',
                  success: 'Réussite',
                }[key]
              }
            </Button>
          ))}
        </div>
      </div>
      <InterfaceState status={status} onRetry={() => setStatus('success')} />
    </section>
  );
}
