// src/types/interview.types.ts

import type { QuestionId, QuestionCategory, Difficulty } from './question.types';

/**
 * Branded types for interview-specific IDs
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type SessionId = Brand<string, 'SessionId'>;
export type MessageId = Brand<string, 'MessageId'>;

export const createSessionId = (id: string): SessionId => id as SessionId;
export const createMessageId = (id: string): MessageId => id as MessageId;

/**
 * Interview session status
 */
export type SessionStatus = 'active' | 'completed' | 'abandoned';

/**
 * Interview mode determines how questions are selected
 */
export type InterviewMode =
  | 'seed-only' // Only use pre-seeded questions
  | 'ai-generated' // Only AI-generated questions
  | 'mixed'; // Combination (default)

/**
 * Message role in the conversation
 */
export type MessageRole = 'system' | 'interviewer' | 'user';

/**
 * Message content type for rendering
 */
export type ContentType = 'text' | 'code' | 'markdown';

/**
 * Individual chat message
 */
export interface ChatMessage {
  id: MessageId;
  sessionId: SessionId;
  role: MessageRole;
  content: string;
  contentType: ContentType;

  /**
   * If this message is a question from a seed, reference it
   */
  questionId?: QuestionId;

  /**
   * If this is a follow-up, reference the parent message
   */
  parentMessageId?: MessageId;

  /**
   * Metadata for AI-generated messages
   */
  metadata?: {
    model?: string;
    tokensUsed?: number;
    generationTimeMs?: number;
  };

  /**
   * Timestamp
   */
  createdAt: string;
}

/**
 * Interview session configuration
 */
export interface InterviewConfig {
  /**
   * Focus on specific categories
   */
  categories: QuestionCategory[];

  /**
   * Target difficulty level
   */
  difficulty: Difficulty;

  /**
   * How questions are selected
   */
  mode: InterviewMode;

  /**
   * Maximum questions per session (0 = unlimited)
   */
  maxQuestions: number;

  /**
   * Time limit in minutes (0 = unlimited)
   */
  timeLimitMinutes: number;

  /**
   * Enable follow-up questions
   */
  enableFollowUps: boolean;

  /**
   * Custom instructions for the AI interviewer
   */
  customInstructions?: string;
}

/**
 * Default interview configuration
 */
export const DEFAULT_INTERVIEW_CONFIG: InterviewConfig = {
  categories: [],
  difficulty: 'mid',
  mode: 'mixed',
  maxQuestions: 5,
  timeLimitMinutes: 30,
  enableFollowUps: true,
};

/**
 * Interview session
 */
export interface InterviewSession {
  id: SessionId;

  /**
   * Session configuration
   */
  config: InterviewConfig;

  /**
   * Current status
   */
  status: SessionStatus;

  /**
   * All messages in the conversation
   */
  messages: ChatMessage[];

  /**
   * Questions asked in this session (for tracking)
   */
  questionsAsked: QuestionId[];

  /**
   * Current question index (for seed questions)
   */
  currentQuestionIndex: number;

  /**
   * Session timing
   */
  startedAt: string;
  endedAt: string | null;

  /**
   * Session notes (user can add notes during/after)
   */
  notes: string;
}

/**
 * Input for starting a new interview session
 */
export interface StartSessionInput {
  config: Partial<InterviewConfig>;
}

/**
 * Input for sending a message in the interview
 */
export interface SendMessageInput {
  sessionId: SessionId;
  content: string;
  contentType?: ContentType;
}

/**
 * Response from the AI interviewer
 */
export interface InterviewerResponse {
  message: ChatMessage;

  /**
   * Whether this is a follow-up question
   */
  isFollowUp: boolean;

  /**
   * Whether the interview should continue
   */
  shouldContinue: boolean;

  /**
   * Feedback on the user's answer (if applicable)
   */
  feedback?: AnswerFeedback;
}

/**
 * Feedback on a user's answer
 */
export interface AnswerFeedback {
  /**
   * Key points that were covered
   */
  coveredPoints: string[];

  /**
   * Key points that were missed
   */
  missedPoints: string[];

  /**
   * Suggestions for improvement
   */
  suggestions: string[];

  /**
   * Overall assessment
   */
  assessment: 'excellent' | 'good' | 'needs-improvement' | 'incomplete';
}

/**
 * Session summary generated at the end
 */
export interface SessionSummary {
  sessionId: SessionId;

  /**
   * Total questions asked
   */
  totalQuestions: number;

  /**
   * Duration in minutes
   */
  durationMinutes: number;

  /**
   * Topics covered
   */
  topicsCovered: QuestionCategory[];

  /**
   * Strengths identified
   */
  strengths: string[];

  /**
   * Areas for improvement
   */
  areasForImprovement: string[];

  /**
   * Recommended questions to study
   */
  recommendedQuestions: QuestionId[];

  /**
   * Overall performance summary
   */
  overallSummary: string;
}

/**
 * Streaming state for the chat interface
 */
export interface StreamingState {
  isStreaming: boolean;
  streamedContent: string;
  error: string | null;
}

/**
 * Chat input state
 */
export interface ChatInputState {
  value: string;
  isSubmitting: boolean;
  error: string | null;
}
