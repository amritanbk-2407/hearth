import { shiftDays } from '../lib/dates';
import type { ChoreCompletion } from '../types';

/**
 * Household streak = number of consecutive days on which the household
 * completed at least one chore.
 * Today counts if something is already done; otherwise counting starts from
 * yesterday so the streak is not "lost" first thing in the morning.
 */
export function computeStreak(completions: ChoreCompletion[], today: string): number {
  const days = new Set(completions.map((c) => c.date));
  let cursor = days.has(today) ? today : shiftDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }
  return streak;
}

export const completedToday = (completions: ChoreCompletion[], today: string) =>
  completions.filter((c) => c.date === today);
