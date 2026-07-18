// src/app/flashcards/study/page.tsx

"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { FlashcardArena, type StudyMode } from "@/components/flashcard/FlashcardArena";
import { StudyModeToggle } from "@/components/flashcard/StudyModeToggle";
import { CategoryFilter } from "@/components/shared/CategoryFilter";
import { DifficultyFilter } from "@/components/shared/DifficultyFilter";
import type { QuestionCategory, Difficulty } from "@/types";

export default function StudyDueCardsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StudyPageContent />
    </Suspense>
  );
}

function StudyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = (searchParams.get("category") || "all") as QuestionCategory | "all";
  const difficulty = (searchParams.get("difficulty") || "all") as Difficulty | "all";
  const mode: StudyMode = searchParams.get("mode") === "practice" ? "practice" : "review";
  // Optional cram list, e.g. the weak spots handed over by a mock interview
  const idsParam = searchParams.get("ids");
  const questionIds = useMemo(
    () => (idsParam ? idsParam.split(",").filter(Boolean) : undefined),
    [idsParam],
  );

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
            <StudyModeToggle />
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
          mode={mode}
          questionIds={questionIds}
        />
      </div>
    </div>
  );
}
