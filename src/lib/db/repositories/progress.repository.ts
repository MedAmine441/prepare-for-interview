// src/lib/db/repositories/progress.repository.ts

import { nanoid } from 'nanoid';
import { getDb, getMeta, setMeta, transaction } from '../index';
import type {
  QuestionProgress,
  ProgressId,
  QuestionId,
  SM2State,
  ReviewRecord,
  RecordReviewInput,
  CategoryProgress,
  DueCards,
  QuestionCategory,
} from '@/types';
import { createProgressId, createQuestionId, createEaseFactor } from '@/types';
import {
  calculateSM2,
  getInitialSM2State,
  getDueCards as getDueCardsFromSM2,
  getMasteryLevel,
} from '@/lib/algorithms/sm2';

interface ProgressRow {
  id: string;
  question_id: string;
  ease_factor: number;
  sm2_interval: number;
  repetitions: number;
  next_review_date: string;
  last_review_date: string | null;
  total_reviews: number;
  correct_reviews: number;
  average_quality: number;
  review_history: string;
  created_at: string;
  updated_at: string;
}

function rowToProgress(row: ProgressRow): QuestionProgress {
  return {
    id: createProgressId(row.id),
    questionId: createQuestionId(row.question_id),
    sm2: {
      easeFactor: createEaseFactor(row.ease_factor),
      interval: row.sm2_interval,
      repetitions: row.repetitions,
      nextReviewDate: row.next_review_date,
      lastReviewDate: row.last_review_date,
    },
    totalReviews: row.total_reviews,
    correctReviews: row.correct_reviews,
    averageQuality: row.average_quality,
    reviewHistory: JSON.parse(row.review_history),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function writeProgress(progress: QuestionProgress): void {
  getDb()
    .prepare(
      `INSERT INTO progress
         (id, question_id, ease_factor, sm2_interval, repetitions,
          next_review_date, last_review_date, total_reviews, correct_reviews,
          average_quality, review_history, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(question_id) DO UPDATE SET
         ease_factor = excluded.ease_factor,
         sm2_interval = excluded.sm2_interval,
         repetitions = excluded.repetitions,
         next_review_date = excluded.next_review_date,
         last_review_date = excluded.last_review_date,
         total_reviews = excluded.total_reviews,
         correct_reviews = excluded.correct_reviews,
         average_quality = excluded.average_quality,
         review_history = excluded.review_history,
         updated_at = excluded.updated_at`,
    )
    .run(
      progress.id,
      progress.questionId,
      progress.sm2.easeFactor,
      progress.sm2.interval,
      progress.sm2.repetitions,
      progress.sm2.nextReviewDate,
      progress.sm2.lastReviewDate,
      progress.totalReviews,
      progress.correctReviews,
      progress.averageQuality,
      JSON.stringify(progress.reviewHistory),
      progress.createdAt,
      progress.updatedAt,
    );
}

/**
 * Progress Repository — SQLite-backed SM-2 spaced repetition tracking.
 */
export const progressRepository = {
  async findAll(): Promise<QuestionProgress[]> {
    const rows = getDb().prepare('SELECT * FROM progress').all() as unknown as ProgressRow[];
    return rows.map(rowToProgress);
  },

  async findByQuestionId(questionId: QuestionId): Promise<QuestionProgress | null> {
    const row = getDb()
      .prepare('SELECT * FROM progress WHERE question_id = ?')
      .get(questionId) as unknown as ProgressRow | undefined;
    return row ? rowToProgress(row) : null;
  },

  async findById(id: ProgressId): Promise<QuestionProgress | null> {
    const row = getDb()
      .prepare('SELECT * FROM progress WHERE id = ?')
      .get(id) as unknown as ProgressRow | undefined;
    return row ? rowToProgress(row) : null;
  },

  async getOrCreate(questionId: QuestionId): Promise<QuestionProgress> {
    const existing = await this.findByQuestionId(questionId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const progress: QuestionProgress = {
      id: createProgressId(nanoid()),
      questionId,
      sm2: getInitialSM2State(),
      totalReviews: 0,
      correctReviews: 0,
      averageQuality: 0,
      reviewHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    writeProgress(progress);
    return progress;
  },

  async recordReview(input: RecordReviewInput): Promise<QuestionProgress> {
    const progress = await this.getOrCreate(input.questionId);

    const { newState } = calculateSM2(progress.sm2, input.quality);

    const review: ReviewRecord = {
      date: new Date().toISOString(),
      quality: input.quality,
      responseTimeMs: input.responseTimeMs,
      wasRevealed: input.wasRevealed,
    };

    const newTotalReviews = progress.totalReviews + 1;
    const isCorrect = input.quality >= 3;
    const updated: QuestionProgress = {
      ...progress,
      sm2: newState,
      totalReviews: newTotalReviews,
      correctReviews: progress.correctReviews + (isCorrect ? 1 : 0),
      averageQuality:
        (progress.averageQuality * progress.totalReviews + input.quality) /
        newTotalReviews,
      // Keep last 50 reviews in history
      reviewHistory: [...progress.reviewHistory, review].slice(-50),
      updatedAt: new Date().toISOString(),
    };

    transaction(() => {
      writeProgress(updated);
      this.updateStudyStreakSync();
    });

    return updated;
  },

  /**
   * Update the study streak based on today's activity.
   * Synchronous — called inside the recordReview transaction.
   */
  updateStudyStreakSync(): void {
    const today = new Date().toISOString().split('T')[0];
    const lastStudy = getMeta<string | null>('lastStudyDate', null);

    if (lastStudy === today) return;

    let streak = getMeta<number>('studyStreak', 0);
    if (lastStudy) {
      const diffDays = Math.floor(
        (new Date(today).getTime() - new Date(lastStudy).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      streak = diffDays === 1 ? streak + 1 : 1;
    } else {
      streak = 1;
    }

    setMeta('studyStreak', streak);
    setMeta('lastStudyDate', today);
  },

  async getDueCards(): Promise<DueCards> {
    const progress = await this.findAll();
    return getDueCardsFromSM2(progress.map((p) => ({ id: p.questionId, sm2: p.sm2 })));
  },

  async getCategoryProgress(
    questionsByCategory: Record<QuestionCategory, QuestionId[]>,
  ): Promise<CategoryProgress[]> {
    const progress = await this.findAll();
    const progressByQuestion = new Map(progress.map((p) => [p.questionId, p]));

    const result: CategoryProgress[] = [];

    for (const [category, questionIds] of Object.entries(questionsByCategory)) {
      let studiedCount = 0;
      let masteredCount = 0;
      let totalEaseFactor = 0;
      let dueCount = 0;

      for (const qId of questionIds) {
        const qProgress = progressByQuestion.get(qId as QuestionId);
        if (!qProgress) continue;

        studiedCount++;
        totalEaseFactor += qProgress.sm2.easeFactor;
        if (getMasteryLevel(qProgress.sm2) === 'mastered') masteredCount++;
        if (new Date(qProgress.sm2.nextReviewDate) <= new Date()) dueCount++;
      }

      result.push({
        category: category as QuestionCategory,
        totalQuestions: questionIds.length,
        studiedQuestions: studiedCount,
        masteredQuestions: masteredCount,
        averageEaseFactor: studiedCount > 0 ? totalEaseFactor / studiedCount : 2.5,
        dueCount,
      });
    }

    return result;
  },

  async getDashboard(): Promise<{
    totalStudied: number;
    totalMastered: number;
    streakDays: number;
    lastStudyDate: string | null;
    dueCards: DueCards;
    recentReviews: ReviewRecord[];
  }> {
    const progress = await this.findAll();
    const dueCards = await this.getDueCards();

    let masteredCount = 0;
    const allReviews: ReviewRecord[] = [];

    for (const p of progress) {
      if (getMasteryLevel(p.sm2) === 'mastered') masteredCount++;
      allReviews.push(...p.reviewHistory);
    }

    const recentReviews = allReviews
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    return {
      totalStudied: progress.length,
      totalMastered: masteredCount,
      streakDays: getMeta<number>('studyStreak', 0),
      lastStudyDate: getMeta<string | null>('lastStudyDate', null),
      dueCards,
      recentReviews,
    };
  },

  async reset(questionId: QuestionId): Promise<boolean> {
    const existing = await this.findByQuestionId(questionId);
    if (!existing) return false;

    writeProgress({
      ...existing,
      sm2: getInitialSM2State(),
      totalReviews: 0,
      correctReviews: 0,
      averageQuality: 0,
      reviewHistory: [],
      updatedAt: new Date().toISOString(),
    });
    return true;
  },

  async deleteAll(): Promise<void> {
    transaction(() => {
      getDb().exec('DELETE FROM progress');
      setMeta('studyStreak', 0);
      setMeta('lastStudyDate', null);
    });
  },
};
