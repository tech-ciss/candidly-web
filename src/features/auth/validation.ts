export type FormKind =
  'login' | 'register' | 'forgot' | 'reset' | 'resend' | 'profile';
export function validateForm(
  kind: FormKind,
  data: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (
    ['register', 'login', 'forgot', 'resend'].includes(kind) &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '') ||
      (data.email?.length ?? 0) > 254)
  )
    errors.email =
      'Saisissez une adresse email valide (254 caractères maximum).';
  if (['register', 'profile'].includes(kind))
    for (const key of ['firstName', 'lastName']) {
      const length = Array.from(data[key]?.trim() ?? '').length;
      if (length < 1 || length > 100)
        errors[key] = 'Saisissez entre 1 et 100 caractères.';
    }
  if (['register', 'login', 'reset'].includes(kind)) {
    const key = kind === 'reset' ? 'newPassword' : 'password',
      length = Array.from(data[key] ?? '').length;
    if (length < 12 || length > 128)
      errors[key] = 'Le mot de passe doit contenir entre 12 et 128 caractères.';
  }
  return errors;
}
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export function consumeActionToken(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const tokens = params.getAll('token');
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname,
  );
  return tokens.length === 1 &&
    params.size === 1 &&
    TOKEN_PATTERN.test(tokens[0]!)
    ? tokens[0]!
    : null;
}
