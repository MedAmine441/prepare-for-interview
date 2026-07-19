// src/app/interview/history/page.tsx

import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Repeat,
  Target,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { interviewRepository, questionRepository } from "@/lib/db/repositories";
import { computeWeakSpotTrends } from "@/lib/utils/interview-trends";
import { formatCategory, getCategoryEmoji } from "@/lib/utils/question-format";
import { createQuestionId } from "@/types";

export const dynamic = "force-dynamic";

export default async function InterviewHistoryPage() {
  const sessions = await interviewRepository.getRecent(50);

  // Cross-session weak-spot trends (archived questions still count)
  const questions = await questionRepository.findAll({ includeArchived: true });
  const questionById = new Map(questions.map((q) => [q.id as string, q]));
  const trends = computeWeakSpotTrends(
    sessions,
    (id) => questionById.get(id)?.category ?? null,
  );
  const weakCategories = trends.categories.filter((c) => c.sessionsWeak > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link href="/interview">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Mock Interview
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Past Sessions</h1>
        <p className="text-muted-foreground">
          Every finished interview keeps its transcript, debrief, and weak spots.
        </p>
      </div>

      {/* Trends only become meaningful with a few analyzed interviews */}
      {trends.analyzedSessions >= 2 && weakCategories.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <div className="h-0.5 bg-brand-gradient" aria-hidden />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                Weak-Spot Trends
                <span className="text-xs font-normal text-muted-foreground">
                  last {trends.analyzedSessions} interviews
                </span>
              </CardTitle>
              {trends.allWeakIds.length > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/flashcards/study?mode=practice&ids=${trends.allWeakIds.join(",")}`}
                  >
                    <Target className="w-3.5 h-3.5 mr-1.5" />
                    Cram All Weak Spots ({trends.allWeakIds.length})
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakCategories.slice(0, 5).map((trend) => {
              const total = trend.weakCount + trend.okCount + trend.strongCount;
              return (
                <div key={trend.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>
                      {getCategoryEmoji(trend.category)}{" "}
                      {formatCategory(trend.category)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      weak in{" "}
                      <span className="font-mono tabular-nums text-orange-600 dark:text-orange-400">
                        {trend.sessionsWeak} of {trend.sessionsAppeared}
                      </span>{" "}
                      interview{trend.sessionsAppeared > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                    <div
                      className="bg-orange-500/80"
                      style={{ width: `${(trend.weakCount / total) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500/60"
                      style={{ width: `${(trend.okCount / total) * 100}%` }}
                    />
                    <div
                      className="bg-green-500/60"
                      style={{ width: `${(trend.strongCount / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {trends.recurringWeak.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  <Repeat className="w-3 h-3 inline mr-1 -mt-0.5" />
                  Keeps coming back weak
                </p>
                <ul className="space-y-1">
                  {trends.recurringWeak.slice(0, 3).map(({ questionId, weakSessions }) => {
                    const question = questionById.get(questionId);
                    if (!question) return null;
                    return (
                      <li key={questionId} className="text-sm truncate">
                        <span className="font-mono tabular-nums text-xs text-orange-600 dark:text-orange-400 mr-2">
                          {weakSessions}×
                        </span>
                        <Link
                          href={`/questions/${questionId}`}
                          className="hover:underline"
                        >
                          {question.question}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No interviews yet. Your finished sessions will show up here.
          </p>
          <Button asChild>
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const weakCount =
              session.analysis?.verdicts.filter((v) => v.verdict === "weak")
                .length ?? 0;
            const topics =
              session.config.categories.length > 0
                ? session.config.categories.map(formatCategory).join(", ")
                : "All topics";
            return (
              <Link
                key={session.id}
                href={`/interview/history/${session.id}`}
                className="block group"
              >
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate mb-1">
                          {topics}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.startedAt)} ·{" "}
                          {session.questionsAsked.length > 0
                            ? `${session.questionsAsked.length} questions`
                            : "AI questions"}{" "}
                          · <span className="capitalize">{session.config.difficulty}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {session.status === "abandoned" ? (
                          <Badge variant="outline" className="text-xs">
                            Abandoned
                          </Badge>
                        ) : weakCount > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-900"
                          >
                            <Target className="w-3 h-3 mr-1" />
                            {weakCount} weak
                          </Badge>
                        ) : session.analysis ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-300 dark:text-green-400 dark:border-green-900"
                          >
                            No gaps
                          </Badge>
                        ) : null}
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
