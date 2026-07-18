// src/lib/db/repositories/question.repository.ts

import { nanoid } from 'nanoid';
import { getDb } from '../index';
import type {
  Question,
  QuestionId,
  QuestionCategory,
  Difficulty,
  QuestionSource,
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionFilters,
} from '@/types';
import { createQuestionId } from '@/types';

interface QuestionRow {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  answer: string;
  key_points: string;
  follow_up_questions: string;
  related_topics: string;
  source: string;
  common_at: string | null;
  created_at: string;
  updated_at: string;
  is_archived: number;
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: createQuestionId(row.id),
    category: row.category as QuestionCategory,
    difficulty: row.difficulty as Difficulty,
    question: row.question,
    answer: row.answer,
    keyPoints: JSON.parse(row.key_points),
    followUpQuestions: JSON.parse(row.follow_up_questions),
    relatedTopics: JSON.parse(row.related_topics),
    source: row.source as QuestionSource,
    commonAt: row.common_at ? JSON.parse(row.common_at) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isArchived: row.is_archived === 1,
  };
}

/**
 * Question Repository — SQLite-backed CRUD for questions.
 */
export const questionRepository = {
  async findAll(filters?: QuestionFilters): Promise<Question[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.categories?.length) {
      where.push(`category IN (${filters.categories.map(() => '?').join(',')})`);
      params.push(...filters.categories);
    }
    if (filters?.difficulties?.length) {
      where.push(`difficulty IN (${filters.difficulties.map(() => '?').join(',')})`);
      params.push(...filters.difficulties);
    }
    if (filters?.sources?.length) {
      where.push(`source IN (${filters.sources.map(() => '?').join(',')})`);
      params.push(...filters.sources);
    }
    if (filters?.searchQuery) {
      where.push('(question LIKE ? COLLATE NOCASE OR answer LIKE ? COLLATE NOCASE OR key_points LIKE ? COLLATE NOCASE)');
      const like = `%${filters.searchQuery}%`;
      params.push(like, like, like);
    }
    if (!filters?.includeArchived) {
      where.push('is_archived = 0');
    }

    const sql = `SELECT * FROM questions${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at, id`;
    const rows = getDb().prepare(sql).all(...params) as unknown as QuestionRow[];
    return rows.map(rowToQuestion);
  },

  async findById(id: QuestionId): Promise<Question | null> {
    const row = getDb()
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(id) as unknown as QuestionRow | undefined;
    return row ? rowToQuestion(row) : null;
  },

  async findByCategory(category: QuestionCategory): Promise<Question[]> {
    return this.findAll({ categories: [category] });
  },

  async findByDifficulty(difficulty: Difficulty): Promise<Question[]> {
    return this.findAll({ difficulties: [difficulty] });
  },

  async create(input: CreateQuestionInput): Promise<Question> {
    const now = new Date().toISOString();
    const question: Question = {
      ...input,
      id: createQuestionId(nanoid()),
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    getDb()
      .prepare(
        `INSERT INTO questions
           (id, category, difficulty, question, answer, key_points,
            follow_up_questions, related_topics, source, common_at,
            created_at, updated_at, is_archived)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      )
      .run(
        question.id,
        question.category,
        question.difficulty,
        question.question,
        question.answer,
        JSON.stringify(question.keyPoints),
        JSON.stringify(question.followUpQuestions),
        JSON.stringify(question.relatedTopics),
        question.source,
        question.commonAt ? JSON.stringify(question.commonAt) : null,
        now,
        now,
      );

    return question;
  },

  async update(input: UpdateQuestionInput): Promise<Question | null> {
    const existing = await this.findById(input.id);
    if (!existing) return null;

    const merged: Question = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    getDb()
      .prepare(
        `UPDATE questions SET
           category = ?, difficulty = ?, question = ?, answer = ?,
           key_points = ?, follow_up_questions = ?, related_topics = ?,
           source = ?, common_at = ?, updated_at = ?, is_archived = ?
         WHERE id = ?`,
      )
      .run(
        merged.category,
        merged.difficulty,
        merged.question,
        merged.answer,
        JSON.stringify(merged.keyPoints),
        JSON.stringify(merged.followUpQuestions),
        JSON.stringify(merged.relatedTopics),
        merged.source,
        merged.commonAt ? JSON.stringify(merged.commonAt) : null,
        merged.updatedAt,
        merged.isArchived ? 1 : 0,
        merged.id,
      );

    return merged;
  },

  async archive(id: QuestionId): Promise<boolean> {
    const result = await this.update({ id, isArchived: true });
    return result !== null;
  },

  async delete(id: QuestionId): Promise<boolean> {
    const result = getDb().prepare('DELETE FROM questions WHERE id = ?').run(id);
    return result.changes > 0;
  },

  async countByCategory(): Promise<Record<QuestionCategory, number>> {
    const rows = getDb()
      .prepare('SELECT category, COUNT(*) AS n FROM questions WHERE is_archived = 0 GROUP BY category')
      .all() as unknown as Array<{ category: string; n: number }>;

    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.category] = row.n;
    return counts as Record<QuestionCategory, number>;
  },

  async getRandomQuestions(
    count: number,
    options?: {
      category?: QuestionCategory;
      difficulty?: Difficulty;
      excludeIds?: QuestionId[];
    },
  ): Promise<Question[]> {
    const where: string[] = ['is_archived = 0'];
    const params: (string | number)[] = [];

    if (options?.category) {
      where.push('category = ?');
      params.push(options.category);
    }
    if (options?.difficulty) {
      where.push('difficulty = ?');
      params.push(options.difficulty);
    }
    if (options?.excludeIds?.length) {
      where.push(`id NOT IN (${options.excludeIds.map(() => '?').join(',')})`);
      params.push(...options.excludeIds);
    }

    const rows = getDb()
      .prepare(
        `SELECT * FROM questions WHERE ${where.join(' AND ')} ORDER BY RANDOM() LIMIT ?`,
      )
      .all(...params, count) as unknown as QuestionRow[];
    return rows.map(rowToQuestion);
  },

  async isSeeded(): Promise<boolean> {
    const row = getDb()
      .prepare("SELECT 1 AS one FROM questions WHERE source = 'seed' LIMIT 1")
      .get();
    return row !== undefined;
  },

  async getStats(): Promise<{
    total: number;
    byCategory: Record<QuestionCategory, number>;
    byDifficulty: Record<Difficulty, number>;
    bySource: Record<QuestionSource, number>;
  }> {
    const questions = await this.findAll();

    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const q of questions) {
      byCategory[q.category] = (byCategory[q.category] || 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
      bySource[q.source] = (bySource[q.source] || 0) + 1;
    }

    return {
      total: questions.length,
      byCategory: byCategory as Record<QuestionCategory, number>,
      byDifficulty: byDifficulty as Record<Difficulty, number>,
      bySource: bySource as Record<QuestionSource, number>,
    };
  },
};
