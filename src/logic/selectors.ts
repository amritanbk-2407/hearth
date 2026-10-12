import { daysUntil, shiftDays } from '../lib/dates';
import type { Asset, Bill, Chore, HearthData, StockItem } from '../types';

/** Chores that are due today or overdue and not yet done. */
export const pendingChores = (chores: Chore[], today: string) =>
  chores.filter((c) => c.active && c.dueDate <= today);

export const overdueChores = (chores: Chore[], today: string) =>
  chores.filter((c) => c.active && c.dueDate < today);

export const unpaidBills = (bills: Bill[]) => bills.filter((b) => !b.isPaid);

export const isLowStock = (s: StockItem) => s.quantity <= s.threshold;

export const lowStock = (stock: StockItem[]) => stock.filter(isLowStock);

/** Date the next service is due for an asset, if it has a schedule. */
export function nextServiceDate(a: Asset): string | undefined {
  if (!a.serviceIntervalDays) return undefined;
  if (!a.lastServiced) return a.purchaseDate ?? undefined;
  return shiftDays(a.lastServiced, a.serviceIntervalDays);
}

export function serviceStatus(a: Asset, today: string): 'overdue' | 'due' | 'good' | 'none' {
  const next = nextServiceDate(a);
  if (!next) return 'none';
  const d = daysUntil(next, today);
  if (d < 0) return 'overdue';
  if (d <= 7) return 'due';
  return 'good';
}

export const openFixUps = (data: Pick<HearthData, 'fixups'>) =>
  data.fixups.filter((f) => f.status !== 'done');

export const monthSpend = (data: Pick<HearthData, 'expenses'>, month: string) =>
  data.expenses.filter((e) => e.date.startsWith(month)).reduce((a, e) => a + e.amount, 0);
