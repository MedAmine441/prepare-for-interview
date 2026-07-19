// src/lib/utils/pacing.ts

/**
 * Study pacing — shared by the home-page countdown and the review queue,
 * so the plan the countdown shows is the plan the queue enforces.
 */

/** Daily new-card budget when no interview date is set (Anki-ish default) */
export const DEFAULT_DAILY_NEW_LIMIT = 10;

/** Whole days from today (local midnight) to a YYYY-MM-DD date */
export function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export interface StudyPace {
  /** Days kept free of new cards right before the interview */
  reviewBuffer: number;
  /** Days available for introducing new cards */
  studyDays: number;
  /** New cards per day to clear the unseen pile in time */
  newPerDay: number;
}

/** Clear the unseen backlog while leaving a few days pure-review */
export function computeStudyPace(daysLeft: number, unseenCount: number): StudyPace {
  const reviewBuffer = daysLeft >= 10 ? 4 : daysLeft >= 5 ? 2 : 1;
  const studyDays = Math.max(1, daysLeft - reviewBuffer);
  return {
    reviewBuffer,
    studyDays,
    newPerDay: Math.ceil(unseenCount / studyDays),
  };
}

/**
 * Today's new-card budget. With an upcoming interview the budget follows
 * the countdown's pace (0 on interview day — pure review); without one it
 * falls back to the default.
 */
export function dailyNewLimit(
  interviewDate: string | null,
  unseenCount: number,
): number {
  if (!interviewDate) return DEFAULT_DAILY_NEW_LIMIT;
  const daysLeft = daysUntil(interviewDate);
  if (daysLeft < 0) return DEFAULT_DAILY_NEW_LIMIT;
  if (daysLeft === 0) return 0;
  return computeStudyPace(daysLeft, unseenCount).newPerDay;
}
