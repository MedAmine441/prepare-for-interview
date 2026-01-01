// src/lib/algorithms/sm2.ts

import type { 
  SM2State, 
  SM2Quality, 
  SM2CalculationResult,
  EaseFactor 
} from '@/types';
import { DEFAULT_SM2_STATE, createEaseFactor } from '@/types';

/**
 * SM-2 Algorithm Implementation
 * 
 * The SuperMemo 2 (SM-2) algorithm calculates optimal review intervals
 * based on how well the user recalled the information.
 * 
 * Quality ratings (0-5):
 * - 0: Complete blackout
 * - 1: Incorrect response, but correct answer seemed easy to recall
 * - 2: Incorrect response, but correct answer seemed easy when shown
 * - 3: Correct response with serious difficulty
 * - 4: Correct response after hesitation  
 * - 5: Perfect response
 * 
 * @see https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

/** Minimum ease factor (prevents intervals from becoming too short) */
const MIN_EASE_FACTOR = 1.3;

/** Maximum ease factor (prevents intervals from becoming too long) */
const MAX_EASE_FACTOR = 3.0;

/** Default ease factor for new cards */
const DEFAULT_EASE_FACTOR = 2.5;

/** Minimum quality for a response to be considered "correct" */
const PASSING_QUALITY = 3;

/**
 * Calculate the new SM-2 state after a review
 * 
 * @param currentState - The current SM-2 state
 * @param quality - The quality of the response (0-5)
 * @returns The new SM-2 state and calculation details
 */
export function calculateSM2(
  currentState: SM2State,
  quality: SM2Quality
): SM2CalculationResult {
  const previousState = { ...currentState };
  
  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor = currentState.easeFactor + 
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Clamp ease factor to valid range
  newEaseFactor = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEaseFactor));
  
  let newInterval: number;
  let newRepetitions: number;
  
  if (quality < PASSING_QUALITY) {
    // Incorrect response - reset repetitions, short interval
    newRepetitions = 0;
    newInterval = 1; // Review tomorrow
  } else {
    // Correct response - calculate new interval
    newRepetitions = currentState.repetitions + 1;
    
    if (newRepetitions === 1) {
      // First correct response
      newInterval = 1;
    } else if (newRepetitions === 2) {
      // Second correct response
      newInterval = 6;
    } else {
      // Subsequent correct responses
      // I(n) = I(n-1) * EF
      newInterval = Math.round(currentState.interval * newEaseFactor);
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  const newState: SM2State = {
    easeFactor: createEaseFactor(newEaseFactor),
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewDate: new Date().toISOString(),
  };
  
  return {
    newState,
    previousState,
    intervalChange: newInterval - currentState.interval,
    easeFactorChange: newEaseFactor - currentState.easeFactor,
  };
}

/**
 * Get the initial SM-2 state for a new card
 */
export function getInitialSM2State(): SM2State {
  return {
    ...DEFAULT_SM2_STATE,
    easeFactor: createEaseFactor(DEFAULT_EASE_FACTOR),
    nextReviewDate: new Date().toISOString(),
  };
}

/**
 * Check if a card is due for review
 * 
 * @param state - The SM-2 state of the card
 * @returns true if the card should be reviewed
 */
export function isDue(state: SM2State): boolean {
  const now = new Date();
  const nextReview = new Date(state.nextReviewDate);
  return now >= nextReview;
}

/**
 * Get how overdue a card is (in days)
 * Negative value means the card is not yet due
 */
export function getOverdueDays(state: SM2State): number {
  const now = new Date();
  const nextReview = new Date(state.nextReviewDate);
  const diffMs = now.getTime() - nextReview.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate priority score for sorting cards
 * Higher score = more urgent to review
 */
export function calculatePriority(state: SM2State): number {
  const overdueDays = getOverdueDays(state);
  const easeFactorPenalty = (DEFAULT_EASE_FACTOR - state.easeFactor) * 10;
  
  if (overdueDays > 0) {
    // Overdue cards get high priority
    return 1000 + overdueDays + easeFactorPenalty;
  } else if (state.repetitions === 0) {
    // New cards get medium-high priority
    return 500 + easeFactorPenalty;
  } else {
    // Cards not yet due get low priority based on when they're due
    return Math.max(0, 100 + overdueDays);
  }
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days === 0) {
    return 'Now';
  } else if (days === 1) {
    return '1 day';
  } else if (days < 7) {
    return `${days} days`;
  } else if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.round(days / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  }
}

/**
 * Get preview intervals for each quality rating
 * Useful for showing users what will happen if they choose each rating
 */
export function getIntervalPreviews(
  currentState: SM2State
): Record<SM2Quality, string> {
  const previews: Record<number, string> = {};
  
  for (let quality = 0; quality <= 5; quality++) {
    const result = calculateSM2(currentState, quality as SM2Quality);
    previews[quality] = formatInterval(result.newState.interval);
  }
  
  return previews as Record<SM2Quality, string>;
}

/**
 * Determine mastery level based on SM-2 state
 */
export function getMasteryLevel(
  state: SM2State
): 'new' | 'learning' | 'reviewing' | 'mastered' {
  if (state.repetitions === 0) {
    return 'new';
  } else if (state.interval < 7) {
    return 'learning';
  } else if (state.interval < 30) {
    return 'reviewing';
  } else {
    return 'mastered';
  }
}

/**
 * Batch calculate due cards from a list of progress records
 */
export function getDueCards(
  progressRecords: Array<{ id: string; sm2: SM2State }>
): {
  overdue: string[];
  dueToday: string[];
  new: string[];
  upcoming: string[];
} {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  const result = {
    overdue: [] as string[],
    dueToday: [] as string[],
    new: [] as string[],
    upcoming: [] as string[],
  };
  
  for (const record of progressRecords) {
    const nextReview = new Date(record.sm2.nextReviewDate);
    
    if (record.sm2.repetitions === 0) {
      result.new.push(record.id);
    } else if (nextReview < now) {
      result.overdue.push(record.id);
    } else if (nextReview <= todayEnd) {
      result.dueToday.push(record.id);
    } else {
      result.upcoming.push(record.id);
    }
  }
  
  // Sort overdue by priority (most overdue first)
  result.overdue.sort((a, b) => {
    const aRecord = progressRecords.find(r => r.id === a)!;
    const bRecord = progressRecords.find(r => r.id === b)!;
    return calculatePriority(bRecord.sm2) - calculatePriority(aRecord.sm2);
  });
  
  return result;
}
