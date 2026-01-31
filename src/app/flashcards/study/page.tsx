// src/app/flashcards/study/page.tsx

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FlashcardArena } from "@/components/flashcard/FlashcardArena";
import { CategoryFilter } from "@/components/shared/CategoryFilter";
import { DifficultyFilter } from "@/components/shared/DifficultyFilter";
import type { QuestionCategory, Difficulty } from "@/types";

export default function StudyDueCardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = (searchParams.get("category") || "all") as
    | QuestionCategory
    | "all";
  const difficulty = (searchParams.get("difficulty") || "all") as
    | Difficulty
    | "all";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/flashcards/study?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sub-header with breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link
              href="/flashcards"
              className="text-muted-foreground hover:text-foreground"
            >
              Flashcards
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Study Due Cards</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              Filter by:
            </span>
            <CategoryFilter
              value={category}
              onChange={(val) => updateParams("category", val)}
            />
            <DifficultyFilter
              value={difficulty}
              onChange={(val) => updateParams("difficulty", val)}
            />
          </div>
        </div>
      </div>

      {/* Flashcard Arena */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <FlashcardArena
          category={category === "all" ? undefined : category}
          difficulty={difficulty === "all" ? undefined : difficulty}
        />
      </main>
    </div>
  );
}
