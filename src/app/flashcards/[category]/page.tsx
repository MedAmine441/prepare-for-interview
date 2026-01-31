// src/app/flashcards/[category]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
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

  // Validate category exists
  const categoryMeta = CATEGORY_METADATA[category as QuestionCategory];
  if (!categoryMeta) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sub-header with breadcrumb and category info */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link
              href="/flashcards"
              className="text-muted-foreground hover:text-foreground"
            >
              Flashcards
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{categoryMeta.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${categoryMeta.color} flex items-center justify-center`}
            >
              <span className="text-white text-sm">
                {getCategoryEmoji(category)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {categoryMeta.description}
            </p>
          </div>
        </div>
      </div>

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
