// src/types/index.ts

/**
 * Central type exports for FrontMaster
 * Import from '@/types' for cleaner imports
 */

// Question domain
export type {
  QuestionId,
  CategoryId,
  QuestionCategory,
  CategoryMetadata,
  Difficulty,
  QuestionSource,
  Question,
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionWithMeta,
  QuestionFilters,
  QuestionSortField,
  SortDirection,
  QuestionSortOptions,
} from './question.types';

export {
  QUESTION_CATEGORIES,
  createQuestionId,
  createCategoryId,
} from './question.types';

// Progress domain (SM-2)
export type {
  ProgressId,
  EaseFactor,
  SM2Quality,
  QualityButton,
  SM2State,
  QuestionProgress,
  ReviewRecord,
  RecordReviewInput,
  SM2CalculationResult,
  StudySessionStats,
  DueCards,
  CategoryProgress,
  ProgressDashboard,
} from './progress.types';

export {
  SM2_QUALITY,
  SM2_QUALITY_LABELS,
  QUALITY_BUTTONS,
  DEFAULT_SM2_STATE,
  createProgressId,
  createEaseFactor,
} from './progress.types';

// Interview domain
export type {
  SessionId,
  MessageId,
  SessionStatus,
  InterviewMode,
  MessageRole,
  ContentType,
  ChatMessage,
  InterviewConfig,
  InterviewSession,
  StartSessionInput,
  SendMessageInput,
  InterviewerResponse,
  AnswerFeedback,
  SessionSummary,
  StreamingState,
  ChatInputState,
} from './interview.types';

export {
  DEFAULT_INTERVIEW_CONFIG,
  createSessionId,
  createMessageId,
} from './interview.types';
