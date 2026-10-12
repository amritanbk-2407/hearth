import { shiftDays } from '../lib/dates';
import type { ChoreCompletion, Member } from '../types';

export interface MemberLoad {
  memberId: string;
  name: string;
  effort: number; // effort points completed in the window
  count: number; // chores completed in the window
  share: number; // 0..1 of all effort
}

export interface FairnessResult {
  loads: MemberLoad[];
  /**
   * Jain's fairness index: (Σx)² / (n · Σx²).
   * 1.0 = perfectly equal workload, 1/n = one person does everything.
   */
  index: number;
  label: 'Balanced' | 'Slightly uneven' | 'Uneven';
  overloaded?: MemberLoad;
  underloaded?: MemberLoad;
}

/** Members who are expected to share chores (helpers are paid staff and excluded). */
export const choreSharingMembers = (members: Member[]) =>
  members.filter((m) => m.role !== 'helper');

export function jainIndex(values: number[]): number {
  const n = values.length;
  if (n === 0) return 1;
  const sum = values.reduce((a, b) => a + b, 0);
  const sumSq = values.reduce((a, b) => a + b * b, 0);
  if (sumSq === 0) return 1;
  return (sum * sum) / (n * sumSq);
}

export function analyseFairness(
  members: Member[],
  completions: ChoreCompletion[],
  today: string,
  windowDays = 30,
): FairnessResult {
  const from = shiftDays(today, -(windowDays - 1));
  const people = choreSharingMembers(members);
  const recent = completions.filter((c) => c.date >= from && c.date <= today);
  const total = recent
    .filter((c) => people.some((p) => p.id === c.memberId))
    .reduce((a, c) => a + c.effort, 0);

  const loads: MemberLoad[] = people.map((m) => {
    const mine = recent.filter((c) => c.memberId === m.id);
    const effort = mine.reduce((a, c) => a + c.effort, 0);
    return {
      memberId: m.id,
      name: m.name,
      effort,
      count: mine.length,
      share: total ? effort / total : 0,
    };
  });

  const index = jainIndex(loads.map((l) => l.effort));
  const label = index >= 0.9 ? 'Balanced' : index >= 0.75 ? 'Slightly uneven' : 'Uneven';
  const sorted = [...loads].sort((a, b) => b.effort - a.effort);
  const equal = loads.length ? 1 / loads.length : 0;
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  return {
    loads,
    index: Math.round(index * 100) / 100,
    label,
    overloaded: top && loads.length > 1 && top.share > equal * 1.5 ? top : undefined,
    underloaded: bottom && loads.length > 1 && bottom.share < equal * 0.5 ? bottom : undefined,
  };
}
