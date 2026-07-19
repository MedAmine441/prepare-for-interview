// src/lib/utils/interview-trends.ts

import type { InterviewSession, QuestionCategory } from "@/types";

/**
 * Cross-session aggregation of interview gap analyses: which categories
 * keep coming back weak, and which exact questions failed repeatedly.
 */

export interface CategoryTrend {
  category: QuestionCategory;
  /** Sessions in which at least one question of this category was judged */
  sessionsAppeared: number;
  /** Sessions with at least one weak verdict in this category */
  sessionsWeak: number;
  weakCount: number;
  okCount: number;
  strongCount: number;
}

export interface WeakSpotTrends {
  analyzedSessions: number;
  /** Categories that appeared, sorted by how often they come back weak */
  categories: CategoryTrend[];
  /** Question ids judged weak in 2+ different sessions */
  recurringWeak: Array<{ questionId: string; weakSessions: number }>;
  /** Union of all weak question ids, most recent session first */
  allWeakIds: string[];
}

export function computeWeakSpotTrends(
  sessions: InterviewSession[],
  categoryOf: (questionId: string) => QuestionCategory | null,
): WeakSpotTrends {
  const analyzed = sessions
    .filter((s) => s.analysis && s.analysis.verdicts.length > 0)
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

  const byCategory = new Map<
    QuestionCategory,
    CategoryTrend & { seenSessions: Set<string>; weakSessions: Set<string> }
  >();
  const weakSessionsByQuestion = new Map<string, Set<string>>();
  const allWeakIds: string[] = [];

  for (const session of analyzed) {
    for (const { questionId, verdict } of session.analysis!.verdicts) {
      if (verdict === "skipped") continue;
      const category = categoryOf(questionId as string);
      if (!category) continue;

      let entry = byCategory.get(category);
      if (!entry) {
        entry = {
          category,
          sessionsAppeared: 0,
          sessionsWeak: 0,
          weakCount: 0,
          okCount: 0,
          strongCount: 0,
          seenSessions: new Set(),
          weakSessions: new Set(),
        };
        byCategory.set(category, entry);
      }

      entry.seenSessions.add(session.id as string);
      if (verdict === "weak") {
        entry.weakSessions.add(session.id as string);
        entry.weakCount++;
        const weakIn =
          weakSessionsByQuestion.get(questionId as string) ?? new Set();
        weakIn.add(session.id as string);
        weakSessionsByQuestion.set(questionId as string, weakIn);
        if (!allWeakIds.includes(questionId as string)) {
          allWeakIds.push(questionId as string);
        }
      } else if (verdict === "ok") {
        entry.okCount++;
      } else {
        entry.strongCount++;
      }
    }
  }

  const categories = [...byCategory.values()]
    .map(({ seenSessions, weakSessions, ...trend }) => ({
      ...trend,
      sessionsAppeared: seenSessions.size,
      sessionsWeak: weakSessions.size,
    }))
    .sort(
      (a, b) =>
        b.sessionsWeak - a.sessionsWeak || b.weakCount - a.weakCount,
    );

  const recurringWeak = [...weakSessionsByQuestion.entries()]
    .filter(([, sessionsSet]) => sessionsSet.size >= 2)
    .map(([questionId, sessionsSet]) => ({
      questionId,
      weakSessions: sessionsSet.size,
    }))
    .sort((a, b) => b.weakSessions - a.weakSessions);

  return {
    analyzedSessions: analyzed.length,
    categories,
    recurringWeak,
    allWeakIds,
  };
}
