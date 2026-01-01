// src/actions/question.actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { questionRepository } from '@/lib/db/repositories';
import type { 
  Question, 
  QuestionId, 
  QuestionCategory,
  Difficulty,
  QuestionFilters,
  CreateQuestionInput,
} from '@/types';
import { createQuestionId, QUESTION_CATEGORIES } from '@/types';

/**
 * Input validation schemas
 */
const CreateQuestionSchema = z.object({
  category: z.enum([
    'system-design',
    'caching-memoization',
    'bundle-tree-shaking',
    'security-auth',
    'feature-flags',
    'css-layout',
    'js-event-loop',
    'accessibility',
    'react-internals',
  ] as const),
  difficulty: z.enum(['junior', 'mid', 'senior'] as const),
  question: z.string().min(10, 'Question must be at least 10 characters'),
  answer: z.string().min(50, 'Answer must be at least 50 characters'),
  keyPoints: z.array(z.string()).min(1, 'At least one key point is required'),
  followUpQuestions: z.array(z.string()).default([]),
  relatedTopics: z.array(z.string()).default([]),
  commonAt: z.array(z.string()).optional(),
});

const UpdateQuestionSchema = CreateQuestionSchema.partial().extend({
  id: z.string().min(1, 'Question ID is required'),
});

const FilterQuestionsSchema = z.object({
  categories: z.array(z.string()).optional(),
  difficulties: z.array(z.enum(['junior', 'mid', 'senior'])).optional(),
  searchQuery: z.string().optional(),
  includeArchived: z.boolean().optional(),
});

/**
 * Action result type
 */
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string> };

/**
 * Get all questions with optional filters
 */
export async function getQuestions(
  filters?: QuestionFilters
): Promise<ActionResult<Question[]>> {
  try {
    const questions = await questionRepository.findAll(filters);
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error fetching questions:', error);
    return { success: false, error: 'Failed to fetch questions' };
  }
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(
  id: string
): Promise<ActionResult<Question | null>> {
  try {
    const question = await questionRepository.findById(createQuestionId(id));
    return { success: true, data: question };
  } catch (error) {
    console.error('Error fetching question:', error);
    return { success: false, error: 'Failed to fetch question' };
  }
}

/**
 * Get questions by category
 */
export async function getQuestionsByCategory(
  category: QuestionCategory
): Promise<ActionResult<Question[]>> {
  try {
    const questions = await questionRepository.findByCategory(category);
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    return { success: false, error: 'Failed to fetch questions' };
  }
}

/**
 * Create a new question
 */
export async function createQuestion(
  formData: FormData
): Promise<ActionResult<Question>> {
  try {
    // Parse form data
    const rawInput = {
      category: formData.get('category'),
      difficulty: formData.get('difficulty'),
      question: formData.get('question'),
      answer: formData.get('answer'),
      keyPoints: formData.getAll('keyPoints').filter(Boolean) as string[],
      followUpQuestions: formData.getAll('followUpQuestions').filter(Boolean) as string[],
      relatedTopics: formData.getAll('relatedTopics').filter(Boolean) as string[],
      commonAt: formData.getAll('commonAt').filter(Boolean) as string[],
    };
    
    // Validate
    const validationResult = CreateQuestionSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      const validationErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          validationErrors[issue.path[0].toString()] = issue.message;
        }
      });
      return { 
        success: false, 
        error: 'Validation failed', 
        validationErrors 
      };
    }
    
    const input = validationResult.data;
    
    // Create question
    const createInput: CreateQuestionInput = {
      ...input,
      source: 'user-created',
    };
    
    const question = await questionRepository.create(createInput);
    
    revalidatePath('/questions');
    revalidatePath('/flashcards');
    
    return { success: true, data: question };
  } catch (error) {
    console.error('Error creating question:', error);
    return { success: false, error: 'Failed to create question' };
  }
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  formData: FormData
): Promise<ActionResult<Question>> {
  try {
    // Parse form data
    const rawInput = {
      id: formData.get('id'),
      category: formData.get('category') || undefined,
      difficulty: formData.get('difficulty') || undefined,
      question: formData.get('question') || undefined,
      answer: formData.get('answer') || undefined,
      keyPoints: formData.getAll('keyPoints').filter(Boolean) as string[] || undefined,
      followUpQuestions: formData.getAll('followUpQuestions').filter(Boolean) as string[] || undefined,
      relatedTopics: formData.getAll('relatedTopics').filter(Boolean) as string[] || undefined,
    };
    
    // Remove undefined values
    const cleanedInput = Object.fromEntries(
      Object.entries(rawInput).filter(([_, v]) => v !== undefined && v !== '')
    );
    
    // Validate
    const validationResult = UpdateQuestionSchema.safeParse(cleanedInput);
    
    if (!validationResult.success) {
      const validationErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          validationErrors[issue.path[0].toString()] = issue.message;
        }
      });
      return { 
        success: false, 
        error: 'Validation failed', 
        validationErrors 
      };
    }
    
    const input = validationResult.data;
    
    // Update question
    const question = await questionRepository.update({
      id: createQuestionId(input.id),
      ...input,
    });
    
    if (!question) {
      return { success: false, error: 'Question not found' };
    }
    
    revalidatePath('/questions');
    revalidatePath(`/questions/${input.id}`);
    revalidatePath('/flashcards');
    
    return { success: true, data: question };
  } catch (error) {
    console.error('Error updating question:', error);
    return { success: false, error: 'Failed to update question' };
  }
}

/**
 * Archive a question (soft delete)
 */
export async function archiveQuestion(
  id: string
): Promise<ActionResult<void>> {
  try {
    const success = await questionRepository.archive(createQuestionId(id));
    
    if (!success) {
      return { success: false, error: 'Question not found' };
    }
    
    revalidatePath('/questions');
    revalidatePath('/flashcards');
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error archiving question:', error);
    return { success: false, error: 'Failed to archive question' };
  }
}

/**
 * Permanently delete a question
 */
export async function deleteQuestion(
  id: string
): Promise<ActionResult<void>> {
  try {
    const success = await questionRepository.delete(createQuestionId(id));
    
    if (!success) {
      return { success: false, error: 'Question not found' };
    }
    
    revalidatePath('/questions');
    revalidatePath('/flashcards');
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting question:', error);
    return { success: false, error: 'Failed to delete question' };
  }
}

/**
 * Get question statistics
 */
export async function getQuestionStats(): Promise<ActionResult<{
  total: number;
  byCategory: Record<QuestionCategory, number>;
  byDifficulty: Record<Difficulty, number>;
}>> {
  try {
    const stats = await questionRepository.getStats();
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}

/**
 * Get random questions for a quick study session
 */
export async function getRandomQuestions(
  count: number,
  category?: QuestionCategory,
  difficulty?: Difficulty
): Promise<ActionResult<Question[]>> {
  try {
    const questions = await questionRepository.getRandomQuestions(count, {
      category,
      difficulty,
    });
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error fetching random questions:', error);
    return { success: false, error: 'Failed to fetch random questions' };
  }
}

/**
 * Search questions by query
 */
export async function searchQuestions(
  query: string
): Promise<ActionResult<Question[]>> {
  try {
    const questions = await questionRepository.findAll({
      searchQuery: query,
    });
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error searching questions:', error);
    return { success: false, error: 'Failed to search questions' };
  }
}
