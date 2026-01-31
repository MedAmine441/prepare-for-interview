// src/app/flashcards/study/page.tsx

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FlashcardArena } from "@/components/flashcard/FlashcardArena";
import { CategoryFilter } from "@/components/shared/CategoryFilter";
import { DifficultyFilter } from "@/components/shared/DifficultyFilter";
import { Separator } from "@/components/ui/separator";
import type { QuestionCategory, Difficulty } from "@/types";

export default function StudyDueCardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = (searchParams.get("category") || "all") as QuestionCategory | "all";
  const difficulty = (searchParams.get("difficulty") || "all") as Difficulty | "all";

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
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Breadcrumb & Filters */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/flashcards" className="hover:text-foreground transition-colors">
              Flashcards
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Study</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Filter:</span>
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

      {/* Arena */}
      <div className="flex-1 py-8">
        <FlashcardArena
          category={category === "all" ? undefined : category}
          difficulty={difficulty === "all" ? undefined : difficulty}
        />
      </div>
    </div>
  );
}
