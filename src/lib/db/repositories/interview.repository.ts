// src/lib/db/repositories/interview.repository.ts

import { nanoid } from 'nanoid';
import { getDatabase, writeDatabase } from '../index';
import type { 
  InterviewSession, 
  SessionId,
  MessageId,
  ChatMessage,
  InterviewConfig,
  SessionStatus,
  StartSessionInput,
  SendMessageInput,
  SessionSummary,
} from '@/types';
import { createSessionId, createMessageId, DEFAULT_INTERVIEW_CONFIG } from '@/types';

/**
 * Interview Repository
 * Handles interview session CRUD and message management
 */
export const interviewRepository = {
  /**
   * Get all sessions
   */
  async findAll(): Promise<InterviewSession[]> {
    const db = await getDatabase();
    return db.data.sessions;
  },
  
  /**
   * Get active sessions
   */
  async findActive(): Promise<InterviewSession[]> {
    const db = await getDatabase();
    return db.data.sessions.filter(s => s.status === 'active');
  },
  
  /**
   * Get completed sessions
   */
  async findCompleted(): Promise<InterviewSession[]> {
    const db = await getDatabase();
    return db.data.sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => 
        new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime()
      );
  },
  
  /**
   * Get a session by ID
   */
  async findById(id: SessionId): Promise<InterviewSession | null> {
    const db = await getDatabase();
    return db.data.sessions.find(s => s.id === id) ?? null;
  },
  
  /**
   * Start a new interview session
   */
  async create(input: StartSessionInput): Promise<InterviewSession> {
    const db = await getDatabase();
    
    const now = new Date().toISOString();
    const session: InterviewSession = {
      id: createSessionId(nanoid()),
      config: {
        ...DEFAULT_INTERVIEW_CONFIG,
        ...input.config,
      },
      status: 'active',
      messages: [],
      questionsAsked: [],
      currentQuestionIndex: 0,
      startedAt: now,
      endedAt: null,
      notes: '',
    };
    
    db.data.sessions.push(session);
    db.data.metadata.totalInterviewSessions += 1;
    await writeDatabase(db);
    
    return session;
  },
  
  /**
   * Add a message to a session
   */
  async addMessage(
    sessionId: SessionId,
    message: Omit<ChatMessage, 'id' | 'sessionId' | 'createdAt'>
  ): Promise<ChatMessage> {
    const db = await getDatabase();
    
    const sessionIndex = db.data.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    const chatMessage: ChatMessage = {
      ...message,
      id: createMessageId(nanoid()),
      sessionId,
      createdAt: new Date().toISOString(),
    };
    
    db.data.sessions[sessionIndex].messages.push(chatMessage);
    await writeDatabase(db);
    
    return chatMessage;
  },
  
  /**
   * Add multiple messages at once
   */
  async addMessages(
    sessionId: SessionId,
    messages: Array<Omit<ChatMessage, 'id' | 'sessionId' | 'createdAt'>>
  ): Promise<ChatMessage[]> {
    const db = await getDatabase();
    
    const sessionIndex = db.data.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    const chatMessages: ChatMessage[] = messages.map(msg => ({
      ...msg,
      id: createMessageId(nanoid()),
      sessionId,
      createdAt: new Date().toISOString(),
    }));
    
    db.data.sessions[sessionIndex].messages.push(...chatMessages);
    await writeDatabase(db);
    
    return chatMessages;
  },
  
  /**
   * Update a message (e.g., for streaming completion)
   */
  async updateMessage(
    sessionId: SessionId,
    messageId: MessageId,
    updates: Partial<Pick<ChatMessage, 'content' | 'metadata'>>
  ): Promise<ChatMessage | null> {
    const db = await getDatabase();
    
    const sessionIndex = db.data.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return null;
    
    const session = db.data.sessions[sessionIndex];
    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return null;
    
    const updated: ChatMessage = {
      ...session.messages[messageIndex],
      ...updates,
    };
    
    db.data.sessions[sessionIndex].messages[messageIndex] = updated;
    await writeDatabase(db);
    
    return updated;
  },
  
  /**
   * Mark a question as asked in the session
   */
  async markQuestionAsked(
    sessionId: SessionId,
    questionId: string
  ): Promise<void> {
    const db = await getDatabase();
    
    const sessionIndex = db.data.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return;
    
    const session = db.data.sessions[sessionIndex];
    if (!session.questionsAsked.includes(questionId as any)) {
      session.questionsAsked.push(questionId as any);
      session.currentQuestionIndex = session.questionsAsked.length;
      await writeDatabase(db);
    }
  },
  
  /**
   * Update session status
   */
  async updateStatus(
    sessionId: SessionId,
    status: SessionStatus
  ): Promise<InterviewSession | null> {
    const db = await getDatabase();
    
    const sessionIndex = db.data.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return null;
    
    db.data.sessions[sessionIndex].status = status;
    
    if (status === 'completed' || status === 'abandoned') {
      db.data.sessions[sessionIndex].endedAt = new Date().toISOString();
    }
    
    await writeDatabase(db);
    
    return db.data.sessions[sessionIndex];
  },
  
  /**
   * Update session notes
   */
  async updateNotes(
    sessionId: SessionId,
    notes: string
  ): Promise<InterviewSession | null> {
    const db = await getDatabase();
    
    const sessionIndex = db.data.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return null;
    
    db.data.sessions[sessionIndex].notes = notes;
    await writeDatabase(db);
    
    return db.data.sessions[sessionIndex];
  },
  
  /**
   * End a session and generate summary
   */
  async endSession(sessionId: SessionId): Promise<InterviewSession | null> {
    return this.updateStatus(sessionId, 'completed');
  },
  
  /**
   * Get session statistics
   */
  async getStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    averageSessionDuration: number;
    averageQuestionsPerSession: number;
  }> {
    const sessions = await this.findAll();
    
    const completed = sessions.filter(s => s.status === 'completed');
    const abandoned = sessions.filter(s => s.status === 'abandoned');
    
    let totalDuration = 0;
    let totalQuestions = 0;
    
    for (const session of completed) {
      if (session.endedAt) {
        const duration = new Date(session.endedAt).getTime() - 
                        new Date(session.startedAt).getTime();
        totalDuration += duration;
      }
      totalQuestions += session.questionsAsked.length;
    }
    
    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      abandonedSessions: abandoned.length,
      averageSessionDuration: completed.length > 0 
        ? totalDuration / completed.length / 60000 // in minutes
        : 0,
      averageQuestionsPerSession: completed.length > 0
        ? totalQuestions / completed.length
        : 0,
    };
  },
  
  /**
   * Delete a session
   */
  async delete(sessionId: SessionId): Promise<boolean> {
    const db = await getDatabase();
    
    const index = db.data.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return false;
    
    db.data.sessions.splice(index, 1);
    await writeDatabase(db);
    
    return true;
  },
  
  /**
   * Get recent sessions for history display
   */
  async getRecent(limit: number = 10): Promise<InterviewSession[]> {
    const db = await getDatabase();
    
    return db.data.sessions
      .filter(s => s.status !== 'active')
      .sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )
      .slice(0, limit);
  },
};
