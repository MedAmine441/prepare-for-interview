// tests/pacing.test.ts

import { describe, expect, test } from "vitest";
import {
  DEFAULT_DAILY_NEW_LIMIT,
  computeStudyPace,
  dailyNewLimit,
  daysUntil,
} from "@/lib/utils/pacing";

function localDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

describe("daysUntil", () => {
  test("today is 0, tomorrow is 1, yesterday is -1", () => {
    expect(daysUntil(localDateString(0))).toBe(0);
    expect(daysUntil(localDateString(1))).toBe(1);
    expect(daysUntil(localDateString(-1))).toBe(-1);
  });
});

describe("computeStudyPace", () => {
  test("long runway keeps a 4-day review buffer", () => {
    const pace = computeStudyPace(12, 78);
    expect(pace.reviewBuffer).toBe(4);
    expect(pace.studyDays).toBe(8);
    expect(pace.newPerDay).toBe(10);
  });

  test("short runway shrinks the buffer instead of exploding the pace", () => {
    expect(computeStudyPace(7, 40)).toEqual({
      reviewBuffer: 2,
      studyDays: 5,
      newPerDay: 8,
    });
    expect(computeStudyPace(3, 40)).toEqual({
      reviewBuffer: 1,
      studyDays: 2,
      newPerDay: 20,
    });
  });

  test("studyDays never drops below 1", () => {
    const pace = computeStudyPace(1, 30);
    expect(pace.studyDays).toBe(1);
    expect(pace.newPerDay).toBe(30);
  });

  test("an empty backlog needs zero new cards per day", () => {
    expect(computeStudyPace(10, 0).newPerDay).toBe(0);
  });
});

describe("dailyNewLimit", () => {
  test("falls back to the default without an interview date", () => {
    expect(dailyNewLimit(null, 80)).toBe(DEFAULT_DAILY_NEW_LIMIT);
  });

  test("follows the countdown pace when a date is set", () => {
    expect(dailyNewLimit(localDateString(12), 78)).toBe(10);
  });

  test("interview day means pure review — zero new cards", () => {
    expect(dailyNewLimit(localDateString(0), 78)).toBe(0);
  });

  test("a passed date falls back to the default", () => {
    expect(dailyNewLimit(localDateString(-3), 78)).toBe(
      DEFAULT_DAILY_NEW_LIMIT,
    );
  });
});
