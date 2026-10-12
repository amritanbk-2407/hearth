import { describe, expect, it } from 'vitest';
import { buildDemoData, emptyData } from '../data/seed';
import { nextOccurrence, shiftDays } from '../lib/dates';
import type { ChoreCompletion, HearthData, Member } from '../types';
import { analyseFairness, jainIndex } from './fairness';
import { runSmartHearth } from './rules';
import { computeHealthScore } from './score';
import { computeStreak } from './streak';

const TODAY = '2026-10-12';
const comp = (date: string, memberId = 'a', effort = 1): ChoreCompletion => ({
  id: `${date}-${memberId}-${Math.random()}`,
  choreId: 'c',
  title: 'Chore',
  memberId,
  effort,
  date,
  forDueDate: date,
  at: `${date}T10:00:00`,
});
const member = (id: string, role: Member['role'] = 'member'): Member => ({ id, name: id.toUpperCase(), role, color: '#000', joinedAt: TODAY });
const base = (): HearthData => ({ ...emptyData(), household: { id: 'h', name: 'Test', inviteCode: 'X', createdAt: TODAY } });

describe('dates', () => {
  it('computes next occurrences', () => {
    expect(nextOccurrence('2026-10-12', 'daily')).toBe('2026-10-13');
    expect(nextOccurrence('2026-10-12', 'weekly')).toBe('2026-10-19');
    expect(nextOccurrence('2026-01-31', 'monthly')).toBe('2026-02-28');
    expect(nextOccurrence('2026-10-12', 'quarterly')).toBe('2027-01-12');
  });
});

describe('streak', () => {
  it('counts consecutive days including today', () => {
    const c = [comp(TODAY), comp(shiftDays(TODAY, -1)), comp(shiftDays(TODAY, -2)), comp(shiftDays(TODAY, -4))];
    expect(computeStreak(c, TODAY)).toBe(3);
  });
  it('does not break the streak before anything is done today', () => {
    const c = [comp(shiftDays(TODAY, -1)), comp(shiftDays(TODAY, -2))];
    expect(computeStreak(c, TODAY)).toBe(2);
  });
  it('is zero with no history', () => expect(computeStreak([], TODAY)).toBe(0));
});

describe('fairness', () => {
  it('Jain index is 1 for equal and 1/n for one-person load', () => {
    expect(jainIndex([5, 5, 5])).toBeCloseTo(1);
    expect(jainIndex([9, 0, 0])).toBeCloseTo(1 / 3);
  });
  it('flags an overloaded member and ignores helpers', () => {
    const members = [member('a'), member('b'), member('h', 'helper')];
    const c = [comp(TODAY, 'a', 5), comp(TODAY, 'a', 5), comp(TODAY, 'b', 1), comp(TODAY, 'h', 10)];
    const f = analyseFairness(members, c, TODAY);
    expect(f.loads).toHaveLength(2);
    expect(f.overloaded?.memberId).toBe('a');
    expect(f.label).not.toBe('Balanced');
  });
});

describe('house health score', () => {
  it('is 100 for an empty, well-kept home with a 7-day streak', () => {
    const d = base();
    d.completions = Array.from({ length: 7 }, (_, i) => comp(shiftDays(TODAY, -i)));
    expect(computeHealthScore(d, TODAY).score).toBe(100);
  });
  it('drops when a bill is overdue', () => {
    const d = base();
    d.completions = Array.from({ length: 7 }, (_, i) => comp(shiftDays(TODAY, -i)));
    d.bills = [{ id: 'b', name: 'Power', category: 'electricity', amount: 100, dueDate: shiftDays(TODAY, -1), recurrence: 'monthly', isPaid: false, createdAt: TODAY }];
    const h = computeHealthScore(d, TODAY);
    expect(h.score).toBe(75);
    expect(h.components.find((c) => c.key === 'bills')?.ratio).toBe(0);
  });
  it('weights add up to 100', () => {
    const h = computeHealthScore(buildDemoData(TODAY), TODAY);
    expect(h.components.reduce((a, c) => a + c.weight, 0)).toBe(100);
    expect(h.score).toBeGreaterThan(0);
    expect(h.score).toBeLessThanOrEqual(100);
  });
});

describe('Smart Hearth rules', () => {
  const demo = buildDemoData(TODAY);
  const alerts = runSmartHearth(demo, TODAY);
  const rules = new Set(alerts.map((a) => a.rule));

  it('detects the demo situations', () => {
    expect(rules.has('bill-overdue')).toBe(true);
    expect(rules.has('bill-due-soon')).toBe(true);
    expect(rules.has('low-stock')).toBe(true);
    expect(rules.has('maintenance-due')).toBe(true);
    expect(rules.has('chore-overdue')).toBe(true);
    expect(rules.has('warranty')).toBe(true);
  });
  it('sorts critical alerts first', () => {
    expect(alerts[0]!.severity).toBe('critical');
  });
  it('suggests adding unlisted low-stock items to the shopping list', () => {
    const det = alerts.find((a) => a.id.startsWith('low-stock:s-detergent'));
    expect(det?.action?.kind).toBe('addToShopping');
    const rice = alerts.find((a) => a.id.startsWith('low-stock:s-rice'));
    expect(rice?.action).toBeUndefined(); // already on the list
  });
  it('hides dismissed alerts', () => {
    const first = alerts[0]!;
    const after = runSmartHearth({ ...demo, dismissedAlerts: [first.id] }, TODAY);
    expect(after.find((a) => a.id === first.id)).toBeUndefined();
  });
});
