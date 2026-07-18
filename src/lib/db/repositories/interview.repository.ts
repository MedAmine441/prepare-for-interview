// src/lib/db/repositories/interview.repository.ts

import { nanoid } from 'nanoid';
import { getDb, getMeta, setMeta } from '../index';
import type {
  InterviewSession,
  SessionId,
  MessageId,
  ChatMessage,
  SessionStatus,
  StartSessionInput,
} from '@/types';
import { createSessionId, createMessageId, DEFAULT_INTERVIEW_CONFIG } from '@/types';

/**
 * Interview Repository — sessions stored as JSON documents in SQLite,
 * with status/started_at columns for querying. Sessions are low-volume
 * append-mostly data, so document storage keeps the mapping trivial.
 */

function readSession(id: SessionId | string): InterviewSession | null {
  const row = getDb()
    .prepare('SELECT data FROM sessions WHERE id = ?')
    .get(id) as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as InterviewSession) : null;
}

function writeSession(session: InterviewSession): void {
  getDb()
    .prepare(
      `INSERT INTO sessions (id, status, started_at, data) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         data = excluded.data`,
    )
    .run(session.id, session.status, session.startedAt, JSON.stringify(session));
}

function readAllSessions(): InterviewSession[] {
  const rows = getDb()
    .prepare('SELECT data FROM sessions')
    .all() as unknown as Array<{ data: string }>;
  return rows.map((r) => JSON.parse(r.data) as InterviewSession);
}

export const interviewRepository = {
  async findAll(): Promise<InterviewSession[]> {
    return readAllSessions();
  },

  async findActive(): Promise<InterviewSession[]> {
    return readAllSessions().filter((s) => s.status === 'active');
  },

  async findCompleted(): Promise<InterviewSession[]> {
    return readAllSessions()
      .filter((s) => s.status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime(),
      );
  },

  async findById(id: SessionId): Promise<InterviewSession | null> {
    return readSession(id);
  },

  async create(input: StartSessionInput): Promise<InterviewSession> {
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

    writeSession(session);
    setMeta('totalInterviewSessions', getMeta<number>('totalInterviewSessions', 0) + 1);

    return session;
  },

  async addMessage(
    sessionId: SessionId,
    message: Omit<ChatMessage, 'id' | 'sessionId' | 'createdAt'>,
  ): Promise<ChatMessage> {
    const session = readSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const chatMessage: ChatMessage = {
      ...message,
      id: createMessageId(nanoid()),
      sessionId,
      createdAt: new Date().toISOString(),
    };

    session.messages.push(chatMessage);
    writeSession(session);

    return chatMessage;
  },

  async addMessages(
    sessionId: SessionId,
    messages: Array<Omit<ChatMessage, 'id' | 'sessionId' | 'createdAt'>>,
  ): Promise<ChatMessage[]> {
    const session = readSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      ...msg,
      id: createMessageId(nanoid()),
      sessionId,
      createdAt: new Date().toISOString(),
    }));

    session.messages.push(...chatMessages);
    writeSession(session);

    return chatMessages;
  },

  async updateMessage(
    sessionId: SessionId,
    messageId: MessageId,
    updates: Partial<Pick<ChatMessage, 'content' | 'metadata'>>,
  ): Promise<ChatMessage | null> {
    const session = readSession(sessionId);
    if (!session) return null;

    const messageIndex = session.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return null;

    session.messages[messageIndex] = {
      ...session.messages[messageIndex],
      ...updates,
    };
    writeSession(session);

    return session.messages[messageIndex];
  },

  async markQuestionAsked(sessionId: SessionId, questionId: string): Promise<void> {
    const session = readSession(sessionId);
    if (!session) return;

    if (!session.questionsAsked.includes(questionId as never)) {
      session.questionsAsked.push(questionId as never);
      session.currentQuestionIndex = session.questionsAsked.length;
      writeSession(session);
    }
  },

  async updateStatus(
    sessionId: SessionId,
    status: SessionStatus,
  ): Promise<InterviewSession | null> {
    const session = readSession(sessionId);
    if (!session) return null;

    session.status = status;
    if (status === 'completed' || status === 'abandoned') {
      session.endedAt = new Date().toISOString();
    }
    writeSession(session);

    return session;
  },

  async updateNotes(
    sessionId: SessionId,
    notes: string,
  ): Promise<InterviewSession | null> {
    const session = readSession(sessionId);
    if (!session) return null;

    session.notes = notes;
    writeSession(session);

    return session;
  },

  async updateAnalysis(
    sessionId: SessionId,
    analysis: NonNullable<InterviewSession['analysis']>,
  ): Promise<InterviewSession | null> {
    const session = readSession(sessionId);
    if (!session) return null;

    session.analysis = analysis;
    writeSession(session);

    return session;
  },

  async endSession(sessionId: SessionId): Promise<InterviewSession | null> {
    return this.updateStatus(sessionId, 'completed');
  },

  async getStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    averageSessionDuration: number;
    averageQuestionsPerSession: number;
  }> {
    const sessions = await this.findAll();

    const completed = sessions.filter((s) => s.status === 'completed');
    const abandoned = sessions.filter((s) => s.status === 'abandoned');

    let totalDuration = 0;
    let totalQuestions = 0;

    for (const session of completed) {
      if (session.endedAt) {
        totalDuration +=
          new Date(session.endedAt).getTime() -
          new Date(session.startedAt).getTime();
      }
      totalQuestions += session.questionsAsked.length;
    }

    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      abandonedSessions: abandoned.length,
      averageSessionDuration:
        completed.length > 0 ? totalDuration / completed.length / 60000 : 0,
      averageQuestionsPerSession:
        completed.length > 0 ? totalQuestions / completed.length : 0,
    };
  },

  async delete(sessionId: SessionId): Promise<boolean> {
    const result = getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return result.changes > 0;
  },

  async getRecent(limit: number = 10): Promise<InterviewSession[]> {
    return readAllSessions()
      .filter((s) => s.status !== 'active')
      .sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )
      .slice(0, limit);
  },
};
