// src/app/interview/[sessionId]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InterviewChat } from "@/components/interview/InterviewChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { interviewRepository, questionRepository } from "@/lib/db/repositories";
import { formatCategory } from "@/lib/utils/question-format";
import { createSessionId } from "@/types";
import type { Question } from "@/types";

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function InterviewSessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;

  // Sessions are created by the setup page before navigating here
  const session = await interviewRepository.findById(createSessionId(sessionId));
  if (!session) {
    redirect("/interview");
  }
  // Finished sessions live in history — only active ones can be chatted
  if (session.status !== "active") {
    redirect(`/interview/history/${sessionId}`);
  }

  const { categories, difficulty, mode, maxQuestions } = session.config;

  // A refresh mid-interview picks the conversation back up where it was
  const initialMessages = session.messages.map((m) => ({
    role: m.role === "interviewer" ? ("assistant" as const) : ("user" as const),
    content: m.content,
    createdAt: m.createdAt,
  }));

  // The bank questions were picked at session start — same set on every render
  const bankQuestions = (
    await Promise.all(
      session.questionsAsked.map((id) => questionRepository.findById(id)),
    )
  ).filter((q): q is Question => q !== null);

  const topicLabel =
    categories.length > 0
      ? categories.map(formatCategory).join(", ")
      : "any frontend topic";

  const systemPrompt = buildInterviewerPrompt({
    topicLabel,
    difficulty,
    mode,
    maxQuestions,
    bankQuestions: bankQuestions.map((q) => ({
      question: q.question,
      keyPoints: q.keyPoints,
    })),
    hasBehavioral:
      categories.includes("behavioral") ||
      bankQuestions.some((q) => q.category === "behavioral"),
  });

  // With bank questions we can open deterministically (no API round-trip);
  // otherwise the client asks the model to open the interview.
  const openingMessage =
    bankQuestions.length > 0
      ? `Hi! I'll be your interviewer today — ${bankQuestions.length} question${
          bankQuestions.length > 1 ? "s" : ""
        } on **${topicLabel}** at ${difficulty} level. Answer as you would out loud in a real interview.\n\n**Question 1:** ${bankQuestions[0].question}`
      : null;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/interview">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Exit
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-medium">Mock Interview</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {difficulty}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {bankQuestions.length > 0
                ? `${bankQuestions.length} questions`
                : `${maxQuestions} AI questions`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <InterviewChat
          sessionId={sessionId}
          systemPrompt={systemPrompt}
          openingMessage={openingMessage}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}

function buildInterviewerPrompt(config: {
  topicLabel: string;
  difficulty: string;
  mode: string;
  maxQuestions: number;
  bankQuestions: Array<{ question: string; keyPoints: string[] }>;
  hasBehavioral?: boolean;
}): string {
  const { topicLabel, difficulty, mode, maxQuestions, bankQuestions, hasBehavioral } =
    config;

  let prompt = `You are an experienced senior frontend engineer conducting a realistic mock technical interview.

Interview configuration:
- Topics: ${topicLabel}
- Target difficulty: ${difficulty}
- Planned questions: ${bankQuestions.length > 0 ? bankQuestions.length : maxQuestions}
`;

  if (bankQuestions.length > 0) {
    prompt += `\nWork through these questions in order, one at a time:\n`;
    bankQuestions.forEach((q, i) => {
      prompt += `${i + 1}. ${q.question}\n   Key points a strong answer covers: ${q.keyPoints.join("; ")}\n`;
    });
    if (mode === "mixed") {
      prompt += `\nYou may occasionally swap in or add one invented question if the conversation naturally leads there, but stay within the planned total.\n`;
    }
  } else {
    prompt += `\nInvent ${maxQuestions} realistic, specific interview questions on the topics above at the target difficulty. Ask them one at a time.\n`;
  }

  prompt += `
Rules:
- Ask exactly ONE question at a time, then wait for the candidate's answer.
- After each answer: give brief feedback (2-3 sentences — what was good, what was missed, using the key points as your rubric), then either ask ONE short follow-up or move on to the next question. At most one follow-up per question.
- Keep every message under 150 words. This is recall practice, not a lecture.
- Never answer a question for the candidate unless they explicitly give up on it.
- If an answer is vague, ask them to be specific rather than filling gaps yourself.
- After the final question — or if the candidate asks to stop — give an overall debrief: strengths, the top 3 gaps, and the specific topics they should study next.`;

  if (hasBehavioral) {
    prompt += `
- For behavioral questions, coach the STAR structure: a concrete Situation, the candidate's own Task, the specific Actions THEY took (watch for "we" hiding "I"), and a measurable Result. Call out hypothetical or generic answers — demand a real story. Flag rambling: a strong spoken answer runs about two minutes.`;
  }

  return prompt;
}
