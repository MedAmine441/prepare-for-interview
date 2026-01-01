// src/app/flashcards/[category]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { CATEGORY_METADATA } from "@/lib/constants/categories";
import type { QuestionCategory } from "@/types";
import { FlashcardArena } from "@/components/flashcard/FlashcardArena";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryFlashcardsPage({
  params,
}: CategoryPageProps) {
  const { category } = await params;
  console.log("CATEGORY:", category);

  // Validate category exists
  const categoryMeta = CATEGORY_METADATA[category as QuestionCategory];
  console.log("categoryMeta:", categoryMeta);
  if (!categoryMeta) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/flashcards"
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${categoryMeta.color} flex items-center justify-center`}
              >
                <span className="text-white text-lg">
                  {getCategoryEmoji(category)}
                </span>
              </div>
              <div>
                <h1 className="font-semibold">{categoryMeta.name}</h1>
                <p className="text-sm text-muted-foreground">Flashcard Study</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Flashcard Arena */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <FlashcardArena category={category as QuestionCategory} />
      </main>
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

// Generate static params for all categories
export function generateStaticParams() {
  
  return Object.keys(CATEGORY_METADATA).map((category) => ({
    category,
  }));
}
