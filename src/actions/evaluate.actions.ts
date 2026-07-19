// src/actions/evaluate.actions.ts

"use server";

import { z } from "zod";
import { questionRepository } from "@/lib/db/repositories";
import { createQuestionId, QUALITY_BUTTONS } from "@/types";
import type { QualityButton } from "@/types";

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1";
const KIMI_MODEL = process.env.KIMI_MODEL || "kimi-k2.6";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type SuggestedRating = "again" | "hard" | "good" | "easy";

export interface AnswerEvaluation {
  /** Aligned with the question's keyPoints array: did the answer cover point i? */
  keyPointsCovered: boolean[];
  /** 1-2 sentence verdict: what was good, the most important gap */
  feedback: string;
  suggestedRating: SuggestedRating;
  suggestedQuality: QualityButton;
}

const RATING_TO_QUALITY: Record<SuggestedRating, QualityButton> = {
  again: QUALITY_BUTTONS.AGAIN,
  hard: QUALITY_BUTTONS.HARD,
  good: QUALITY_BUTTONS.GOOD,
  easy: QUALITY_BUTTONS.EASY,
};

const EvaluationSchema = z.object({
  keyPointsCovered: z.array(z.boolean()).min(1),
  feedback: z.string().min(3).max(600),
  suggestedRating: z.enum(["again", "hard", "good", "easy"]),
});

const InputSchema = z.object({
  questionId: z.string().min(1),
  typedAnswer: z.string().min(1).max(8000),
});

/**
 * Grade a typed flashcard answer against the question's key points.
 * Returns per-key-point coverage plus a suggested SM-2 rating.
 */
export async function evaluateTypedAnswer(
  questionId: string,
  typedAnswer: string,
): Promise<ActionResult<AnswerEvaluation>> {
  try {
    const input = InputSchema.safeParse({ questionId, typedAnswer });
    if (!input.success) {
      return { success: false, error: "Nothing to grade — type an answer first" };
    }

    if (!KIMI_API_KEY) {
      return {
        success: false,
        error: "KIMI_API_KEY not configured — rate yourself below",
      };
    }

    const question = await questionRepository.findById(
      createQuestionId(questionId),
    );
    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const jsonShape = `{
  "keyPointsCovered": [${question.keyPoints.map(() => "true|false").join(", ")}],
  "feedback": "1-2 sentences: what was good, then the single most important gap",
  "suggestedRating": "again|hard|good|easy"
}`;

    const prompt =
      question.category === "coding-challenges"
        ? `You are reviewing a candidate's code from a live frontend coding round.

## The task
${question.question}

## Review rubric — what a strong solution demonstrates
${question.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## Candidate's solution
"""
${input.data.typedAnswer}
"""

Trace the code mentally and judge whether it actually demonstrates each rubric point — don't trust comments or claims. Style differences are fine; wrong behavior is not. Rubric points about *explaining* something count as covered if the code or its comments show the understanding.

Respond with ONLY a JSON object (no markdown fences, no commentary):
${jsonShape}

Rating rubric: "again" = doesn't work or wrong approach; "hard" = partially works, misses key edge cases; "good" = correct with minor gaps; "easy" = correct, idiomatic, edge cases handled. keyPointsCovered must have exactly ${question.keyPoints.length} entries, in rubric order.`
        : `You are grading a frontend interview flashcard answer that the candidate typed from memory.

## Question
${question.question}

## Key points a complete answer covers
${question.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## Candidate's typed answer
"""
${input.data.typedAnswer}
"""

Grade on meaning, not wording — accept synonyms, shorthand, and code fragments. A key point counts as covered if its core idea is clearly present.

Respond with ONLY a JSON object (no markdown fences, no commentary):
${jsonShape}

Rating rubric: "again" = fundamentally wrong or off-topic; "hard" = big gaps, under half the key points; "good" = solid with minor gaps; "easy" = complete and precise. keyPointsCovered must have exactly ${question.keyPoints.length} entries, in the same order as the key points above.`;

    const response = await fetchWithRetry(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: "user", content: prompt }],
        // Reasoning model: thinking tokens come out of this budget too
        max_tokens: 4096,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Kimi evaluation error:", detail);
      return { success: false, error: "AI grading failed — rate yourself below" };
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "";

    const parsed = extractJsonObject(content);
    const validated = EvaluationSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("Unparseable evaluation output:", content.slice(0, 1000));
      return { success: false, error: "AI grading failed — rate yourself below" };
    }

    // Normalize coverage length to the actual key point count
    const covered = question.keyPoints.map(
      (_, i) => validated.data.keyPointsCovered[i] ?? false,
    );

    return {
      success: true,
      data: {
        keyPointsCovered: covered,
        feedback: validated.data.feedback,
        suggestedRating: validated.data.suggestedRating,
        suggestedQuality: RATING_TO_QUALITY[validated.data.suggestedRating],
      },
    };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      success: false,
      error: timedOut
        ? "AI grading timed out — rate yourself below"
        : "AI grading failed — rate yourself below",
    };
  }
}

