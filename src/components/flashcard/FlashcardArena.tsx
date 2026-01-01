// src/components/flashcard/FlashcardArena.tsx

"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import type { QuestionCategory, Question, SM2Quality } from "@/types";
import { QUALITY_BUTTONS } from "@/types";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

interface FlashcardArenaProps {
  category: QuestionCategory;
}

export function FlashcardArena({ category }: FlashcardArenaProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Fetch questions from database
  useEffect(() => {
    // Simulated loading
    setIsLoading(false);
    setQuestions([]);
  }, [category]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = (quality: SM2Quality) => {
    // TODO: Update SM-2 state and move to next card
    console.log("Rating:", quality);
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const currentQuestion = questions[currentIndex];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <RotateCcw className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Cards to Study</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          There are no cards due for review in this category. Check back later
          or try another category.
        </p>
      </div>
    );
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Session Complete!</h2>
        <p className="text-muted-foreground mb-6">
          You&apos;ve reviewed all {questions.length} cards in this session.
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Study Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>
            Card {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {Math.round((currentIndex / questions.length) * 100)}% complete
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentIndex / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className={`flashcard min-h-[400px] cursor-pointer ${
          isFlipped ? "flipped" : ""
        }`}
        onClick={handleFlip}
      >
        <div className="flashcard-inner">
          {/* Front - Question */}
          <div className="flashcard-front p-8 rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getDifficultyClass(
                  currentQuestion?.difficulty
                )}`}
              >
                {currentQuestion?.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">
                Click to reveal answer
              </span>
            </div>
            <h2 className="text-xl font-medium leading-relaxed">
              {currentQuestion?.question}
            </h2>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Eye className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Back - Answer */}
          <div className="flashcard-back p-8 rounded-xl border bg-card shadow-sm overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Answer</span>
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer content={currentQuestion?.answer || ""} />
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons - Only show when flipped */}
      {isFlipped && (
        <div className="mt-6 flex justify-center gap-3">
          <RatingButton
            label="Again"
            sublabel="<1min"
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

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(currentIndex + 1);
          }}
          className="px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() =>
            setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))
          }
          disabled={currentIndex === questions.length - 1}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
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
