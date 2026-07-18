// tests/progress.repository.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { getDb, getMeta, setMeta } from "@/lib/db";
import { progressRepository, questionRepository } from "@/lib/db/repositories";
import type { QuestionId } from "@/types";

async function makeQuestion(): Promise<QuestionId> {
  const q = await questionRepository.create({
    category: "js-fundamentals",
    difficulty: "mid",
    question: "What is the event loop?",
    answer: "## Event Loop\n\nThe runtime's task scheduling mechanism...",
    keyPoints: ["Call stack", "Task queues", "Microtasks before macrotasks"],
    followUpQuestions: [],
    relatedTopics: ["event-loop"],
    source: "seed",
  });
  return q.id;
}

beforeEach(() => {
  getDb().exec("DELETE FROM progress; DELETE FROM questions;");
  setMeta("studyStreak", 0);
  setMeta("lastStudyDate", null);
});

describe("getOrCreate", () => {
  test("creates a zero-review shell that is never counted as studied", async () => {
    const questionId = await makeQuestion();
    const progress = await progressRepository.getOrCreate(questionId);

    expect(progress.totalReviews).toBe(0);
    expect(progress.sm2.repetitions).toBe(0);
    expect(progress.reviewHistory).toEqual([]);
  });

  test("returns the existing record on subsequent calls", async () => {
    const questionId = await makeQuestion();
    const first = await progressRepository.getOrCreate(questionId);
    const second = await progressRepository.getOrCreate(questionId);
    expect(second.id).toBe(first.id);
  });
});

describe("recordReview", () => {
  test("a correct review updates SM-2 state and counters", async () => {
    const questionId = await makeQuestion();
    const updated = await progressRepository.recordReview({
      questionId,
      quality: 4,
      responseTimeMs: 3200,
      wasRevealed: true,
    });

    expect(updated.totalReviews).toBe(1);
    expect(updated.correctReviews).toBe(1);
    expect(updated.averageQuality).toBe(4);
    expect(updated.sm2.repetitions).toBe(1);
    expect(updated.sm2.interval).toBe(1);
    expect(updated.reviewHistory).toHaveLength(1);
    expect(updated.reviewHistory[0].quality).toBe(4);
  });

  test("a failed review resets repetitions but keeps the running average", async () => {
    const questionId = await makeQuestion();
    await progressRepository.recordReview({
      questionId,
      quality: 4,
      responseTimeMs: 1000,
      wasRevealed: true,
    });
    const updated = await progressRepository.recordReview({
      questionId,
      quality: 0,
      responseTimeMs: 1000,
      wasRevealed: true,
    });

    expect(updated.totalReviews).toBe(2);
    expect(updated.correctReviews).toBe(1);
    expect(updated.averageQuality).toBe(2);
    expect(updated.sm2.repetitions).toBe(0);
    expect(updated.sm2.interval).toBe(1);
  });

  test("review history is capped at the 50 most recent entries", async () => {
    const questionId = await makeQuestion();
    for (let i = 0; i < 55; i++) {
      await progressRepository.recordReview({
        questionId,
        quality: 4,
        responseTimeMs: i,
        wasRevealed: true,
      });
    }
    const progress = await progressRepository.findByQuestionId(questionId);
    expect(progress!.reviewHistory).toHaveLength(50);
    // Oldest entries were dropped: the first kept one is review #5 (0-indexed)
    expect(progress!.reviewHistory[0].responseTimeMs).toBe(5);
    expect(progress!.totalReviews).toBe(55);
  });

  test("updates the study streak once per day", async () => {
    const questionId = await makeQuestion();

    await progressRepository.recordReview({
      questionId,
      quality: 4,
      responseTimeMs: 1000,
      wasRevealed: true,
    });
    expect(getMeta("studyStreak", 0)).toBe(1);

    // Same-day reviews don't inflate the streak
    await progressRepository.recordReview({
      questionId,
      quality: 4,
      responseTimeMs: 1000,
      wasRevealed: true,
    });
    expect(getMeta("studyStreak", 0)).toBe(1);
  });

  test("continues the streak after a consecutive day, resets after a gap", async () => {
    const questionId = await makeQuestion();
    const today = new Date().toISOString().split("T")[0];

    // Simulate having studied yesterday
    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .split("T")[0];
    setMeta("studyStreak", 3);
    setMeta("lastStudyDate", yesterday);

    await progressRepository.recordReview({
      questionId,
      quality: 4,
      responseTimeMs: 1000,
      wasRevealed: true,
    });
    expect(getMeta("studyStreak", 0)).toBe(4);
    expect(getMeta("lastStudyDate", null)).toBe(today);

    // Simulate a 3-day gap: streak restarts at 1
    const lastWeek = new Date(Date.now() - 3 * 86_400_000)
      .toISOString()
      .split("T")[0];
    setMeta("studyStreak", 9);
    setMeta("lastStudyDate", lastWeek);

    await progressRepository.recordReview({
      questionId,
      quality: 4,
      responseTimeMs: 1000,
      wasRevealed: true,
    });
    expect(getMeta("studyStreak", 0)).toBe(1);
  });
});

describe("due cards and reset", () => {
  test("getDueCards classifies shells as new and past dates as overdue", async () => {
    const newId = await makeQuestion();
    const overdueId = await makeQuestion();

    await progressRepository.getOrCreate(newId);
    await progressRepository.recordReview({
      questionId: overdueId,
      quality: 4,
      responseTimeMs: 1000,
      wasRevealed: true,
    });
    // Push the reviewed card's due date into the past
    getDb()
      .prepare("UPDATE progress SET next_review_date = ? WHERE question_id = ?")
      .run(new Date(Date.now() - 2 * 86_400_000).toISOString(), overdueId);

    const due = await progressRepository.getDueCards();
    expect(due.new).toContain(newId);
    expect(due.overdue).toContain(overdueId);
  });

  test("reset wipes SM-2 state and counters but keeps the row", async () => {
    const questionId = await makeQuestion();
    await progressRepository.recordReview({
      questionId,
      quality: 5,
      responseTimeMs: 1000,
      wasRevealed: true,
    });

    expect(await progressRepository.reset(questionId)).toBe(true);
    const progress = await progressRepository.findByQuestionId(questionId);
    expect(progress!.totalReviews).toBe(0);
    expect(progress!.sm2.repetitions).toBe(0);
    expect(progress!.reviewHistory).toEqual([]);
  });

  test("reset returns false for a question that was never studied", async () => {
    const questionId = await makeQuestion();
    expect(await progressRepository.reset(questionId)).toBe(false);
  });

  test("deleteAll clears progress and streak metadata", async () => {
    const questionId = await makeQuestion();
    await progressRepository.recordReview({
      questionId,
      quality: 4,
      responseTimeMs: 1000,
      wasRevealed: true,
    });

    await progressRepository.deleteAll();
    expect(await progressRepository.findAll()).toEqual([]);
    expect(getMeta("studyStreak", -1)).toBe(0);
    expect(getMeta("lastStudyDate", "unset")).toBeNull();
  });
});
