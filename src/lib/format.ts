const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const rupees = (n: number) => inr.format(Math.round(n));

export const uid = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  ).slice(0, 12);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const pct = (part: number, whole: number) =>
  whole <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
