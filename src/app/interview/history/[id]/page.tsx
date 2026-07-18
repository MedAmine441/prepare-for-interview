// src/app/interview/history/[id]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { interviewRepository, questionRepository } from "@/lib/db/repositories";
import { formatCategory } from "@/lib/utils/question-format";
import { createSessionId } from "@/types";
import type { Question, QuestionVerdict } from "@/types";

export const dynamic = "force-dynamic";

interface HistoryDetailProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewHistoryDetailPage({
  params,
}: HistoryDetailProps) {
  const { id } = await params;
  const session = await interviewRepository.findById(createSessionId(id));
  if (!session) {
    redirect("/interview/history");
  }

  const verdicts = session.analysis?.verdicts ?? [];
  const verdictQuestions = (
    await Promise.all(
      verdicts.map(async (v) => {
        const q = await questionRepository.findById(v.questionId);
        return q ? { question: q, verdict: v.verdict } : null;
      }),
    )
  ).filter((v): v is { question: Question; verdict: QuestionVerdict } => v !== null);

  const weakIds = verdictQuestions
    .filter((v) => v.verdict === "weak")
    .map((v) => v.question.id as string);

  const topics =
    session.config.categories.length > 0
      ? session.config.categories.map(formatCategory).join(", ")
      : "All topics";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/interview/history">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Past Sessions
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">{topics}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatDate(session.startedAt)}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {session.config.difficulty}
          </Badge>
          {session.status === "abandoned" && (
            <Badge variant="outline" className="text-xs">
              Abandoned
            </Badge>
          )}
        </div>
      </div>

      {/* Per-question verdicts */}
      {verdictQuestions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Question Performance
            </h2>
            {weakIds.length > 0 && (
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/flashcards/study?mode=practice&ids=${weakIds.join(",")}`}
                >
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Cram Weak Spots
                </Link>
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {verdictQuestions.map(({ question, verdict }) => (
              <Link
                key={question.id}
                href={`/questions/${question.id}`}
                className="block group"
              >
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <p className="text-sm truncate">{question.question}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize shrink-0 ${getVerdictColor(verdict)}`}
                    >
                      {verdict}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Debrief */}
      {session.notes && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Debrief
          </h2>
          <Card>
            <CardContent className="p-4">
              <MarkdownRenderer content={session.notes} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Transcript */}
      {session.messages.length > 0 && (
        <section>
          <details>
            <summary className="text-sm font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors mb-3">
              Transcript ({session.messages.length} messages)
            </summary>
            <div className="space-y-4 mt-4">
              {session.messages.map((message) => (
                <div key={message.id}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {message.role === "interviewer" ? "Interviewer" : "You"}
                  </p>
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      message.role === "interviewer"
                        ? "bg-muted"
                        : "bg-primary/5 border border-primary/10"
                    }`}
                  >
                    <MarkdownRenderer content={message.content} />
                  </div>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      {!session.notes && session.messages.length === 0 && (
        <>
          <Separator className="mb-6" />
          <p className="text-sm text-muted-foreground text-center py-8">
            Nothing was recorded for this session.
          </p>
        </>
      )}
    </div>
  );
}

function getVerdictColor(verdict: QuestionVerdict): string {
  switch (verdict) {
    case "weak":
      return "text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-900";
    case "ok":
      return "text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-900";
    case "strong":
      return "text-green-600 border-green-300 dark:text-green-400 dark:border-green-900";
    case "skipped":
      return "";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
