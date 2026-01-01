// src/types/progress.types.ts

import type { QuestionId, QuestionCategory } from './question.types';

/**
 * Branded types for SM-2 specific values
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type ProgressId = Brand<string, 'ProgressId'>;
export type EaseFactor = Brand<number, 'EaseFactor'>;

export const createProgressId = (id: string): ProgressId => id as ProgressId;
export const createEaseFactor = (factor: number): EaseFactor => factor as EaseFactor;

/**
 * SM-2 Quality ratings (0-5 scale)
 * These directly map to Anki's rating system
 */
export const SM2_QUALITY = {
  /** Complete blackout - no recall at all */
  COMPLETE_BLACKOUT: 0,
  /** Incorrect response, but upon seeing correct answer, remembered */
  INCORRECT_REMEMBERED: 1,
  /** Incorrect response, but correct answer seemed easy to recall */
  INCORRECT_EASY: 2,
  /** Correct response with serious difficulty */
  CORRECT_DIFFICULT: 3,
  /** Correct response after hesitation */
  CORRECT_HESITATION: 4,
  /** Perfect response with no hesitation */
  PERFECT: 5,
} as const;

export type SM2Quality = typeof SM2_QUALITY[keyof typeof SM2_QUALITY];

/**
 * Labels for quality ratings (used in UI)
 */
export const SM2_QUALITY_LABELS: Record<SM2Quality, string> = {
  [SM2_QUALITY.COMPLETE_BLACKOUT]: 'Again',
  [SM2_QUALITY.INCORRECT_REMEMBERED]: 'Hard',
  [SM2_QUALITY.INCORRECT_EASY]: 'Hard',
  [SM2_QUALITY.CORRECT_DIFFICULT]: 'Good',
  [SM2_QUALITY.CORRECT_HESITATION]: 'Good',
  [SM2_QUALITY.PERFECT]: 'Easy',
};

/**
 * Simplified quality buttons shown to user (Anki-style)
 */
export const QUALITY_BUTTONS = {
  AGAIN: 0,
  HARD: 2,
  GOOD: 4,
  EASY: 5,
} as const;

export type QualityButton = typeof QUALITY_BUTTONS[keyof typeof QUALITY_BUTTONS];

/**
 * SM-2 Algorithm state for a single question
 * This tracks the spaced repetition data per question
 */
export interface SM2State {
  /**
   * Easiness factor - starts at 2.5, minimum 1.3
   * Higher = easier card, longer intervals
   */
  easeFactor: EaseFactor;

  /**
   * Current interval in days
   * How many days until next review
   */
  interval: number;

  /**
   * Number of consecutive correct responses
   * Resets to 0 on incorrect response (quality < 3)
   */
  repetitions: number;

  /**
   * Next scheduled review date
   */
  nextReviewDate: string; // ISO date string

  /**
   * Last review date
   */
  lastReviewDate: string | null; // ISO date string
}

/**
 * Default SM-2 state for new cards
 */
export const DEFAULT_SM2_STATE: SM2State = {
  easeFactor: createEaseFactor(2.5),
  interval: 0,
  repetitions: 0,
  nextReviewDate: new Date().toISOString(),
  lastReviewDate: null,
};

/**
 * User progress record for a single question
 */
export interface QuestionProgress {
  id: ProgressId;
  questionId: QuestionId;

  /**
   * SM-2 algorithm state
   */
  sm2: SM2State;

  /**
   * Total number of reviews
   */
  totalReviews: number;

  /**
   * Number of correct reviews (quality >= 3)
   */
  correctReviews: number;

  /**
   * Average quality score across all reviews
   */
  averageQuality: number;

  /**
   * History of last N reviews for analytics
   */
  reviewHistory: ReviewRecord[];

  /**
   * Timestamps
   */
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual review record
 */
export interface ReviewRecord {
  date: string; // ISO date string
  quality: SM2Quality;
  responseTimeMs: number; // How long user took to respond
  wasRevealed: boolean; // Did user reveal answer before rating?
}

/**
 * Input for recording a new review
 */
export interface RecordReviewInput {
  questionId: QuestionId;
  quality: SM2Quality;
  responseTimeMs: number;
  wasRevealed: boolean;
}

/**
 * Result of SM-2 calculation after a review
 */
export interface SM2CalculationResult {
  newState: SM2State;
  previousState: SM2State;
  intervalChange: number; // days
  easeFactorChange: number;
}

/**
 * Study session statistics
 */
export interface StudySessionStats {
  totalCards: number;
  newCards: number;
  reviewCards: number;
  completedCards: number;
  correctCount: number;
  incorrectCount: number;
  averageResponseTimeMs: number;
  sessionDurationMs: number;
}

/**
 * Cards due for review, grouped by urgency
 */
export interface DueCards {
  /** Cards that are overdue */
  overdue: QuestionId[];
  /** Cards due today */
  dueToday: QuestionId[];
  /** New cards never studied */
  new: QuestionId[];
  /** Cards due in the future (for preview) */
  upcoming: QuestionId[];
}

/**
 * Category-level progress statistics
 */
export interface CategoryProgress {
  category: QuestionCategory;
  totalQuestions: number;
  studiedQuestions: number;
  masteredQuestions: number; // interval > 21 days
  averageEaseFactor: number;
  dueCount: number;
}

/**
 * Overall progress dashboard data
 */
export interface ProgressDashboard {
  totalQuestions: number;
  totalStudied: number;
  totalMastered: number;
  streakDays: number;
  lastStudyDate: string | null;
  categoryProgress: CategoryProgress[];
  dueCards: DueCards;
  recentActivity: ReviewRecord[];
}
