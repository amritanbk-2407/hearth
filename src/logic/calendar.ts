import { nextOccurrence } from '../lib/dates';
import type { HearthData } from '../types';
import { nextServiceDate } from './selectors';

export type EventKind = 'chore' | 'bill' | 'fixup' | 'service' | 'expiry' | 'warranty';

export interface CalEvent {
  date: string;
  kind: EventKind;
  title: string;
  route: string;
  done?: boolean;
}

export const EVENT_COLORS: Record<EventKind, string> = {
  chore: '#7c5cfc',
  bill: '#10b981',
  fixup: '#0ea5e9',
  service: '#0ea5e9',
  expiry: '#f59e0b',
  warranty: '#94a3b8',
};

/** Unified calendar: projects every dated item (incl. recurring ones) into [from, to]. */
export function buildEvents(d: HearthData, from: string, to: string): CalEvent[] {
  const out: CalEvent[] = [];
  const inRange = (x?: string) => !!x && x >= from && x <= to;

  for (const c of d.chores) {
    if (!c.active) continue;
    let due = c.dueDate;
    let guard = 0;
    while (due <= to && guard++ < 400) {
      if (due >= from) out.push({ date: due, kind: 'chore', title: c.title, route: '/chores' });
      if (c.recurrence === 'none') break;
      due = nextOccurrence(due, c.recurrence);
    }
  }
  for (const cc of d.completions) {
    if (inRange(cc.date)) out.push({ date: cc.date, kind: 'chore', title: cc.title, route: '/chores', done: true });
  }
  for (const b of d.bills) {
    let due = b.dueDate;
    let guard = 0;
    while (due <= to && guard++ < 50) {
      if (due >= from) out.push({ date: due, kind: 'bill', title: `${b.name} (₹${b.amount})`, route: '/bills', done: b.isPaid && due === b.dueDate });
      if (b.recurrence === 'none') break;
      due = nextOccurrence(due, b.recurrence);
    }
  }
  for (const f of d.fixups) {
    if (f.status !== 'done' && inRange(f.dueDate)) out.push({ date: f.dueDate!, kind: 'fixup', title: f.title, route: '/fixups' });
  }
  for (const a of d.assets) {
    const next = nextServiceDate(a);
    if (inRange(next)) out.push({ date: next!, kind: 'service', title: `${a.name} service`, route: '/fixups' });
    if (inRange(a.warrantyUntil)) out.push({ date: a.warrantyUntil!, kind: 'warranty', title: `${a.name} warranty ends`, route: '/fixups' });
  }
  for (const s of d.stock) {
    if (inRange(s.expiryDate)) out.push({ date: s.expiryDate!, kind: 'expiry', title: `${s.name} expires`, route: '/stock' });
  }
  return out;
}
