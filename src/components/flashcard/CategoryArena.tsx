// src/components/flashcard/CategoryArena.tsx

"use client";

import { useSearchParams } from "next/navigation";
import type { QuestionCategory } from "@/types";
import { FlashcardArena, type StudyMode } from "./FlashcardArena";
import { StudyModeToggle } from "./StudyModeToggle";

/**
 * Client wrapper for the category study page: reads the study mode
 * from the URL and renders the mode toggle above the arena.
 */
export function CategoryArena({ category }: { category: QuestionCategory }) {
  const searchParams = useSearchParams();
  const mode: StudyMode =
    searchParams.get("mode") === "practice" ? "practice" : "review";

  return (
    <>
      <div className="flex justify-center mb-6">
        <StudyModeToggle />
      </div>
      <FlashcardArena category={category} mode={mode} />
    </>
  );
}