export type FollowUpVerdict = "strong" | "ok" | "weak";

export interface FollowUpEvaluation {
  /** 1-2 sentences: what's right, what's missing */
  feedback: string;
  verdict: FollowUpVerdict;
}

const FollowUpEvaluationSchema = z.object({
  feedback: z.string().min(3).max(600),
  verdict: z.enum(["strong", "ok", "weak"]),
});

const FollowUpInputSchema = z.object({
  questionId: z.string().min(1),
  followUpIndex: z.number().int().min(0),
  typedAnswer: z.string().min(1).max(8000),
});

/**
 * Grade an answer to one of a question's stored follow-up questions.
 * Follow-ups have no keyPoints of their own, so the parent question's
 * reference material anchors the judgment.
 */
export async function evaluateFollowUpAnswer(
  questionId: string,
  followUpIndex: number,
  typedAnswer: string,
): Promise<ActionResult<FollowUpEvaluation>> {
  try {
    const input = FollowUpInputSchema.safeParse({
      questionId,
      followUpIndex,
      typedAnswer,
    });
    if (!input.success) {
      return { success: false, error: "Nothing to grade — type an answer first" };
    }

    if (!KIMI_API_KEY) {
      return { success: false, error: "KIMI_API_KEY not configured" };
    }

    const question = await questionRepository.findById(
      createQuestionId(questionId),
    );
    const followUp = question?.followUpQuestions[input.data.followUpIndex];
    if (!question || !followUp) {
      return { success: false, error: "Follow-up question not found" };
    }

    const prompt = `You are a frontend interviewer evaluating a candidate's answer to a follow-up question.

## Original question (the candidate already answered this)
${question.question}

## Reference material for the original question
Key points: ${question.keyPoints.join("; ")}

Model answer:
${question.answer}

## The follow-up question you asked
${followUp}

## Candidate's answer to the follow-up
"""
${input.data.typedAnswer}
"""

Judge ONLY the follow-up answer. Grade on meaning, not wording — accept shorthand and code fragments.

Respond with ONLY a JSON object (no markdown fences, no commentary):
{
  "feedback": "1-2 sentences: what's right, then the most important thing missing or wrong",
  "verdict": "strong|ok|weak"
}

Verdict rubric: "strong" = correct and covers the substance; "ok" = right direction with real gaps; "weak" = wrong, off-topic, or empty of substance.`;

    const response = await fetchWithRetry(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      console.error("Kimi follow-up evaluation error:", await response.text());
      return { success: false, error: "AI grading failed" };
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    const validated = FollowUpEvaluationSchema.safeParse(
      extractJsonObject(content),
    );
    if (!validated.success) {
      console.error("Unparseable follow-up evaluation:", content.slice(0, 1000));
      return { success: false, error: "AI grading failed" };
    }

    return { success: true, data: validated.data };
  } catch (error) {
    console.error("Error evaluating follow-up:", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      success: false,
      error: timedOut ? "AI grading timed out" : "AI grading failed",
    };
  }
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

/** Extract the first JSON object from model output, tolerating fences/preamble */
function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
