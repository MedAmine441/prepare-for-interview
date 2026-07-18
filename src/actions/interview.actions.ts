// src/actions/interview.actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  interviewRepository,
  questionRepository,
  progressRepository,
} from "@/lib/db/repositories";
import {
  createQuestionId,
  createSessionId,
  QUESTION_CATEGORIES,
  QUALITY_BUTTONS,
} from "@/types";
import type {
  InterviewSession,
  QuestionCategory,
  QuestionVerdict,
  Question,
} from "@/types";

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1";
const KIMI_MODEL = process.env.KIMI_MODEL || "kimi-k2.6";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const StartInterviewSchema = z.object({
  categories: z.array(
    z.enum(
      Object.values(QUESTION_CATEGORIES) as [QuestionCategory, ...QuestionCategory[]],
    ),
  ),
  difficulty: z.enum(["junior", "mid", "senior"] as const),
  mode: z.enum(["seed-only", "ai-generated", "mixed"] as const),
  maxQuestions: z.number().min(1).max(10),
});

export type StartInterviewInput = z.infer<typeof StartInterviewSchema>;

/**
 * Create a persisted interview session: pick the bank questions now and
 * store their ids so the session page renders the same interview on refresh.
 */
export async function startInterview(
  input: StartInterviewInput,
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const parsed = StartInterviewSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid interview options" };
    }
    const { categories, difficulty, mode, maxQuestions } = parsed.data;

    // Any still-active session was walked away from — tidy it up
    const actives = await interviewRepository.findActive();
    for (const stale of actives) {
      await interviewRepository.updateStatus(stale.id, "abandoned");
    }

    const bankQuestions =
      mode === "ai-generated"
        ? []
        : shuffle(
            await questionRepository.findAll({
              categories: categories.length > 0 ? categories : undefined,
              difficulties: [difficulty],
            }),
          ).slice(0, maxQuestions);

    const session = await interviewRepository.create({
      config: { categories, difficulty, mode, maxQuestions },
    });
    for (const q of bankQuestions) {
      await interviewRepository.markQuestionAsked(session.id, q.id);
    }

    revalidatePath("/interview");
    return { success: true, data: { sessionId: session.id } };
  } catch (error) {
    console.error("Error starting interview:", error);
    return { success: false, error: "Failed to start interview" };
  }
}

const TranscriptSchema = z.array(
  z.object({
    role: z.enum(["user", "assistant"] as const),
    content: z.string(),
  }),
);

/**
 * Persist the chat transcript (called after each completed turn).
 * Overwrites the stored messages — sessions are low-volume documents.
 */
