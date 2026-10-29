// Providers we correct towards. Short names (me, live, aol, pm) are left out: one edit from them
// lands on real providers like mac.com or qq.com.
const PROVIDERS = ['gmail', 'googlemail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'protonmail'];

// Real providers one edit away from a PROVIDERS entry
const LOOKALIKE_PROVIDERS = ['ymail', 'mail', 'email'];

/**
 * Suggest a fix for a likely typo in a common email domain, e.g. `jane@gmial.con` → `jane@gmail.com`.
 * Returns null when the email looks fine or the domain isn't one we know.
 */
export function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0) return null;

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1).toLowerCase();
  const [name = '', suffix = '', ...rest] = domain.split('.');

  // Multi-label domains are mostly university subdomains (smail.iitm.ac.in) and regional
  // providers (hotmail.co.uk), which would otherwise be "corrected" to gmail.* / hotmail.com
  if (rest.length > 0 || LOOKALIKE_PROVIDERS.includes(name)) return null;

  const provider = PROVIDERS.find((p) => p === name || isOneEditAway(name, p));
  if (!provider) return null;

  const isComTypo = suffix === '' || isOneEditAway(suffix, 'com');
  const fixedDomain = `${provider}.${isComTypo ? 'com' : suffix}`;

  return fixedDomain === domain ? null : `${localPart}@${fixedDomain}`;
}

/** True if `a` becomes `b` with exactly one insertion, deletion, substitution or adjacent swap. */
function isOneEditAway(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;

  if (a.length === b.length) {
    const isSubstitution = a.slice(i + 1) === b.slice(i + 1);
    const isSwap = a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
    return isSubstitution || isSwap;
  }

  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  return shorter.slice(i) === longer.slice(i + 1);
}
