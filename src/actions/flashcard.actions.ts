// src/actions/flashcard.actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { questionRepository, progressRepository } from "@/lib/db/repositories";
import {
  calculateSM2,
  getIntervalPreviews,
  formatInterval,
} from "@/lib/algorithms/sm2";
import type {
  Question,
  QuestionId,
  QuestionProgress,
  SM2Quality,
  QuestionCategory,
  Difficulty,
  DueCards,
} from "@/types";
import { createQuestionId, SM2_QUALITY } from "@/types";

/**
 * Input validation schemas
 */
const AnswerFlashcardSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  quality: z.number().min(0).max(5),
  responseTimeMs: z.number().min(0),
  wasRevealed: z.boolean(),
});

const StartSessionSchema = z.object({
  category: z.string().optional(),
  newCardsLimit: z.number().min(0).max(50).default(10),
  reviewCardsLimit: z.number().min(0).max(100).default(50),
});

/**
 * Action result types
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get the next card for study
 * Prioritizes: overdue > due today > new cards
 */
export async function getNextStudyCard(
  category?: QuestionCategory,
  difficulty?: Difficulty,
): Promise<
  ActionResult<{
    question: Question;
    progress: QuestionProgress;
    intervalPreviews: Record<SM2Quality, string>;
    isNew: boolean;
  } | null>
> {
  try {
    // Get all questions for the category and difficulty
    const questions = await questionRepository.findAll({
      categories: category ? [category] : undefined,
      difficulties: difficulty ? [difficulty] : undefined,
    });

    if (questions.length === 0) {
      return { success: true, data: null };
    }

    // Get due cards
    const dueCards = await progressRepository.getDueCards();
    const questionIds = new Set(questions.map((q) => q.id));

    // Filter due cards to only include questions from our filters
    const overdueInCategory = dueCards.overdue.filter((id) =>
      questionIds.has(id),
    );
    const dueTodayInCategory = dueCards.dueToday.filter((id) =>
      questionIds.has(id),
    );

    // Find new cards (questions without progress)
    const studiedIds = new Set([
      ...dueCards.overdue,
      ...dueCards.dueToday,
      ...dueCards.upcoming,
    ]);
    const newCards = questions.filter((q) => !studiedIds.has(q.id));

    // Priority: overdue > due today > new
    let nextQuestionId: QuestionId | null = null;
    let isNew = false;

    if (overdueInCategory.length > 0) {
      nextQuestionId = overdueInCategory[0] as QuestionId;
    } else if (dueTodayInCategory.length > 0) {
      nextQuestionId = dueTodayInCategory[0] as QuestionId;
    } else if (newCards.length > 0) {
      nextQuestionId = newCards[0].id;
      isNew = true;
    }

    if (!nextQuestionId) {
      return { success: true, data: null };
    }

    // Get the question and progress
    const question = await questionRepository.findById(nextQuestionId);
    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const progress = await progressRepository.getOrCreate(nextQuestionId);
    const intervalPreviews = getIntervalPreviews(progress.sm2);

    return {
      success: true,
      data: { question, progress, intervalPreviews, isNew },
    };
  } catch (error) {
    console.error("Error getting next study card:", error);
    return { success: false, error: "Failed to get next card" };
  }
}

/**
 * Submit an answer for a flashcard
 */
export async function answerFlashcard(formData: FormData): Promise<
  ActionResult<{
    updatedProgress: QuestionProgress;
    nextReviewIn: string;
  }>
> {
  try {
    // Parse and validate input
    const rawInput = {
      questionId: formData.get("questionId"),
      quality: Number(formData.get("quality")),
      responseTimeMs: Number(formData.get("responseTimeMs")),
      wasRevealed: formData.get("wasRevealed") === "true",
    };

    const validationResult = AnswerFlashcardSchema.safeParse(rawInput);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return { success: false, error: errors };
    }

    const input = validationResult.data;

    // Record the review
    const updatedProgress = await progressRepository.recordReview({
      questionId: createQuestionId(input.questionId),
      quality: input.quality as SM2Quality,
      responseTimeMs: input.responseTimeMs,
      wasRevealed: input.wasRevealed,
    });

    const nextReviewIn = formatInterval(updatedProgress.sm2.interval);

    // Revalidate relevant paths
    revalidatePath("/flashcards");
    revalidatePath("/");

    return {
      success: true,
      data: { updatedProgress, nextReviewIn },
    };
  } catch (error) {
    console.error("Error answering flashcard:", error);
    return { success: false, error: "Failed to record answer" };
  }
}

/**
 * Get study session statistics
 */
export async function getStudySessionStats(
  category?: QuestionCategory,
  difficulty?: Difficulty,
): Promise<
  ActionResult<{
    dueCards: DueCards;
    totalCards: number;
    newCardsCount: number;
    reviewCardsCount: number;
    masteredCount: number;
  }>
> {
  try {
    const questions = await questionRepository.findAll({
      categories: category ? [category] : undefined,
      difficulties: difficulty ? [difficulty] : undefined,
    });

    const dueCards = await progressRepository.getDueCards();
    const questionIds = new Set(questions.map((q) => q.id));

    // Filter to category/difficulty
    const filteredDue: DueCards = {
      overdue: dueCards.overdue.filter((id) => questionIds.has(id)),
      dueToday: dueCards.dueToday.filter((id) => questionIds.has(id)),
      new: dueCards.new.filter((id) => questionIds.has(id)),
      upcoming: dueCards.upcoming.filter((id) => questionIds.has(id)),
    };

    // Count new cards (questions without any progress)
    const allProgressIds = new Set([
      ...filteredDue.overdue,
      ...filteredDue.dueToday,
      ...filteredDue.upcoming,
    ]);
    const newCardsCount = questions.filter(
      (q) => !allProgressIds.has(q.id),
    ).length;

    return {
      success: true,
      data: {
        dueCards: filteredDue,
        totalCards: questions.length,
        newCardsCount,
        reviewCardsCount:
          filteredDue.overdue.length + filteredDue.dueToday.length,
        masteredCount: filteredDue.upcoming.length,
      },
    };
  } catch (error) {
    console.error("Error getting study stats:", error);
    return { success: false, error: "Failed to get statistics" };
  }
}

/**
 * Reset progress for a specific question
 */
export async function resetQuestionProgress(
  questionId: string,
): Promise<ActionResult<void>> {
  try {
    const success = await progressRepository.reset(
      createQuestionId(questionId),
    );

    if (!success) {
      return { success: false, error: "Progress not found" };
    }

    revalidatePath("/flashcards");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error resetting progress:", error);
    return { success: false, error: "Failed to reset progress" };
  }
}

/**
 * Get progress dashboard data
 */
export async function getProgressDashboard(): Promise<
  ActionResult<{
    totalStudied: number;
    totalMastered: number;
    streakDays: number;
    lastStudyDate: string | null;
    dueCards: DueCards;
    categoryStats: Array<{
      category: QuestionCategory;
      total: number;
      studied: number;
      due: number;
    }>;
  }>
> {
  try {
    const dashboard = await progressRepository.getDashboard();
    const questionStats = await questionRepository.getStats();

    // Build category stats
    const categoryStats = Object.entries(questionStats.byCategory).map(
      ([category, total]) => ({
        category: category as QuestionCategory,
        total,
        studied: 0, // Will be calculated from progress
        due: 0,
      }),
    );

    return {
      success: true,
      data: {
        ...dashboard,
        categoryStats,
      },
    };
  } catch (error) {
    console.error("Error getting dashboard:", error);
    return { success: false, error: "Failed to get dashboard data" };
  }
}
