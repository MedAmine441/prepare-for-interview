// src/app/flashcards/page.tsx

import Link from "next/link";
import { ArrowRight, Plus, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_METADATA } from "@/lib/constants/categories";

export default function FlashcardsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Flashcards</h1>
        <p className="text-muted-foreground">
          Study with spaced repetition to maximize retention.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link href="/flashcards/study" className="group">
          <Card className="h-full transition-colors hover:bg-secondary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Study Due Cards</CardTitle>
                  <CardDescription className="mt-1">
                    Review cards scheduled for today
                  </CardDescription>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>0 cards due</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/flashcards/new" className="group">
          <Card className="h-full transition-colors hover:bg-secondary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Add Question</CardTitle>
                  <CardDescription className="mt-1">
                    Create a custom flashcard
                  </CardDescription>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
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
        {Object.values(CATEGORY_METADATA).map((category) => (
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
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getCategoryEmoji(slug: string): string {
  const emojiMap: Record<string, string> = {
    "system-design": "🏗️",
    "caching-memoization": "💾",
    "bundle-tree-shaking": "📦",
    "security-auth": "🔒",
    "feature-flags": "🚩",
    "css-layout": "🎨",
    "js-event-loop": "🔄",
    accessibility: "♿",
    "react-internals": "⚛️",
  };
  return emojiMap[slug] || "📚";
}
