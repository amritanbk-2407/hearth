import { daysUntil } from '../lib/dates';
import type { HearthData } from '../types';
import { isLowStock, pendingChores, serviceStatus } from './selectors';
import { completedToday, computeStreak } from './streak';

/**
 * House Health Score (0–100)
 * ---------------------------------------------------------------
 *  Component        Weight   How it is measured
 *  Chores             30     done today ÷ (done today + due/overdue)
 *  Bills              25     unpaid overdue bill = 0, unpaid due ≤3 days = 0.5, else 1
 *  Stock              20     items above their low-stock threshold ÷ all items
 *  Maintenance        15     assets/fix-ups not overdue (due ≤7 days = 0.5)
 *  Consistency        10     household streak, capped at 7 days
 * ---------------------------------------------------------------
 * Each component scores 0..1 and is multiplied by its weight.
 * An empty category scores full marks (nothing needs attention).
 */

export interface ScoreComponent {
  key: 'chores' | 'bills' | 'stock' | 'maintenance' | 'consistency';
  label: string;
  weight: number;
  ratio: number; // 0..1
  points: number; // ratio * weight
  detail: string;
}

export interface HealthScore {
  score: number;
  label: 'Great!' | 'Good' | 'Needs attention' | 'Critical';
  message: string;
  components: ScoreComponent[];
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1);

export function computeHealthScore(data: HearthData, today: string): HealthScore {
  // Chores
  const done = completedToday(data.completions, today).length;
  const pending = pendingChores(data.chores, today).length;
  const choreRatio = done + pending === 0 ? 1 : done / (done + pending);

  // Bills
  const billRatios = data.bills.map((b) => {
    if (b.isPaid) return 1;
    const d = daysUntil(b.dueDate, today);
    if (d < 0) return 0;
    if (d <= 3) return 0.5;
    return 1;
  });
  const overdueBills = data.bills.filter((b) => !b.isPaid && daysUntil(b.dueDate, today) < 0).length;

  // Stock
  const low = data.stock.filter(isLowStock).length;
  const stockRatio = data.stock.length ? (data.stock.length - low) / data.stock.length : 1;

  // Maintenance: scheduled assets + open fix-ups that have a due date
  const maint: number[] = [];
  for (const a of data.assets) {
    const s = serviceStatus(a, today);
    if (s === 'none') continue;
    maint.push(s === 'overdue' ? 0 : s === 'due' ? 0.5 : 1);
  }
  for (const f of data.fixups) {
    if (f.status === 'done' || !f.dueDate) continue;
    const d = daysUntil(f.dueDate, today);
    maint.push(d < 0 ? 0 : d <= 7 ? 0.5 : 1);
  }

  // Consistency
  const streak = computeStreak(data.completions, today);

  const components: ScoreComponent[] = [
    {
      key: 'chores',
      label: 'Chores',
      weight: 30,
      ratio: choreRatio,
      points: 0,
      detail: `${done} done, ${pending} pending today`,
    },
    {
      key: 'bills',
      label: 'Bills',
      weight: 25,
      ratio: avg(billRatios),
      points: 0,
      detail: overdueBills ? `${overdueBills} overdue` : 'No overdue bills',
    },
    {
      key: 'stock',
      label: 'Stock',
      weight: 20,
      ratio: stockRatio,
      points: 0,
      detail: `${low} of ${data.stock.length} items low`,
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      weight: 15,
      ratio: avg(maint),
      points: 0,
      detail: `${maint.filter((m) => m < 1).length} items need attention`,
    },
    {
      key: 'consistency',
      label: 'Consistency',
      weight: 10,
      ratio: Math.min(streak, 7) / 7,
      points: 0,
      detail: `${streak}-day streak`,
    },
  ];
  for (const c of components) c.points = Math.round(c.ratio * c.weight * 10) / 10;

  const score = Math.round(components.reduce((a, c) => a + c.ratio * c.weight, 0));
  const label: HealthScore['label'] =
    score >= 85 ? 'Great!' : score >= 70 ? 'Good' : score >= 50 ? 'Needs attention' : 'Critical';
  const message =
    score >= 85
      ? 'Your home is doing great! Keep it up.'
      : score >= 70
        ? 'Your home is in good shape. A few things need a look.'
        : score >= 50
          ? 'Some things are slipping. Check the alerts below.'
          : 'Your home needs attention today.';

  return { score, label, message, components };
}
