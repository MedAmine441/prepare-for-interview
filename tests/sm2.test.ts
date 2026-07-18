// tests/sm2.test.ts

import { describe, expect, test } from "vitest";
import {
  calculateSM2,
  getInitialSM2State,
  getIntervalPreviews,
  getMasteryLevel,
  getDueCards,
  formatInterval,
  isDue,
} from "@/lib/algorithms/sm2";
import { createEaseFactor, createQuestionId } from "@/types";
import type { SM2State, SM2Quality } from "@/types";

function state(overrides: Partial<SM2State> = {}): SM2State {
  return { ...getInitialSM2State(), ...overrides };
}

describe("calculateSM2", () => {
  test.each([0, 1, 2] as SM2Quality[])(
    "failing quality %i resets repetitions and schedules tomorrow",
    (quality) => {
      const { newState } = calculateSM2(
        state({ repetitions: 3, interval: 15 }),
        quality,
      );
      expect(newState.repetitions).toBe(0);
      expect(newState.interval).toBe(1);
    },
  );

  test.each([3, 4] as SM2Quality[])(
    "first correct answer at quality %i graduates to 1 day",
    (quality) => {
      const { newState } = calculateSM2(state(), quality);
      expect(newState.repetitions).toBe(1);
      expect(newState.interval).toBe(1);
    },
  );

  test("first-review perfect recall gets the Anki-style 4-day bonus", () => {
    const { newState } = calculateSM2(state(), 5);
    expect(newState.repetitions).toBe(1);
    expect(newState.interval).toBe(4);
  });

  test("second correct answer goes to 6 days", () => {
    const { newState } = calculateSM2(
      state({ repetitions: 1, interval: 1 }),
      4,
    );
    expect(newState.repetitions).toBe(2);
    expect(newState.interval).toBe(6);
  });

  test("later reviews multiply the interval by the ease factor", () => {
    const { newState } = calculateSM2(
      state({ repetitions: 2, interval: 6, easeFactor: createEaseFactor(2.5) }),
      4,
    );
    expect(newState.repetitions).toBe(3);
    // quality 4 keeps EF at 2.5: 6 * 2.5 = 15
    expect(newState.interval).toBe(15);
  });

  test("quality 3 lowers the ease factor by 0.14", () => {
    const { newState } = calculateSM2(state(), 3);
    expect(newState.easeFactor).toBeCloseTo(2.36, 5);
  });

  test("ease factor never drops below 1.3", () => {
    let current = state();
    for (let i = 0; i < 5; i++) {
      current = calculateSM2(current, 0).newState;
    }
    expect(current.easeFactor).toBe(1.3);
  });

  test("ease factor never exceeds 3.0", () => {
    let current = state();
    for (let i = 0; i < 10; i++) {
      current = calculateSM2(current, 5).newState;
    }
    expect(current.easeFactor).toBe(3.0);
  });

  test("interval is capped so endless correct reviews can't overflow Date", () => {
    let current = state();
    for (let i = 0; i < 60; i++) {
      current = calculateSM2(current, 4).newState;
    }
    expect(current.interval).toBeLessThanOrEqual(3650);
    expect(new Date(current.nextReviewDate).getTime()).not.toBeNaN();
  });

  test("next review date lands interval days in the future", () => {
    const { newState } = calculateSM2(state(), 5);
    const expected = new Date();
    expected.setDate(expected.getDate() + 4);
    const actual = new Date(newState.nextReviewDate);
    expect(
      Math.abs(actual.getTime() - expected.getTime()),
    ).toBeLessThan(5_000);
  });
});

describe("getIntervalPreviews", () => {
  test("returns a formatted preview for all six quality ratings", () => {
    const previews = getIntervalPreviews(state());
    expect(Object.keys(previews)).toHaveLength(6);
    expect(previews[0]).toBe("1 day");
    expect(previews[5]).toBe("4 days");
  });
});

describe("formatInterval", () => {
  test.each([
    [0, "Now"],
    [1, "1 day"],
    [6, "6 days"],
    [7, "1 week"],
    [21, "3 weeks"],
    [30, "1 month"],
    [180, "6 months"],
    [365, "1 year"],
    [730, "2 years"],
  ])("%i days → %s", (days, label) => {
    expect(formatInterval(days)).toBe(label);
  });
});

describe("getMasteryLevel", () => {
  test("maps SM-2 state to the right level", () => {
    expect(getMasteryLevel(state())).toBe("new");
    expect(getMasteryLevel(state({ repetitions: 1, interval: 3 }))).toBe(
      "learning",
    );
    expect(getMasteryLevel(state({ repetitions: 3, interval: 15 }))).toBe(
      "reviewing",
    );
    expect(getMasteryLevel(state({ repetitions: 5, interval: 45 }))).toBe(
      "mastered",
    );
  });
});

describe("isDue / getDueCards", () => {
  const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  test("isDue is true once the review date has passed", () => {
    expect(isDue(state({ nextReviewDate: daysFromNow(-1) }))).toBe(true);
    expect(isDue(state({ nextReviewDate: daysFromNow(2) }))).toBe(false);
  });

  test("classifies cards into new / overdue / dueToday / upcoming", () => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 0, 0, 0);

    const records = [
      { id: createQuestionId("q-new"), sm2: state() },
      {
        id: createQuestionId("q-overdue"),
        sm2: state({ repetitions: 2, nextReviewDate: daysFromNow(-3) }),
      },
      {
        id: createQuestionId("q-today"),
        sm2: state({
          repetitions: 2,
          nextReviewDate: endOfToday.toISOString(),
        }),
      },
      {
        id: createQuestionId("q-upcoming"),
        sm2: state({ repetitions: 2, nextReviewDate: daysFromNow(10) }),
      },
    ];

    const due = getDueCards(records);
    expect(due.new).toEqual(["q-new"]);
    expect(due.overdue).toEqual(["q-overdue"]);
    expect(due.dueToday).toEqual(["q-today"]);
    expect(due.upcoming).toEqual(["q-upcoming"]);
  });

  test("most urgent overdue card comes first", () => {
    const records = [
      {
        id: createQuestionId("q-slightly-late"),
        sm2: state({ repetitions: 2, nextReviewDate: daysFromNow(-1) }),
      },
      {
        id: createQuestionId("q-very-late"),
        sm2: state({ repetitions: 2, nextReviewDate: daysFromNow(-20) }),
      },
    ];
    expect(getDueCards(records).overdue[0]).toBe("q-very-late");
  });
});
