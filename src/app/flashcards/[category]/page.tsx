// src/app/flashcards/[category]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CATEGORY_METADATA } from "@/lib/constants/categories";
import type { QuestionCategory } from "@/types";
import { FlashcardArena } from "@/components/flashcard/FlashcardArena";
import { Badge } from "@/components/ui/badge";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryFlashcardsPage({ params }: CategoryPageProps) {
  const { category } = await params;

  const categoryMeta = CATEGORY_METADATA[category as QuestionCategory];
  if (!categoryMeta) {
    notFound();
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/flashcards" className="hover:text-foreground transition-colors">
              Flashcards
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{categoryMeta.name}</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-md ${categoryMeta.color} flex items-center justify-center text-white`}>
              {getCategoryEmoji(category)}
            </div>
            <div>
              <h1 className="font-semibold">{categoryMeta.name}</h1>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {categoryMeta.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 py-8">
        <FlashcardArena category={category as QuestionCategory} />
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

export function generateStaticParams() {
  return Object.keys(CATEGORY_METADATA).map((category) => ({
    category,
  }));
}
