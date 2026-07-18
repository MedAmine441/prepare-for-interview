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

    const prompt = `You are grading a frontend interview flashcard answer that the candidate typed from memory.

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
{
  "keyPointsCovered": [${question.keyPoints.map(() => "true|false").join(", ")}],
  "feedback": "1-2 sentences: what was good, then the single most important gap",
  "suggestedRating": "again|hard|good|easy"
}

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
