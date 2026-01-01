// src/actions/interview.actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { interviewRepository, questionRepository } from '@/lib/db/repositories';
import { getKimiClient } from '@/lib/ai/kimi-client';
import type { 
  InterviewSession, 
  SessionId,
  ChatMessage,
  InterviewConfig,
  QuestionCategory,
  Question,
} from '@/types';
import { createSessionId, DEFAULT_INTERVIEW_CONFIG } from '@/types';

/**
 * Input validation schemas
 */
const StartSessionSchema = z.object({
  categories: z.array(z.string()).default([]),
  difficulty: z.enum(['junior', 'mid', 'senior']).default('mid'),
  mode: z.enum(['seed-only', 'ai-generated', 'mixed']).default('mixed'),
  maxQuestions: z.number().min(1).max(20).default(5),
  enableFollowUps: z.boolean().default(true),
});

const SendMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

/**
 * Action result type
 */
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Start a new interview session
 */
export async function startInterviewSession(
  formData: FormData
): Promise<ActionResult<InterviewSession>> {
  try {
    // Parse form data
    const rawInput = {
      categories: formData.getAll('categories') as string[],
      difficulty: formData.get('difficulty') || 'mid',
      mode: formData.get('mode') || 'mixed',
      maxQuestions: Number(formData.get('maxQuestions')) || 5,
      enableFollowUps: formData.get('enableFollowUps') !== 'false',
    };
    
    const validationResult = StartSessionSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map(issue => issue.message)
        .join(', ');
      return { success: false, error: errors };
    }
    
    const config = validationResult.data;
    
    // Create session
    const session = await interviewRepository.create({
      config: {
        ...DEFAULT_INTERVIEW_CONFIG,
        categories: config.categories as QuestionCategory[],
        difficulty: config.difficulty,
        mode: config.mode,
        maxQuestions: config.maxQuestions,
        enableFollowUps: config.enableFollowUps,
      },
    });
    
    // Add initial system message
    await interviewRepository.addMessage(session.id, {
      role: 'system',
      content: `Interview session started. Focus: ${config.categories.length > 0 ? config.categories.join(', ') : 'All topics'}. Difficulty: ${config.difficulty}.`,
      contentType: 'text',
    });
    
    // Get first question and add interviewer message
    const firstQuestion = await getNextQuestion(session);
    
    if (firstQuestion) {
      await interviewRepository.addMessage(session.id, {
        role: 'interviewer',
        content: `Welcome! Let's start with this question:\n\n${firstQuestion.question}`,
        contentType: 'markdown',
        questionId: firstQuestion.id,
      });
      
      await interviewRepository.markQuestionAsked(session.id, firstQuestion.id);
    }
    
    // Fetch updated session
    const updatedSession = await interviewRepository.findById(session.id);
    
    revalidatePath('/interview');
    
    return { success: true, data: updatedSession! };
  } catch (error) {
    console.error('Error starting interview session:', error);
    return { success: false, error: 'Failed to start interview session' };
  }
}

/**
 * Send a message in an interview session
 */
