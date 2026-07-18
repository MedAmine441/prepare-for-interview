// tests/question.repository.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { getDb } from "@/lib/db";
import { questionRepository } from "@/lib/db/repositories";
import { progressRepository } from "@/lib/db/repositories";
import type { CreateQuestionInput } from "@/types";

function input(overrides: Partial<CreateQuestionInput> = {}): CreateQuestionInput {
  return {
    category: "js-fundamentals",
    difficulty: "mid",
    question: "What is a closure and when would you use one?",
    answer: "## Closures\n\nA function plus its captured lexical scope...",
    keyPoints: ["Function + lexical scope", "Data privacy", "Factories"],
    followUpQuestions: ["How do closures cause memory leaks?"],
    relatedTopics: ["scope", "lexical-environment"],
    source: "seed",
    ...overrides,
  };
}

beforeEach(() => {
  getDb().exec("DELETE FROM progress; DELETE FROM questions;");
});

describe("questionRepository CRUD", () => {
  test("create then findById round-trips every field", async () => {
    const created = await questionRepository.create(
      input({ commonAt: ["Meta", "Google"] }),
    );
    const found = await questionRepository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.question).toBe(created.question);
    expect(found!.keyPoints).toEqual(created.keyPoints);
    expect(found!.followUpQuestions).toEqual(created.followUpQuestions);
    expect(found!.commonAt).toEqual(["Meta", "Google"]);
    expect(found!.isArchived).toBe(false);
  });

  test("commonAt stays undefined when absent", async () => {
    const created = await questionRepository.create(input());
    const found = await questionRepository.findById(created.id);
    expect(found!.commonAt).toBeUndefined();
  });

  test("update merges partial changes and bumps updatedAt", async () => {
    const created = await questionRepository.create(input());
    const updated = await questionRepository.update({
      id: created.id,
      difficulty: "senior",
    });

    expect(updated!.difficulty).toBe("senior");
    expect(updated!.question).toBe(created.question);

    const found = await questionRepository.findById(created.id);
    expect(found!.difficulty).toBe("senior");
  });

  test("update on a missing id returns null", async () => {
    const result = await questionRepository.update({
      id: "does-not-exist" as never,
      difficulty: "senior",
    });
    expect(result).toBeNull();
  });

  test("delete removes the row and reports whether it existed", async () => {
    const created = await questionRepository.create(input());
    expect(await questionRepository.delete(created.id)).toBe(true);
    expect(await questionRepository.delete(created.id)).toBe(false);
    expect(await questionRepository.findById(created.id)).toBeNull();
  });

  test("deleting a question cascades to its progress row", async () => {
    const created = await questionRepository.create(input());
    await progressRepository.getOrCreate(created.id);
    expect(await progressRepository.findByQuestionId(created.id)).not.toBeNull();

    await questionRepository.delete(created.id);
    expect(await progressRepository.findByQuestionId(created.id)).toBeNull();
  });
});

describe("questionRepository filtering", () => {
  beforeEach(async () => {
    await questionRepository.create(input());
    await questionRepository.create(
      input({
        category: "css-layout",
        difficulty: "junior",
        question: "Explain the difference between Flexbox and Grid.",
        source: "ai-generated",
      }),
    );
    await questionRepository.create(
      input({
        category: "css-layout",
        difficulty: "senior",
        question: "What creates a new stacking context?",
      }),
    );
  });

  test("filters by category", async () => {
    const results = await questionRepository.findAll({
      categories: ["css-layout"],
    });
    expect(results).toHaveLength(2);
    expect(results.every((q) => q.category === "css-layout")).toBe(true);
  });

  test("filters by difficulty and source together", async () => {
    const results = await questionRepository.findAll({
      difficulties: ["junior"],
      sources: ["ai-generated"],
    });
    expect(results).toHaveLength(1);
    expect(results[0].question).toContain("Flexbox");
  });

  test("search is case-insensitive across question text", async () => {
    const results = await questionRepository.findAll({
      searchQuery: "sTaCkInG",
    });
    expect(results).toHaveLength(1);
    expect(results[0].question).toContain("stacking context");
  });

  test("archived questions are hidden unless explicitly included", async () => {
    const all = await questionRepository.findAll();
    await questionRepository.archive(all[0].id);

    expect(await questionRepository.findAll()).toHaveLength(2);
    expect(
      await questionRepository.findAll({ includeArchived: true }),
    ).toHaveLength(3);
  });

  test("getRandomQuestions respects excludeIds and count", async () => {
    const all = await questionRepository.findAll();
    const excluded = all.slice(0, 2).map((q) => q.id);

    const picked = await questionRepository.getRandomQuestions(5, {
      excludeIds: excluded,
    });
    expect(picked).toHaveLength(1);
    expect(excluded).not.toContain(picked[0].id);
  });

  test("countByCategory only counts unarchived questions", async () => {
    const all = await questionRepository.findAll({
      categories: ["css-layout"],
    });
    await questionRepository.archive(all[0].id);

    const counts = await questionRepository.countByCategory();
    expect(counts["css-layout"]).toBe(1);
    expect(counts["js-fundamentals"]).toBe(1);
  });
});
