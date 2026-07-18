// src/app/page.tsx

import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  Library,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getFlashcardsOverview } from "@/actions/flashcard.actions";
import { getInterviewDate } from "@/actions/settings.actions";
import { InterviewCountdown } from "@/components/home/InterviewCountdown";
import { ALL_CATEGORIES } from "@/lib/constants/categories";
import { getCategoryEmoji } from "@/lib/utils/question-format";

// Always read fresh study stats from the database
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await getFlashcardsOverview();
  const overview = result.success ? result.data : null;
  const interviewDate = await getInterviewDate();

  const dueTotal = overview ? overview.dueCount + overview.newCount : 0;
  const categoryStats = new Map(
    overview?.categories.map((c) => [c.slug, c]) ?? [],
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Hero */}
      <section className="relative text-center mb-16 pt-6 pb-2">
        <div className="absolute -inset-x-8 -top-12 bottom-0 -z-10 bg-dots" aria-hidden />
        <p className="font-mono text-xs text-primary tracking-widest mb-5">
          {"<frontmaster />"} — spaced repetition for engineers
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Master Frontend <span className="text-gradient">Interviews</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Study with spaced repetition flashcards. Practice with AI mock interviews.
          Build real confidence.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg" className="shadow-lg shadow-primary/25">
            <Link href="/flashcards/study">
              <BookOpen className="w-4 h-4 mr-2" />
              {dueTotal > 0 ? `Study Now (${dueTotal} waiting)` : "Start Studying"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/interview">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mock Interview
            </Link>
          </Button>
        </div>
      </section>

      {/* Interview countdown & pacing */}
      <InterviewCountdown
        interviewDate={interviewDate}
        newCount={overview?.newCount ?? 0}
        dueCount={overview?.dueCount ?? 0}
      />

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-4 mb-16">
        <FeatureCard
          icon={<BookOpen className="w-5 h-5" />}
          title="Spaced Repetition"
          description="SM-2 algorithm optimizes review intervals for long-term retention."
        />
        <FeatureCard
          icon={<MessageSquare className="w-5 h-5" />}
          title="AI Interviews"
          description="Practice with an AI that asks follow-ups and gives feedback."
        />
        <FeatureCard
          icon={<Library className="w-5 h-5" />}
          title="Curated Questions"
          description="High-quality questions across React, JS, CSS, and more."
        />
      </section>

      <Separator className="mb-16" />

      {/* Stats */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold mb-6">Your Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Library className="w-4 h-4" />}
            value={String(overview?.totalStudied ?? 0)}
            label="Studied"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            value={String(overview?.totalMastered ?? 0)}
            label="Mastered"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            value={String(overview?.dueCount ?? 0)}
            label="Due Today"
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            value={String(overview?.streakDays ?? 0)}
            label="Day Streak"
          />
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Topics</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/questions">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_CATEGORIES.map((category) => {
            const stats = categoryStats.get(category.slug);
            return (
              <Link
                key={category.slug}
                href={`/flashcards/${category.slug}`}
                className="group"
              >
                <Card className="h-full transition-colors hover:bg-secondary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md ${category.color} flex items-center justify-center text-white text-sm shrink-0`}>
                        {getCategoryEmoji(category.slug)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.total ?? 0} question{(stats?.total ?? 0) !== 1 ? "s" : ""}
                          {stats && stats.due > 0 && (
                            <span className="text-orange-600 dark:text-orange-400">
                              {" "}· {stats.due} due
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="w-9 h-9 rounded-md bg-accent text-accent-foreground flex items-center justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-semibold font-mono tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