export async function sendInterviewMessage(
  formData: FormData
): Promise<ActionResult<{
  userMessage: ChatMessage;
  interviewerResponse: ChatMessage;
}>> {
  try {
    const rawInput = {
      sessionId: formData.get('sessionId'),
      content: formData.get('content'),
    };
    
    const validationResult = SendMessageSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map(issue => issue.message)
        .join(', ');
      return { success: false, error: errors };
    }
    
    const { sessionId, content } = validationResult.data;
    const typedSessionId = createSessionId(sessionId);
    
    // Get session
    const session = await interviewRepository.findById(typedSessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    
    if (session.status !== 'active') {
      return { success: false, error: 'Session is not active' };
    }
    
    // Add user message
    const userMessage = await interviewRepository.addMessage(typedSessionId, {
      role: 'user',
      content,
      contentType: 'text',
    });
    
    // Generate AI response
    const aiResponse = await generateInterviewerResponse(session, content);
    
    // Add interviewer message
    const interviewerMessage = await interviewRepository.addMessage(typedSessionId, {
      role: 'interviewer',
      content: aiResponse,
      contentType: 'markdown',
    });
    
    revalidatePath(`/interview/${sessionId}`);
    
    return {
      success: true,
      data: {
        userMessage,
        interviewerResponse: interviewerMessage,
      },
    };
  } catch (error) {
    console.error('Error sending interview message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * End an interview session
 */
export async function endInterviewSession(
  sessionId: string
): Promise<ActionResult<InterviewSession>> {
  try {
    const typedSessionId = createSessionId(sessionId);
    
    // Update session status
    const session = await interviewRepository.updateStatus(typedSessionId, 'completed');
    
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    
    // Add closing message
    await interviewRepository.addMessage(typedSessionId, {
      role: 'interviewer',
      content: 'Great job! The interview session is now complete. Review your conversation to see areas for improvement.',
      contentType: 'text',
    });
    
    revalidatePath('/interview');
    revalidatePath(`/interview/${sessionId}`);
    
    return { success: true, data: session };
  } catch (error) {
    console.error('Error ending interview session:', error);
    return { success: false, error: 'Failed to end session' };
  }
}

/**
 * Get session by ID
 */
export async function getInterviewSession(
  sessionId: string
): Promise<ActionResult<InterviewSession | null>> {
  try {
    const session = await interviewRepository.findById(createSessionId(sessionId));
    return { success: true, data: session };
  } catch (error) {
    console.error('Error fetching session:', error);
    return { success: false, error: 'Failed to fetch session' };
  }
}

/**
 * Get recent interview sessions
 */
export async function getRecentSessions(
  limit: number = 10
): Promise<ActionResult<InterviewSession[]>> {
  try {
    const sessions = await interviewRepository.getRecent(limit);
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return { success: false, error: 'Failed to fetch sessions' };
  }
}

/**
 * Get interview statistics
 */
export async function getInterviewStats(): Promise<ActionResult<{
  totalSessions: number;
  completedSessions: number;
  averageSessionDuration: number;
  averageQuestionsPerSession: number;
}>> {
  try {
    const stats = await interviewRepository.getStats();
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching interview stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}

/**
 * Update session notes
 */
export async function updateSessionNotes(
  sessionId: string,
  notes: string
): Promise<ActionResult<void>> {
  try {
    await interviewRepository.updateNotes(createSessionId(sessionId), notes);
    revalidatePath(`/interview/${sessionId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error updating session notes:', error);
    return { success: false, error: 'Failed to update notes' };
  }
}

/**
 * Helper: Get next question for the session
 */
async function getNextQuestion(session: InterviewSession): Promise<Question | null> {
  const { config, questionsAsked } = session;
  
  // For seed-only or mixed mode, try to get a seed question first
  if (config.mode !== 'ai-generated') {
    const questions = await questionRepository.getRandomQuestions(1, {
      category: config.categories[0],
      difficulty: config.difficulty,
      excludeIds: questionsAsked,
    });
    
    if (questions.length > 0) {
      return questions[0];
    }
  }
  
  // No seed questions available or AI-only mode
  return null;
}

/**
 * Helper: Generate interviewer response using AI
 */
async function generateInterviewerResponse(
  session: InterviewSession,
  userMessage: string
): Promise<string> {
  try {
    const kimi = getKimiClient();
    
    // Build conversation history for context
    const conversationHistory = session.messages
      .filter(m => m.role !== 'system')
      .slice(-10) // Last 10 messages for context
      .map(m => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.content,
      })) as Array<{ role: 'user' | 'assistant'; content: string }>;
    
    // Get the current question being discussed
    const currentQuestionId = session.questionsAsked[session.questionsAsked.length - 1];
    let currentQuestion: Question | null = null;
    
    if (currentQuestionId) {
      currentQuestion = await questionRepository.findById(currentQuestionId);
    }
    
    // If we have a current question, evaluate the answer
    if (currentQuestion) {
      const evaluation = await kimi.evaluateAnswer(
        currentQuestion.question,
        currentQuestion.keyPoints,
        userMessage
      );
      
      // Build response based on evaluation
      let response = '';
      
      if (evaluation.coveredPoints.length > 0) {
        response += `Good points! You covered:\n${evaluation.coveredPoints.map(p => `- ${p}`).join('\n')}\n\n`;
      }
      
      if (evaluation.missedPoints.length > 0) {
        response += `You might also want to consider:\n${evaluation.missedPoints.map(p => `- ${p}`).join('\n')}\n\n`;
      }
      
      if (evaluation.suggestions.length > 0) {
        response += `Suggestions:\n${evaluation.suggestions.map(s => `- ${s}`).join('\n')}\n\n`;
      }
      
      // Add follow-up or next question
      if (session.config.enableFollowUps && evaluation.followUpQuestion) {
        response += `Follow-up question: ${evaluation.followUpQuestion}`;
      } else if (session.questionsAsked.length < session.config.maxQuestions) {
        const nextQuestion = await getNextQuestion({
          ...session,
          questionsAsked: [...session.questionsAsked],
        });
        
        if (nextQuestion) {
          response += `\n\nLet's move on to the next question:\n\n${nextQuestion.question}`;
          await interviewRepository.markQuestionAsked(session.id, nextQuestion.id);
        } else {
          response += "\n\nThat covers our prepared questions. Would you like to continue discussing any topic in more depth?";
        }
      } else {
        response += "\n\nWe've covered all the planned questions. Great session! You can end the interview when you're ready.";
      }
      
      return response;
    }
    
    // Fallback to general chat response
    return await kimi.interviewChat(conversationHistory, userMessage);
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm having trouble generating a response. Let's continue - feel free to ask about any frontend topic you'd like to discuss.";
  }
}
