import { daysUntil, monthKey, relativeDue, shiftDays, todayISO } from '../lib/dates';
import { rupees, titleCase } from '../lib/format';
import type { Alert, HearthData, Severity } from '../types';
import { analyseFairness } from './fairness';
import { nextServiceDate, overdueChores } from './selectors';
import { computeStreak } from './streak';

/**
 * Smart Hearth — rule-based automation layer
 * ------------------------------------------
 * Each rule is a small pure function: (household data, today) → alerts.
 * Rules never change data themselves; they only *suggest*. Alerts carry an
 * optional one-tap action that the UI can perform (e.g. add to shopping list).
 *
 * Adding a new rule = write one function and add it to `RULES` below.
 */

export type Rule = {
  id: string;
  name: string;
  description: string;
  run: (data: HearthData, today: string) => Alert[];
};

const billOverdue: Rule = {
  id: 'bill-overdue',
  name: 'Overdue bills',
  description: 'Unpaid bills whose due date has passed.',
  run: (d, today) =>
    d.bills
      .filter((b) => !b.isPaid && daysUntil(b.dueDate, today) < 0)
      .map((b) => ({
        id: `bill-overdue:${b.id}:${b.dueDate}`,
        rule: 'bill-overdue',
        severity: 'critical' as Severity,
        module: 'bills',
        title: `${b.name} is overdue`,
        message: `${rupees(b.amount)} was due ${relativeDue(b.dueDate, today).toLowerCase()}. Pay it to avoid late fees.`,
        route: '/bills',
        action: { label: 'Mark paid', kind: 'markBillPaid', entityId: b.id },
      })),
};

const billDueSoon: Rule = {
  id: 'bill-due-soon',
  name: 'Upcoming bills',
  description: 'Unpaid bills due within the next 3 days.',
  run: (d, today) =>
    d.bills
      .filter((b) => {
        const n = daysUntil(b.dueDate, today);
        return !b.isPaid && n >= 0 && n <= 3;
      })
      .map((b) => ({
        id: `bill-due:${b.id}:${b.dueDate}`,
        rule: 'bill-due-soon',
        severity: 'warning' as Severity,
        module: 'bills',
        title: `${b.name} due ${relativeDue(b.dueDate, today).toLowerCase()}`,
        message: `${rupees(b.amount)}${b.autopay ? ' — autopay is on.' : ' is still unpaid.'}`,
        route: '/bills',
        action: { label: 'Mark paid', kind: 'markBillPaid', entityId: b.id },
      })),
};

const lowStock: Rule = {
  id: 'low-stock',
  name: 'Low stock',
  description: 'Items at or below their low-stock threshold. Suggests adding them to the shopping list.',
  run: (d) =>
    d.stock
      .filter((s) => s.quantity <= s.threshold)
      .map((s) => {
        const listed = d.shopping.some((i) => !i.done && i.stockItemId === s.id);
        const out = s.quantity <= 0;
        return {
          id: `low-stock:${s.id}:${listed ? 'listed' : 'new'}`,
          rule: 'low-stock',
          severity: (out ? 'critical' : listed ? 'info' : 'warning') as Severity,
          module: 'stock',
          title: out ? `Out of ${s.name}` : `${s.name} is running low`,
          message: listed
            ? `Only ${s.quantity} ${s.unit} left — already on the shopping list.`
            : `Only ${s.quantity} ${s.unit} left. Add it to the shopping list?`,
          route: '/stock',
          action: listed ? undefined : { label: 'Add to list', kind: 'addToShopping', entityId: s.id },
        } satisfies Alert;
      }),
};

const expiry: Rule = {
  id: 'expiry',
  name: 'Expiry tracking',
  description: 'Items that have expired or expire within 5 days.',
  run: (d, today) =>
    d.stock
      .filter((s) => s.expiryDate && daysUntil(s.expiryDate, today) <= 5)
      .map((s) => {
        const n = daysUntil(s.expiryDate!, today);
        return {
          id: `expiry:${s.id}:${s.expiryDate}`,
          rule: 'expiry',
          severity: (n < 0 ? 'critical' : 'warning') as Severity,
          module: 'stock',
          title: n < 0 ? `${s.name} has expired` : `${s.name} expires ${relativeDue(s.expiryDate!, today).toLowerCase()}`,
          message: n < 0 ? 'Discard it and restock if needed.' : 'Use it soon or plan a meal around it.',
          route: '/stock',
        } satisfies Alert;
      }),
};

const maintenanceDue: Rule = {
  id: 'maintenance-due',
  name: 'Maintenance reminders',
  description: 'Appliances whose service interval is due within 7 days or overdue.',
  run: (d, today) =>
    d.assets.flatMap((a) => {
      const next = nextServiceDate(a);
      if (!next) return [];
      const n = daysUntil(next, today);
      if (n > 7) return [];
      return [
        {
          id: `maintenance:${a.id}:${next}`,
          rule: 'maintenance-due',
          severity: (n < 0 ? 'warning' : 'info') as Severity,
          module: 'fixups',
          title: `${a.name} service ${n < 0 ? 'overdue' : 'due ' + relativeDue(next, today).toLowerCase()}`,
          message: `Recommended every ${a.serviceIntervalDays} days. Book a service or log it once done.`,
          route: '/fixups',
          action: { label: 'Log service', kind: 'logService', entityId: a.id },
        } satisfies Alert,
      ];
    }),
};

