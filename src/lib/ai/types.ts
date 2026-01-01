// src/lib/ai/types.ts

/**
 * Types for Kimi K2 AI integration
 */

/**
 * Message role in conversation
 */
export type AIMessageRole = 'system' | 'user' | 'assistant';

/**
 * Message structure for API calls
 */
export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

/**
 * Kimi API request body
 */
export interface KimiChatRequest {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Kimi API response (non-streaming)
 */
export interface KimiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: AIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Streaming chunk response
 */
export interface KimiStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<AIMessage>;
    finish_reason: string | null;
  }>;
}

/**
 * Interview evaluation result
 */
export interface InterviewEvaluation {
  /** Points the user covered well */
  coveredPoints: string[];
  /** Points the user missed */
  missedPoints: string[];
  /** Actionable suggestions */
  suggestions: string[];
  /** Overall assessment */
  assessment: 'excellent' | 'good' | 'needs-improvement' | 'incomplete';
  /** Follow-up question to ask */
  followUpQuestion?: string;
}

/**
 * Generated question structure
 */
export interface GeneratedQuestion {
  question: string;
  answer: string;
  keyPoints: string[];
  difficulty: 'junior' | 'mid' | 'senior';
  followUpQuestions: string[];
}

/**
 * Kimi client configuration
 */
export interface KimiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}
