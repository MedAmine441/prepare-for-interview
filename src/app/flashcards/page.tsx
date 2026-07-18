// src/app/flashcards/page.tsx

import Link from "next/link";
import { ArrowRight, Plus, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_METADATA } from "@/lib/constants/categories";
import { getFlashcardsOverview } from "@/actions/flashcard.actions";
import { getCategoryEmoji } from "@/lib/utils/question-format";

// Always read fresh study stats from the database
export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const result = await getFlashcardsOverview();
  const overview = result.success ? result.data : null;
  const categoryStats = new Map(
    overview?.categories.map((c) => [c.slug, c]) ?? [],
  );
  const dueTotal = overview ? overview.dueCount + overview.newCount : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Flashcards</h1>
        <p className="text-muted-foreground">
          Study with spaced repetition to maximize retention.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link href="/flashcards/study" className="group">
          <Card className="h-full transition-colors hover:bg-secondary/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">Study Due Cards</CardTitle>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <CardDescription>Review what&apos;s scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {dueTotal > 0 ? (
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {overview!.dueCount} due · {overview!.newCount} new
                  </span>
                ) : (
                  <span className="text-muted-foreground">All caught up</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/flashcards/study?mode=practice" className="group">
          <Card className="h-full transition-colors hover:bg-secondary/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">Practice All</CardTitle>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <CardDescription>Cram every card, shuffled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {overview?.totalQuestions ?? 0} cards · schedule untouched
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/flashcards/new" className="group">
          <Card className="h-full transition-colors hover:bg-secondary/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">Add Question</CardTitle>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
              <CardDescription>Create a custom flashcard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Add your own questions</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Separator className="mb-8" />

      {/* Categories */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">Study by Topic</h2>
        <p className="text-sm text-muted-foreground">Choose a category to focus on</p>
      </div>

      <div className="grid gap-3">
        {Object.values(CATEGORY_METADATA).map((category) => {
          const stats = categoryStats.get(category.slug);
          return (
            <Link key={category.slug} href={`/flashcards/${category.slug}`} className="group">
              <Card className="transition-colors hover:bg-secondary/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-md ${category.color} flex items-center justify-center text-white shrink-0`}>
                      {getCategoryEmoji(category.slug)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {stats && stats.due > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-900"
                        >
                          {stats.due} due
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {stats?.studied ?? 0}/{stats?.total ?? 0} studied
                      </span>
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
