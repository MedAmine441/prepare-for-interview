// src/lib/db/schema.ts

import type { 
  Question, 
  QuestionProgress, 
  InterviewSession 
} from '@/types';

/**
 * Database schema definition for lowdb
 * This mirrors what would be database tables in a real DB
 */
export interface DatabaseSchema {
  /** All questions (seed + AI-generated + user-created) */
  questions: Question[];
  
  /** User progress for SM-2 spaced repetition */
  progress: QuestionProgress[];
  
  /** Interview session history */
  sessions: InterviewSession[];
  
  /** Application metadata */
  metadata: AppMetadata;
}

/**
 * Application-level metadata
 */
export interface AppMetadata {
  /** Database version for migrations */
  version: number;
  
  /** When the database was created */
  createdAt: string;
  
  /** When the database was last modified */
  updatedAt: string;
  
  /** Total study sessions completed */
  totalStudySessions: number;
  
  /** Total interview sessions completed */
  totalInterviewSessions: number;
  
  /** Current study streak in days */
  studyStreak: number;
  
  /** Last study date for streak calculation */
  lastStudyDate: string | null;
}

/**
 * Default database state
 */
export const DEFAULT_DATABASE: DatabaseSchema = {
  questions: [],
  progress: [],
  sessions: [],
  metadata: {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalStudySessions: 0,
    totalInterviewSessions: 0,
    studyStreak: 0,
    lastStudyDate: null,
  },
};

/**
 * Type guard for checking if data matches schema
 */
export function isValidDatabaseSchema(data: unknown): data is DatabaseSchema {
  if (typeof data !== 'object' || data === null) return false;
  
  const db = data as Partial<DatabaseSchema>;
  
  return (
    Array.isArray(db.questions) &&
    Array.isArray(db.progress) &&
    Array.isArray(db.sessions) &&
    typeof db.metadata === 'object' &&
    db.metadata !== null
  );
}
