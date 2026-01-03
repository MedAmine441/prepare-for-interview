// src/components/flashcard/FlashcardArena.tsx

"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import type { QuestionCategory, Question, SM2Quality } from "@/types";
import { QUALITY_BUTTONS } from "@/types";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { getNextStudyCard, answerFlashcard } from "@/actions/flashcard.actions";

interface FlashcardArenaProps {
  category: QuestionCategory;
}

export function FlashcardArena({ category }: FlashcardArenaProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState<{
    question: Question;
    isNew: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Load initial card
  useEffect(() => {
    loadNextCard();
  }, [category]);

  const loadNextCard = async () => {
    setIsLoading(true);
    setError(null);
    setIsFlipped(false);

    try {
      const result = await getNextStudyCard(category);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setSessionComplete(true);
        return;
      }

      setCurrentCard({
        question: result.data.question,
        isNew: result.data.isNew,
      });
      setStartTime(Date.now());
      setCardCount((prev) => prev + 1);
    } catch (err) {
      setError("Failed to load card. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (quality: SM2Quality) => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const responseTime = Date.now() - startTime;
      const formData = new FormData();
      formData.append("questionId", currentCard.question.id);
      formData.append("quality", quality.toString());
      formData.append("responseTimeMs", responseTime.toString());
      formData.append("wasRevealed", isFlipped.toString());

      const result = await answerFlashcard(formData);

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Load next card
      await loadNextCard();
    } catch (err) {
      setError("Failed to save answer. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setSessionComplete(false);
    setCardCount(0);
    loadNextCard();
  };

  if (isLoading && !currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your study session...</p>
        </div>
      </div>
    );
  }

  if (error && !currentCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Error Loading Cards</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <button
          onClick={loadNextCard}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Session Complete!</h2>
        <p className="text-muted-foreground mb-6">
          You&apos;ve reviewed all available cards in this category. Great work!
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Study Again
          </button>
          <a
            href="/flashcards"
            className="px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
          >
            Choose Another Category
          </a>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <RotateCcw className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Cards Available</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          There are no cards to study in this category right now.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Card {cardCount}</span>
          <span
            className={currentCard.isNew ? "text-green-600 font-medium" : ""}
          >
            {currentCard.isNew ? "New Card" : "Review"}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Flashcard Wrapper */}
      {/* Flashcard */}
      <div
        className={`flashcard w-full max-w-2xl mx-auto relative ${
          isSubmitting ? "pointer-events-none opacity-50" : "cursor-pointer"
        } ${isFlipped ? "flipped" : ""}`}
        onClick={isSubmitting ? undefined : handleFlip}
      >
        <div className="flashcard-inner">
          {/* Front - Question */}
          <div className="flashcard-front p-8 rounded-xl border bg-card shadow-sm flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getDifficultyClass(
                  currentCard.question.difficulty
                )}`}
              >
                {currentCard.question.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">
                Click to reveal
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-xl font-medium leading-relaxed text-center">
                {currentCard.question.question}
              </h2>
            </div>
            <div className="mt-4 flex justify-center shrink-0">
              <Eye className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Back - Answer */}
          <div className="flashcard-back p-8 rounded-xl border bg-card shadow-sm flex flex-col min-h-[450px] max-h-[70vh]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <span className="text-sm font-medium">Answer</span>
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer content={currentCard.question.answer || ""} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons - Only show when flipped */}
      {isFlipped && !isSubmitting && (
        <div className="mt-6 flex justify-center gap-3">
          <RatingButton
            label="Again"
            sublabel="Soon"
            onClick={() => handleRating(QUALITY_BUTTONS.AGAIN)}
            variant="again"
          />
          <RatingButton
            label="Hard"
            sublabel="1d"
            onClick={() => handleRating(QUALITY_BUTTONS.HARD)}
            variant="hard"
          />
          <RatingButton
            label="Good"
            sublabel="3d"
            onClick={() => handleRating(QUALITY_BUTTONS.GOOD)}
            variant="good"
          />
          <RatingButton
            label="Easy"
            sublabel="7d"
            onClick={() => handleRating(QUALITY_BUTTONS.EASY)}
            variant="easy"
          />
        </div>
      )}

      {isSubmitting && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface RatingButtonProps {
  label: string;
  sublabel: string;
  onClick: () => void;
  variant: "again" | "hard" | "good" | "easy";
}

function RatingButton({
  label,
  sublabel,
  onClick,
  variant,
}: RatingButtonProps) {
  const variantClasses = {
    again: "bg-red-500 hover:bg-red-600",
    hard: "bg-orange-500 hover:bg-orange-600",
    good: "bg-green-500 hover:bg-green-600",
    easy: "bg-blue-500 hover:bg-blue-600",
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${variantClasses[variant]}`}
    >
      <div>{label}</div>
      <div className="text-xs opacity-80">{sublabel}</div>
    </button>
  );
}

function getDifficultyClass(difficulty?: string): string {
  switch (difficulty) {
    case "junior":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "mid":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "senior":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