export async function saveInterviewTranscript(
  sessionId: string,
  transcript: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ActionResult<void>> {
  try {
    const parsed = TranscriptSchema.safeParse(transcript);
    if (!parsed.success) {
      return { success: false, error: "Invalid transcript" };
    }

    const id = createSessionId(sessionId);
    const session = await interviewRepository.findById(id);
    if (!session) return { success: false, error: "Session not found" };

    session.messages = [];
    await interviewRepository.addMessages(
      id,
      parsed.data.map((m) => ({
        role: m.role === "assistant" ? ("interviewer" as const) : ("user" as const),
        content: m.content,
        contentType: "markdown" as const,
      })),
    );

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error saving transcript:", error);
    return { success: false, error: "Failed to save transcript" };
  }
}

export interface InterviewAnalysisResult {
  /** Bank questions the candidate struggled with, now rescheduled for review */
  weakQuestions: Array<{ id: string; question: string; category: string }>;
  okCount: number;
  strongCount: number;
  /** False when the session had no bank questions to map (pure AI interviews) */
  analyzed: boolean;
}

const VerdictSchema = z.array(
  z.object({
    id: z.string(),
    verdict: z.enum(["weak", "ok", "strong", "skipped"] as const),
  }),
);

/**
 * Complete the interview: store the debrief, grade each asked bank question
 * from the transcript, and mark weak ones "Again" so SM-2 brings them back.
 */
export async function completeInterview(
  sessionId: string,
  debrief: string,
): Promise<ActionResult<InterviewAnalysisResult>> {
  try {
    const id = createSessionId(sessionId);
    const session = await interviewRepository.findById(id);
    if (!session) return { success: false, error: "Session not found" };

    await interviewRepository.updateNotes(id, debrief);
    await interviewRepository.updateStatus(id, "completed");
    revalidatePath("/interview");

    const askedQuestions = (
      await Promise.all(
        session.questionsAsked.map((qid) => questionRepository.findById(qid)),
      )
    ).filter((q): q is Question => q !== null);

    if (askedQuestions.length === 0 || !KIMI_API_KEY) {
      return {
        success: true,
        data: { weakQuestions: [], okCount: 0, strongCount: 0, analyzed: false },
      };
    }

    const transcript = session.messages
      .map(
        (m) =>
          `${m.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`,
      )
      .join("\n\n");

    const prompt = `You are analyzing a finished mock frontend interview to find the candidate's weak spots.

## Questions planned for this interview (with grading rubric)
${askedQuestions
  .map(
    (q, i) =>
      `${i + 1}. [id: ${q.id}] ${q.question}\n   Key points a strong answer covers: ${q.keyPoints.join("; ")}`,
  )
  .join("\n")}

## Transcript
${transcript}

For each planned question, judge how the candidate actually performed in the transcript:
- "weak": struggled, major gaps, wrong, or gave up
- "ok": partial answer with notable gaps
- "strong": covered most key points confidently
- "skipped": the question was never asked or never answered

Respond with ONLY a JSON array (no markdown fences, no commentary):
[{"id": "the question id", "verdict": "weak|ok|strong|skipped"}]`;

    const response = await fetchWithRetry(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8192,
        stream: false,
      }),
      signal: AbortSignal.timeout(180_000),
    });

    if (!response.ok) {
      console.error("Kimi analysis error:", await response.text());
      return {
        success: true,
        data: { weakQuestions: [], okCount: 0, strongCount: 0, analyzed: false },
      };
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    const parsed = extractJsonArray(content);
    const validated = VerdictSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("Unparseable analysis output:", content.slice(0, 1000));
      return {
        success: true,
        data: { weakQuestions: [], okCount: 0, strongCount: 0, analyzed: false },
      };
    }

    const askedById = new Map(askedQuestions.map((q) => [q.id as string, q]));
    const verdicts = validated.data.filter((v) => askedById.has(v.id));

    await interviewRepository.updateAnalysis(id, {
      verdicts: verdicts.map((v) => ({
        questionId: createQuestionId(v.id),
        verdict: v.verdict as QuestionVerdict,
      })),
      analyzedAt: new Date().toISOString(),
    });

    // Weak answers become due reviews: record an "Again" so SM-2 resets them
    const weakQuestions: InterviewAnalysisResult["weakQuestions"] = [];
    for (const v of verdicts) {
      if (v.verdict !== "weak") continue;
      const q = askedById.get(v.id)!;
      weakQuestions.push({
        id: q.id as string,
        question: q.question,
        category: q.category,
      });
      await progressRepository.recordReview({
        questionId: q.id,
        quality: QUALITY_BUTTONS.AGAIN,
        responseTimeMs: 0,
        wasRevealed: true,
      });
    }

    revalidatePath("/flashcards");
    revalidatePath("/");

    return {
      success: true,
      data: {
        weakQuestions,
        okCount: verdicts.filter((v) => v.verdict === "ok").length,
        strongCount: verdicts.filter((v) => v.verdict === "strong").length,
        analyzed: true,
      },
    };
  } catch (error) {
    console.error("Error completing interview:", error);
    return { success: false, error: "Failed to analyze the interview" };
  }
}

/**
 * List past (non-active) sessions for the history page.
 */
export async function getRecentSessions(
  limit: number = 20,
): Promise<ActionResult<InterviewSession[]>> {
  try {
    const sessions = await interviewRepository.getRecent(limit);
    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error fetching recent sessions:", error);
    return { success: false, error: "Failed to fetch sessions" };
  }
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Retry once on transient network errors (connect timeouts etc.) */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw error;
    await new Promise((r) => setTimeout(r, 1000));
    return fetch(url, init);
  }
}

/** Extract the first JSON array from model output, tolerating fences/preamble */
function extractJsonArray(text: string): unknown[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const result = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(result) ? result : null;
  } catch {
    return null;
  }
}
