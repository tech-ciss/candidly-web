import * as React from 'react';
import { cn } from '@/lib/utils';
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input placeholder:text-muted-foreground flex h-11 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...props}
    />
  );
}
export { Input };
