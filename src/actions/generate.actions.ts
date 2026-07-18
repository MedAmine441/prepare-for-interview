// src/actions/generate.actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { questionRepository } from "@/lib/db/repositories";
import { CATEGORY_METADATA } from "@/lib/constants/categories";
import { QUESTION_CATEGORIES } from "@/types";
import type { Question, QuestionCategory, Difficulty } from "@/types";

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1";
const KIMI_MODEL = process.env.KIMI_MODEL || "kimi-k2.6";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const GeneratedQuestionSchema = z.object({
  question: z.string().min(15),
  answer: z.string().min(100),
  keyPoints: z.array(z.string().min(3)).min(3).max(8),
  followUpQuestions: z.array(z.string()).max(5).default([]),
  relatedTopics: z.array(z.string()).max(6).default([]),
});

const InputSchema = z.object({
  category: z.enum(
    Object.values(QUESTION_CATEGORIES) as [QuestionCategory, ...QuestionCategory[]],
  ),
  difficulty: z.enum(["junior", "mid", "senior"] as const),
  count: z.number().min(1).max(3),
});

/**
 * Generate new interview questions with AI and add them to the bank.
 * Existing question titles are passed to the model to avoid duplicates.
 */
export async function generateQuestions(
  category: QuestionCategory,
  difficulty: Difficulty,
  count: number,
): Promise<ActionResult<Question[]>> {
  try {
    const input = InputSchema.safeParse({ category, difficulty, count });
    if (!input.success) {
      return { success: false, error: "Invalid generation options" };
    }

    if (!KIMI_API_KEY) {
      return {
        success: false,
        error: "KIMI_API_KEY not configured — add it to .env.local",
      };
    }

    console.log(`[generate] start ${category}/${difficulty} x${count}`);
    const existing = await questionRepository.findByCategory(category);
    const meta = CATEGORY_METADATA[category];

    const prompt = `You are an expert frontend interviewer creating study material.

Generate exactly ${count} high-quality frontend interview question${count > 1 ? "s" : ""} for:
- Topic: ${meta.name} — ${meta.description}
- Difficulty: ${difficulty} (junior = fundamentals; mid = practical application and pitfalls; senior = architecture, tradeoffs, edge cases)

${existing.length > 0 ? `Do NOT duplicate or closely resemble these existing questions:\n${existing.map((q) => `- ${q.question}`).join("\n")}\n` : ""}
Requirements for each question:
- "question": phrased exactly as an interviewer would ask it
- "answer": a model answer in Markdown, 150-250 words, using ## section headers and a short code example only where it genuinely teaches something
- "keyPoints": 4-6 concise bullet points (max ~100 chars each) capturing what a strong answer must cover — these are used as flashcard quick-answers, so make them self-contained
- "followUpQuestions": 2-3 realistic follow-ups
- "relatedTopics": 3-4 short kebab-case topic slugs

Respond with ONLY a JSON array (no markdown fences, no commentary):
[{"question": "...", "answer": "...", "keyPoints": ["..."], "followUpQuestions": ["..."], "relatedTopics": ["..."]}]`;

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

    console.log(`[generate] kimi responded: ${response.status}`);
    if (!response.ok) {
      const detail = await response.text();
      console.error("Kimi generation error:", detail);
      return { success: false, error: "AI request failed — try again" };
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    console.log(
      `[generate] finish=${data.choices?.[0]?.finish_reason} contentLen=${content.length}`,
    );

    const parsed = extractJsonArray(content);
    if (!parsed) {
      console.error("Unparseable AI output:", content.slice(0, 2000));
      return { success: false, error: "AI returned unparseable output — try again" };
    }

    const validated = z.array(GeneratedQuestionSchema).safeParse(parsed);
    if (!validated.success || validated.data.length === 0) {
      console.error(
        "AI output failed validation:",
        !validated.success ? validated.error.issues.slice(0, 5) : "empty array",
      );
      return { success: false, error: "AI output failed validation — try again" };
    }

    const created: Question[] = [];
    for (const q of validated.data.slice(0, count)) {
      created.push(
        await questionRepository.create({
          category,
          difficulty,
          question: q.question,
          answer: q.answer,
          keyPoints: q.keyPoints,
          followUpQuestions: q.followUpQuestions,
          relatedTopics: q.relatedTopics,
          source: "ai-generated",
        }),
      );
    }

    revalidatePath("/questions");
    revalidatePath("/flashcards");
    revalidatePath("/");

    return { success: true, data: created };
  } catch (error) {
    console.error("Error generating questions:", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      success: false,
      error: timedOut
        ? "Generation timed out — try a smaller count"
        : "Failed to generate questions",
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
