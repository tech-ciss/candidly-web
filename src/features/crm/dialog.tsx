'use client';
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
/** Native modal: top layer, inert background, Escape and browser focus restoration. */
export function DialogPanel({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="crm-dialog"
      onKeyDown={(event) => {
        if (
          event.key !== 'Tab' ||
          (event.target as HTMLElement).closest('dialog') !==
            event.currentTarget
        )
          return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.stopPropagation();
        onClose();
      }}
      onClose={(event) => {
        if (event.target !== event.currentTarget) return;
        event.stopPropagation();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="crm-dialog-content">
          <header className="crm-dialog-heading">
            <h2 id={titleId}>{title}</h2>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              aria-label={`Fermer : ${title}`}
            >
              <X aria-hidden="true" size={20} />
            </Button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
