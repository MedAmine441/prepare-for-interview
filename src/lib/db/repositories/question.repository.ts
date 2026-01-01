// src/lib/db/repositories/question.repository.ts

import { nanoid } from 'nanoid';
import { getDatabase, writeDatabase } from '../index';
import type { 
  Question, 
  QuestionId, 
  QuestionCategory,
  Difficulty,
  QuestionSource,
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionFilters,
  QuestionSortOptions,
} from '@/types';
import { createQuestionId } from '@/types';

/**
 * Question Repository
 * Handles all CRUD operations for questions
 */
export const questionRepository = {
  /**
   * Get all questions (optionally filtered)
   */
  async findAll(filters?: QuestionFilters): Promise<Question[]> {
    const db = await getDatabase();
    let questions = db.data.questions;
    
    // Apply filters
    if (filters) {
      if (filters.categories?.length) {
        questions = questions.filter(q => 
          filters.categories!.includes(q.category)
        );
      }
      
      if (filters.difficulties?.length) {
        questions = questions.filter(q => 
          filters.difficulties!.includes(q.difficulty)
        );
      }
      
      if (filters.sources?.length) {
        questions = questions.filter(q => 
          filters.sources!.includes(q.source)
        );
      }
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        questions = questions.filter(q => 
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query) ||
          q.keyPoints.some(kp => kp.toLowerCase().includes(query))
        );
      }
      
      if (!filters.includeArchived) {
        questions = questions.filter(q => !q.isArchived);
      }
    } else {
      // Default: exclude archived
      questions = questions.filter(q => !q.isArchived);
    }
    
    return questions;
  },
  
  /**
   * Get a question by ID
   */
  async findById(id: QuestionId): Promise<Question | null> {
    const db = await getDatabase();
    return db.data.questions.find(q => q.id === id) ?? null;
  },
  
  /**
   * Get questions by category
   */
  async findByCategory(category: QuestionCategory): Promise<Question[]> {
    return this.findAll({ categories: [category] });
  },
  
  /**
   * Get questions by difficulty
   */
  async findByDifficulty(difficulty: Difficulty): Promise<Question[]> {
    return this.findAll({ difficulties: [difficulty] });
  },
  
  /**
   * Create a new question
   */
  async create(input: CreateQuestionInput): Promise<Question> {
    const db = await getDatabase();
    
    const now = new Date().toISOString();
    const question: Question = {
      ...input,
      id: createQuestionId(nanoid()),
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };
    
    db.data.questions.push(question);
    await writeDatabase(db);
    
    return question;
  },
  
  /**
   * Create multiple questions at once (for seeding)
   */
  async createMany(inputs: CreateQuestionInput[]): Promise<Question[]> {
    const db = await getDatabase();
    
    const now = new Date().toISOString();
    const questions: Question[] = inputs.map(input => ({
      ...input,
      id: createQuestionId(nanoid()),
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    }));
    
    db.data.questions.push(...questions);
    await writeDatabase(db);
    
    return questions;
  },
  
  /**
   * Update a question
   */
  async update(input: UpdateQuestionInput): Promise<Question | null> {
    const db = await getDatabase();
    
    const index = db.data.questions.findIndex(q => q.id === input.id);
    if (index === -1) return null;
    
    const updated: Question = {
      ...db.data.questions[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    
    db.data.questions[index] = updated;
    await writeDatabase(db);
    
    return updated;
  },
  
  /**
   * Archive a question (soft delete)
   */
  async archive(id: QuestionId): Promise<boolean> {
    const result = await this.update({ id, isArchived: true });
    return result !== null;
  },
  
  /**
   * Permanently delete a question
   */
  async delete(id: QuestionId): Promise<boolean> {
    const db = await getDatabase();
    
    const index = db.data.questions.findIndex(q => q.id === id);
    if (index === -1) return false;
    
    db.data.questions.splice(index, 1);
    await writeDatabase(db);
    
    return true;
  },
  
  /**
   * Get question count by category
   */
  async countByCategory(): Promise<Record<QuestionCategory, number>> {
    const db = await getDatabase();
    const counts: Record<string, number> = {};
    
    for (const question of db.data.questions) {
      if (!question.isArchived) {
        counts[question.category] = (counts[question.category] || 0) + 1;
      }
    }
    
    return counts as Record<QuestionCategory, number>;
  },
  
  /**
   * Get random questions for study session
   */
  async getRandomQuestions(
    count: number,
    options?: {
      category?: QuestionCategory;
      difficulty?: Difficulty;
      excludeIds?: QuestionId[];
    }
  ): Promise<Question[]> {
    let questions = await this.findAll({
      categories: options?.category ? [options.category] : undefined,
      difficulties: options?.difficulty ? [options.difficulty] : undefined,
    });
    
    // Exclude specific IDs
    if (options?.excludeIds?.length) {
      const excludeSet = new Set(options.excludeIds);
      questions = questions.filter(q => !excludeSet.has(q.id));
    }
    
    // Shuffle and take requested count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },
  
  /**
   * Check if database has been seeded with questions
   */
  async isSeeded(): Promise<boolean> {
    const db = await getDatabase();
    return db.data.questions.some(q => q.source === 'seed');
  },
  
  /**
   * Get statistics about questions
   */
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