const warranty: Rule = {
  id: 'warranty',
  name: 'Warranty expiry',
  description: 'Warranties ending within 30 days — a good time to get issues checked for free.',
  run: (d, today) =>
    d.assets
      .filter((a) => a.warrantyUntil && daysUntil(a.warrantyUntil, today) >= 0 && daysUntil(a.warrantyUntil, today) <= 30)
      .map((a) => ({
        id: `warranty:${a.id}:${a.warrantyUntil}`,
        rule: 'warranty',
        severity: 'info' as Severity,
        module: 'fixups',
        title: `${a.name} warranty ends ${relativeDue(a.warrantyUntil!, today).toLowerCase()}`,
        message: 'Get any issues checked while it is still covered.',
        route: '/fixups',
      })),
};

const choreOverdue: Rule = {
  id: 'chore-overdue',
  name: 'Overdue chores',
  description: 'Chores that were due on an earlier day and are still pending.',
  run: (d, today) =>
    overdueChores(d.chores, today).map((c) => {
      const who = d.members.find((m) => m.id === c.assigneeId)?.name ?? 'Unassigned';
      return {
        id: `chore-overdue:${c.id}:${c.dueDate}`,
        rule: 'chore-overdue',
        severity: 'warning' as Severity,
        module: 'chores',
        title: `${c.title} is overdue`,
        message: `Assigned to ${who}, ${relativeDue(c.dueDate, today).toLowerCase()}.`,
        route: '/chores',
      } satisfies Alert;
    }),
};

const fairness: Rule = {
  id: 'fairness',
  name: 'Fair share',
  description: 'Flags when one person has done much more than an equal share of chore effort in 30 days.',
  run: (d, today) => {
    const f = analyseFairness(d.members, d.completions, today);
    if (!f.overloaded) return [];
    const helper = f.underloaded ?? [...f.loads].sort((a, b) => a.effort - b.effort)[0];
    return [
      {
        id: `fairness:${f.overloaded.memberId}:${monthKey(today)}`,
        rule: 'fairness',
        severity: 'tip',
        module: 'chores',
        title: `${f.overloaded.name} is carrying ${Math.round(f.overloaded.share * 100)}% of chores`,
        message: helper
          ? `Consider moving a recurring chore to ${helper.name} to balance the load.`
          : 'Consider sharing a recurring chore to balance the load.',
        route: '/insights',
      },
    ];
  },
};

const spendingSpike: Rule = {
  id: 'spending-spike',
  name: 'Spending spike',
  description: 'A spending category this month is over 130% of last month.',
  run: (d, today) => {
    const thisMonth = monthKey(today);
    const lastMonth = monthKey(shiftDays(`${thisMonth}-01`, -1));
    const totals = (m: string) => {
      const t: Record<string, number> = {};
      for (const e of d.expenses) if (e.date.startsWith(m)) t[e.category] = (t[e.category] ?? 0) + e.amount;
      return t;
    };
    const now = totals(thisMonth);
    const prev = totals(lastMonth);
    return Object.entries(now)
      .filter(([cat, amt]) => (prev[cat] ?? 0) > 0 && amt > prev[cat]! * 1.3)
      .map(([cat, amt]) => ({
        id: `spend:${cat}:${thisMonth}`,
        rule: 'spending-spike',
        severity: 'info' as Severity,
        module: 'bills',
        title: `${titleCase(cat)} spending is up ${Math.round((amt / prev[cat]! - 1) * 100)}%`,
        message: `${rupees(amt)} this month vs ${rupees(prev[cat]!)} last month.`,
        route: '/insights',
      }));
  },
};

const staleRepair: Rule = {
  id: 'stale-repair',
  name: 'Pending repairs',
  description: 'Repairs that have been open for more than 7 days.',
  run: (d, today) =>
    d.fixups
      .filter((f) => f.kind === 'repair' && f.status === 'open' && daysUntil(f.createdAt.slice(0, 10), today) < -7)
      .map((f) => ({
        id: `stale-repair:${f.id}`,
        rule: 'stale-repair',
        severity: 'info' as Severity,
        module: 'fixups',
        title: `${f.title} has been pending a while`,
        message: 'Schedule a plumber/technician or assign it to someone.',
        route: '/fixups',
      })),
};

const streakAtRisk: Rule = {
  id: 'streak',
  name: 'Streak keeper',
  description: 'Reminds the household to complete a chore today to keep the streak alive.',
  run: (d, today) => {
    const doneToday = d.completions.some((c) => c.date === today);
    const streak = computeStreak(d.completions, today);
    if (doneToday || streak === 0) return [];
    return [
      {
        id: `streak:${today}`,
        rule: 'streak',
        severity: 'tip',
        module: 'chores',
        title: `Keep your ${streak}-day streak going`,
        message: 'Finish any one chore today to keep the streak alive.',
        route: '/chores',
      },
    ];
  },
};

export const RULES: Rule[] = [
  billOverdue,
  billDueSoon,
  lowStock,
  expiry,
  maintenanceDue,
  warranty,
  choreOverdue,
  fairness,
  spendingSpike,
  staleRepair,
  streakAtRisk,
];

const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2, tip: 3 };

/** Run every rule and return undismissed alerts, most severe first. */
export function runSmartHearth(data: HearthData, today: string = todayISO()): Alert[] {
  const dismissed = new Set(data.dismissedAlerts);
  return RULES.flatMap((r) => r.run(data, today))
    .filter((a) => !dismissed.has(a.id))
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
