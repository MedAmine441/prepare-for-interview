// src/app/flashcards/page.tsx

import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock, TrendingUp, Plus } from "lucide-react";
import { CATEGORY_METADATA } from "@/lib/constants/categories";

export default function FlashcardsPage() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        {/* Study Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/flashcards/study"
            className="group p-6 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Study Due Cards</h2>
                <p className="text-muted-foreground mb-4">
                  Review cards that are due for spaced repetition
                </p>
                <Suspense
                  fallback={
                    <div className="text-sm text-muted-foreground">
                      Loading...
                    </div>
                  }
                >
                  <DueCardsSummary />
                </Suspense>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Link>

          <Link
            href="/flashcards/new"
            className="group p-6 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Add New Question</h2>
                <p className="text-muted-foreground mb-4">
                  Create a custom flashcard with your own question
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Plus className="w-4 h-4" />
                    Create your own
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Link>
        </div>

        {/* Categories Grid */}
        <h2 className="text-2xl font-bold mb-6">Study by Category</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(CATEGORY_METADATA).map((category) => (
            <Link
              key={category.slug}
              href={`/flashcards/${category.slug}`}
              className="group p-5 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center shrink-0`}
                >
                  <span className="text-white text-xl">
                    {getCategoryEmoji(category.slug)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function DueCardsSummary() {
  // This would fetch actual data from the database
  // For now, showing placeholder
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1 text-orange-600">
        <Clock className="w-4 h-4" />0 cards due
      </span>
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
