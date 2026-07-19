// tests/interview-trends.test.ts

import { describe, expect, test } from "vitest";
import { computeWeakSpotTrends } from "@/lib/utils/interview-trends";
import type { InterviewSession, QuestionCategory, QuestionVerdict } from "@/types";

const CATEGORY_BY_QUESTION: Record<string, QuestionCategory> = {
  "sd-1": "system-design",
  "sd-2": "system-design",
  "css-1": "css-layout",
  "js-1": "js-fundamentals",
};

function session(
  id: string,
  startedAt: string,
  verdicts: Array<[string, QuestionVerdict]>,
): InterviewSession {
  return {
    id,
    startedAt,
    analysis: {
      verdicts: verdicts.map(([questionId, verdict]) => ({
        questionId,
        verdict,
      })),
      analyzedAt: startedAt,
    },
  } as unknown as InterviewSession;
}

const categoryOf = (id: string) => CATEGORY_BY_QUESTION[id] ?? null;

describe("computeWeakSpotTrends", () => {
  test("aggregates verdicts per category across sessions", () => {
    const trends = computeWeakSpotTrends(
      [
        session("s1", "2026-07-10T10:00:00Z", [
          ["sd-1", "weak"],
          ["css-1", "strong"],
        ]),
        session("s2", "2026-07-12T10:00:00Z", [
          ["sd-2", "weak"],
          ["css-1", "ok"],
        ]),
        session("s3", "2026-07-14T10:00:00Z", [
          ["sd-1", "weak"],
          ["js-1", "strong"],
        ]),
      ],
      categoryOf,
    );

    expect(trends.analyzedSessions).toBe(3);
    const sd = trends.categories.find((c) => c.category === "system-design")!;
    expect(sd.sessionsAppeared).toBe(3);
    expect(sd.sessionsWeak).toBe(3);
    expect(sd.weakCount).toBe(3);

    const css = trends.categories.find((c) => c.category === "css-layout")!;
    expect(css.sessionsAppeared).toBe(2);
    expect(css.sessionsWeak).toBe(0);
    expect(css.strongCount).toBe(1);
    expect(css.okCount).toBe(1);

    // Weakest category ranks first
    expect(trends.categories[0].category).toBe("system-design");
  });

  test("flags questions weak in 2+ sessions as recurring", () => {
    const trends = computeWeakSpotTrends(
      [
        session("s1", "2026-07-10T10:00:00Z", [["sd-1", "weak"]]),
        session("s2", "2026-07-12T10:00:00Z", [["sd-1", "weak"]]),
        session("s3", "2026-07-14T10:00:00Z", [["css-1", "weak"]]),
      ],
      categoryOf,
    );

    expect(trends.recurringWeak).toEqual([
      { questionId: "sd-1", weakSessions: 2 },
    ]);
    expect(trends.allWeakIds).toContain("sd-1");
    expect(trends.allWeakIds).toContain("css-1");
  });

  test("weak ids come most-recent-session first, deduplicated", () => {
    const trends = computeWeakSpotTrends(
      [
        session("old", "2026-07-01T10:00:00Z", [["css-1", "weak"]]),
        session("new", "2026-07-15T10:00:00Z", [
          ["sd-1", "weak"],
          ["css-1", "weak"],
        ]),
      ],
      categoryOf,
    );
    expect(trends.allWeakIds).toEqual(["sd-1", "css-1"]);
  });

  test("skipped verdicts, unknown questions, and unanalyzed sessions are ignored", () => {
    const trends = computeWeakSpotTrends(
      [
        session("s1", "2026-07-10T10:00:00Z", [
          ["sd-1", "skipped"],
          ["deleted-question", "weak"],
        ]),
        { id: "s2", startedAt: "2026-07-11T10:00:00Z" } as InterviewSession,
      ],
      categoryOf,
    );
    expect(trends.analyzedSessions).toBe(1);
    expect(trends.categories).toEqual([]);
    expect(trends.allWeakIds).toEqual([]);
  });
});
