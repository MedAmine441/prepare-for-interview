// src/app/interview/history/page.tsx

import Link from "next/link";
import { ArrowLeft, ChevronRight, MessageSquare, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { interviewRepository } from "@/lib/db/repositories";
import { formatCategory } from "@/lib/utils/question-format";

export const dynamic = "force-dynamic";

export default async function InterviewHistoryPage() {
  const sessions = await interviewRepository.getRecent(50);

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
