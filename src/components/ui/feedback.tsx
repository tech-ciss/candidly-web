import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
export function Feedback({
  children,
  tone = 'error',
  className,
}: {
  children: ReactNode;
  tone?: 'error' | 'success' | 'info';
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('feedback', 'feedback-' + tone, className)}
    >
      {children}
    </div>
  );
}
