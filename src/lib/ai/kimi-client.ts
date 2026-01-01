// src/lib/ai/kimi-client.ts

import type { 
  AIMessage, 
  KimiConfig, 
  KimiChatRequest, 
  KimiChatResponse,
  KimiStreamChunk,
  InterviewEvaluation,
  GeneratedQuestion,
} from './types';
import { 
  INTERVIEWER_SYSTEM_PROMPT, 
  QUESTION_GENERATOR_PROMPT,
  ANSWER_EVALUATOR_PROMPT,
} from './prompts';

/**
 * Default Kimi configuration
 */
const DEFAULT_CONFIG: Partial<KimiConfig> = {
  baseUrl: 'https://api.moonshot.cn/v1',
  model: 'moonshot-v1-128k',
  defaultTemperature: 0.7,
  defaultMaxTokens: 2048,
};

/**
 * Kimi K2 API Client
 * 
 * Handles all interactions with the Kimi K2 API for:
 * - Interview simulation (chat)
 * - Question generation
 * - Answer evaluation
 */
export class KimiClient {
  private config: KimiConfig;
  
  constructor(config: Partial<KimiConfig> = {}) {
    const apiKey = config.apiKey || process.env.KIMI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'Kimi API key is required. Set KIMI_API_KEY environment variable or pass it in config.'
      );
    }
    
    this.config = {
      apiKey,
      baseUrl: config.baseUrl || process.env.KIMI_BASE_URL || DEFAULT_CONFIG.baseUrl!,
      model: config.model || process.env.KIMI_MODEL || DEFAULT_CONFIG.model!,
      defaultTemperature: config.defaultTemperature ?? DEFAULT_CONFIG.defaultTemperature,
      defaultMaxTokens: config.defaultMaxTokens ?? DEFAULT_CONFIG.defaultMaxTokens,
    };
  }
  
  /**
   * Make a chat completion request (non-streaming)
   */
  async chat(messages: AIMessage[], options: {
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<string> {
    const response = await this.makeRequest({
      model: this.config.model,
      messages,
      temperature: options.temperature ?? this.config.defaultTemperature,
      max_tokens: options.maxTokens ?? this.config.defaultMaxTokens,
      stream: false,
    });
    
    const data = await response.json() as KimiChatResponse;
    return data.choices[0]?.message?.content || '';
  }
  
  /**
   * Make a streaming chat completion request
   * Returns an async generator that yields content chunks
   */
  async *streamChat(messages: AIMessage[], options: {
    temperature?: number;
    maxTokens?: number;
  } = {}): AsyncGenerator<string, void, unknown> {
    const response = await this.makeRequest({
      model: this.config.model,
      messages,
      temperature: options.temperature ?? this.config.defaultTemperature,
      max_tokens: options.maxTokens ?? this.config.defaultMaxTokens,
      stream: true,
    });
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          
          if (trimmed.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(trimmed.slice(6)) as KimiStreamChunk;
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE chunk:', trimmed);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Conduct an interview conversation
   */
  async interviewChat(
    conversationHistory: AIMessage[],
    userMessage: string
  ): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];
    
    return this.chat(messages, { temperature: 0.8 });
  }
  
  /**
   * Stream interview response
   */
  async *streamInterviewChat(
    conversationHistory: AIMessage[],
    userMessage: string
  ): AsyncGenerator<string, void, unknown> {
    const messages: AIMessage[] = [
      { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];
    
    yield* this.streamChat(messages, { temperature: 0.8 });
  }
  
  /**
   * Generate a new interview question
   */
  async generateQuestion(
    topic: string,
    difficulty: 'junior' | 'mid' | 'senior',
    existingQuestions?: string[]
  ): Promise<GeneratedQuestion> {
    const prompt = `${QUESTION_GENERATOR_PROMPT}

Topic: ${topic}
Difficulty: ${difficulty}
${existingQuestions?.length ? `\nAvoid questions similar to:\n${existingQuestions.map(q => `- ${q}`).join('\n')}` : ''}

Generate a single question with its answer. Respond in JSON format:
{
  "question": "The interview question",
  "answer": "Comprehensive answer with code examples in markdown",
  "keyPoints": ["Key point 1", "Key point 2"],
  "difficulty": "${difficulty}",
  "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
}`;
    
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.9, maxTokens: 3000 }
    );
    
    // Parse JSON response
    try {
      // Extract JSON from response (may be wrapped in markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]) as GeneratedQuestion;
    } catch (error) {
      console.error('Failed to parse generated question:', error);
      throw new Error('Failed to generate valid question');
    }
  }
  
  /**
   * Evaluate a user's answer to an interview question
   */
  async evaluateAnswer(
    question: string,
    expectedKeyPoints: string[],
    userAnswer: string
  ): Promise<InterviewEvaluation> {
    const prompt = `${ANSWER_EVALUATOR_PROMPT}

## Question
${question}

## Expected Key Points
${expectedKeyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## User's Answer
${userAnswer}

Evaluate the answer and respond in JSON format:
{
  "coveredPoints": ["Points they covered well"],
  "missedPoints": ["Important points they missed"],
  "suggestions": ["Specific suggestions for improvement"],
  "assessment": "excellent|good|needs-improvement|incomplete",
  "followUpQuestion": "Optional follow-up question to dig deeper"
}`;
    
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.5, maxTokens: 1500 }
    );
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]) as InterviewEvaluation;
    } catch (error) {
      console.error('Failed to parse evaluation:', error);
      // Return a default evaluation
      return {
        coveredPoints: [],
        missedPoints: expectedKeyPoints,
        suggestions: ['Unable to parse AI evaluation. Please review the expected key points.'],
        assessment: 'incomplete',
      };
    }
  }
  
  /**
   * Generate a follow-up question based on the conversation
   */
  async generateFollowUp(
    originalQuestion: string,
    userAnswer: string,
    topic: string
  ): Promise<string> {
    const prompt = `You are a senior frontend interviewer. Based on the candidate's answer, generate a relevant follow-up question that digs deeper into their understanding.

Original Question: ${originalQuestion}

Candidate's Answer: ${userAnswer}

Topic Area: ${topic}

Generate a single follow-up question that:
1. Builds on what they mentioned
2. Tests deeper understanding
3. Is specific and focused

Respond with just the follow-up question, nothing else.`;
    
    return this.chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.8, maxTokens: 200 }
    );
  }
  
  /**
   * Make HTTP request to Kimi API
   */
  private async makeRequest(body: KimiChatRequest): Promise<Response> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} - ${error}`);
    }
    
    return response;
  }
}

/**
 * Singleton client instance
 */
let clientInstance: KimiClient | null = null;

/**
 * Get or create the Kimi client instance
 */
export function getKimiClient(): KimiClient {
  if (!clientInstance) {
    clientInstance = new KimiClient();
  }
  return clientInstance;
}
