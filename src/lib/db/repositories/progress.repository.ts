// src/lib/db/repositories/progress.repository.ts

import { nanoid } from 'nanoid';
import { getDatabase, writeDatabase } from '../index';
import type { 
  QuestionProgress, 
  ProgressId,
  QuestionId,
  SM2State,
  SM2Quality,
  ReviewRecord,
  RecordReviewInput,
  CategoryProgress,
  DueCards,
  QuestionCategory,
} from '@/types';
import { createProgressId, DEFAULT_SM2_STATE } from '@/types';
import { 
  calculateSM2, 
  getInitialSM2State, 
  getDueCards as getDueCardsFromSM2,
  getMasteryLevel 
} from '@/lib/algorithms/sm2';

/**
 * Progress Repository
 * Handles all SM-2 spaced repetition progress tracking
 */
export const progressRepository = {
  /**
   * Get all progress records
   */
  async findAll(): Promise<QuestionProgress[]> {
    const db = await getDatabase();
    return db.data.progress;
  },
  
  /**
   * Get progress for a specific question
   */
  async findByQuestionId(questionId: QuestionId): Promise<QuestionProgress | null> {
    const db = await getDatabase();
    return db.data.progress.find(p => p.questionId === questionId) ?? null;
  },
  
  /**
   * Get progress by ID
   */
  async findById(id: ProgressId): Promise<QuestionProgress | null> {
    const db = await getDatabase();
    return db.data.progress.find(p => p.id === id) ?? null;
  },
  
  /**
   * Get or create progress for a question
   * If progress doesn't exist, creates initial SM-2 state
   */
  async getOrCreate(questionId: QuestionId): Promise<QuestionProgress> {
    const existing = await this.findByQuestionId(questionId);
    if (existing) return existing;
    
    const db = await getDatabase();
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
    
    db.data.progress.push(progress);
    await writeDatabase(db);
    
    return progress;
  },
  
  /**
   * Record a review and update SM-2 state
   */
  async recordReview(input: RecordReviewInput): Promise<QuestionProgress> {
    const db = await getDatabase();
    
    // Get or create progress
    let progress = await this.getOrCreate(input.questionId);
    const progressIndex = db.data.progress.findIndex(p => p.id === progress.id);
    
    // Calculate new SM-2 state
    const { newState } = calculateSM2(progress.sm2, input.quality);
    
    // Create review record
    const review: ReviewRecord = {
      date: new Date().toISOString(),
      quality: input.quality,
      responseTimeMs: input.responseTimeMs,
      wasRevealed: input.wasRevealed,
    };
    
    // Update statistics
    const newTotalReviews = progress.totalReviews + 1;
    const isCorrect = input.quality >= 3;
    const newCorrectReviews = progress.correctReviews + (isCorrect ? 1 : 0);
    const newAverageQuality = (
      (progress.averageQuality * progress.totalReviews + input.quality) / 
      newTotalReviews
    );
    
    // Keep last 50 reviews in history
    const newHistory = [...progress.reviewHistory, review].slice(-50);
    
    // Update progress
    const updated: QuestionProgress = {
      ...progress,
      sm2: newState,
      totalReviews: newTotalReviews,
      correctReviews: newCorrectReviews,
      averageQuality: newAverageQuality,
      reviewHistory: newHistory,
      updatedAt: new Date().toISOString(),
    };
    
    db.data.progress[progressIndex] = updated;
    
    // Update study streak in metadata
    await this.updateStudyStreak(db);
    
    await writeDatabase(db);
    
    return updated;
  },
  
  /**
   * Update study streak based on today's activity
   */
  async updateStudyStreak(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const lastStudy = db.data.metadata.lastStudyDate;
    
    if (lastStudy === today) {
      // Already studied today, no change
      return;
    }
    
    if (lastStudy) {
      const lastDate = new Date(lastStudy);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        // Consecutive day - increment streak
        db.data.metadata.studyStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken - reset to 1
        db.data.metadata.studyStreak = 1;
      }
    } else {
      // First study ever
      db.data.metadata.studyStreak = 1;
    }
    
    db.data.metadata.lastStudyDate = today;
  },
  
  /**
   * Get cards due for review
   */
  async getDueCards(): Promise<DueCards> {
    const progress = await this.findAll();
    
    const records = progress.map(p => ({
      id: p.questionId,
      sm2: p.sm2,
    }));
    
    return getDueCardsFromSM2(records);
  },
  
  /**
   * Get progress statistics by category
   */
  async getCategoryProgress(
    questionsByCategory: Record<QuestionCategory, QuestionId[]>
  ): Promise<CategoryProgress[]> {
    const progress = await this.findAll();
    const progressByQuestion = new Map(progress.map(p => [p.questionId, p]));
    
    const result: CategoryProgress[] = [];
    
    for (const [category, questionIds] of Object.entries(questionsByCategory)) {
      let studiedCount = 0;
      let masteredCount = 0;
      let totalEaseFactor = 0;
      let dueCount = 0;
      
      for (const qId of questionIds) {
        const qProgress = progressByQuestion.get(qId as QuestionId);
        
        if (qProgress) {
          studiedCount++;
          totalEaseFactor += qProgress.sm2.easeFactor;
          
          if (getMasteryLevel(qProgress.sm2) === 'mastered') {
            masteredCount++;
          }
          
          const nextReview = new Date(qProgress.sm2.nextReviewDate);
          if (nextReview <= new Date()) {
            dueCount++;
          }
        }
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
  
  /**
   * Get overall progress dashboard data
   */
  async getDashboard(): Promise<{
    totalStudied: number;
    totalMastered: number;
    streakDays: number;
    lastStudyDate: string | null;
    dueCards: DueCards;
    recentReviews: ReviewRecord[];
  }> {
    const db = await getDatabase();
    const progress = await this.findAll();
    const dueCards = await this.getDueCards();
    
    let masteredCount = 0;
    const allReviews: Array<ReviewRecord & { questionId: QuestionId }> = [];
    
    for (const p of progress) {
      if (getMasteryLevel(p.sm2) === 'mastered') {
        masteredCount++;
      }
      
      for (const review of p.reviewHistory) {
        allReviews.push({ ...review, questionId: p.questionId });
      }
    }
    
    // Sort reviews by date descending and take last 20
    const recentReviews = allReviews
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
    
    return {
      totalStudied: progress.length,
      totalMastered: masteredCount,
      streakDays: db.data.metadata.studyStreak,
      lastStudyDate: db.data.metadata.lastStudyDate,
      dueCards,
      recentReviews,
    };
  },
  
  /**
   * Reset progress for a specific question
   */
  async reset(questionId: QuestionId): Promise<boolean> {
    const db = await getDatabase();
    const index = db.data.progress.findIndex(p => p.questionId === questionId);
    
    if (index === -1) return false;
    
    db.data.progress[index] = {
      ...db.data.progress[index],
      sm2: getInitialSM2State(),
      totalReviews: 0,
      correctReviews: 0,
      averageQuality: 0,
      reviewHistory: [],
      updatedAt: new Date().toISOString(),
    };
    
    await writeDatabase(db);
    return true;
  },
  
  /**
   * Delete all progress (for testing/reset)
   */
  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    db.data.progress = [];
    db.data.metadata.studyStreak = 0;
    db.data.metadata.lastStudyDate = null;
    await writeDatabase(db);
  },
};
