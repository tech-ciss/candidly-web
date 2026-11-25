import type { ReactNode } from 'react';
export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={id + '-error'} className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
