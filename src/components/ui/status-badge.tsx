import type { ReactNode } from 'react';
import { Badge } from './badge';
export function StatusBadge({
  tone,
  children,
}: {
  tone: 'blue' | 'green' | 'amber' | 'slate';
  children: ReactNode;
}) {
  return (
    <Badge variant="outline" className={'status-badge tone-' + tone}>
      {children}
    </Badge>
  );
}
