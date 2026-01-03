// src/components/flashcard/FlashcardArena.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import {
  RotateCcw,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  BookOpen,
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

  // Ref to help smooth height transitions if needed
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!isSubmitting) {
      setIsFlipped(!isFlipped);
    }
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

  // --- States for Loading/Error/Complete (Keep your existing ones) ---
  if (isLoading && !currentCard)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error && !currentCard)
    return (
      <div className="text-center p-20 text-red-500">
        {error}{" "}
        <button onClick={loadNextCard} className="block mx-auto mt-4 underline">
          Retry
        </button>
      </div>
    );
  if (sessionComplete)
    return (
      <div className="text-center p-20">
        <h2 className="text-xl font-bold mb-4">Session Complete! 🎉</h2>
        <button
          onClick={handleRestart}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Study Again
        </button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono bg-muted px-2 py-1 rounded">
            Card #{cardCount}
          </span>
          {currentCard?.isNew && (
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100">
              <Sparkles className="w-3 h-3" /> New
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {isFlipped ? "Rate your recall" : "Tap card to flip"}
        </div>
      </div>

      {/* THE MAIN CARD CONTAINER 
         We toggle classes to control layout flow.
      */}
      <div
        className="flashcard-container relative w-full group cursor-pointer"
        onClick={handleFlip}
        ref={containerRef}
      >
        <div
          className={`flashcard-inner duration-500 rounded-xl shadow-lg border bg-card ${
            isFlipped ? "flipped" : ""
          }`}
        >
          {/* --- FRONT (QUESTION) --- */}
          {/* If flipped, we make this absolute so it doesn't push the height. 
              If NOT flipped, it is relative so it DEFINES the height. */}
          <div
            className={`flashcard-front p-8 md:p-12 flex flex-col justify-between
            ${
              isFlipped
                ? "absolute inset-0 overflow-hidden"
                : "relative min-h-[300px]"
            }`}
          >
            <div className="flex items-center justify-between mb-8">
              <span
                className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold ${getDifficultyClass(
                  currentCard?.question.difficulty
                )}`}
              >
                {currentCard?.question.difficulty}
              </span>
              <Eye className="w-5 h-5 text-muted-foreground opacity-20" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <h2 className="text-2xl md:text-3xl font-medium leading-relaxed text-foreground text-balance">
                {currentCard?.question.question}
              </h2>
            </div>

            <div className="mt-8 text-center">
              <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest">
                Click to Reveal
              </span>
            </div>
          </div>

          {/* --- BACK (ANSWER) --- */}
          {/* Opposite logic: Relative when flipped (so it grows), Absolute when hidden. */}
          <div
            className={`flashcard-back flex flex-col bg-slate-50 dark:bg-slate-900/50 
            ${
              isFlipped
                ? "relative min-h-[300px]"
                : "absolute inset-0 overflow-hidden"
            }`}
          >
            <div className="flex items-center justify-between p-6 border-b bg-card rounded-t-xl shrink-0">
              <div className="flex items-center gap-2 text-primary font-medium">
                <BookOpen className="w-4 h-4" />
                <span>Answer</span>
              </div>
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Content expands naturally */}
            <div className="flex-1 p-8 md:p-10 text-left">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <MarkdownRenderer
                  content={currentCard?.question.answer || ""}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      <div
        className={`mt-8 transition-all duration-500 transform ${
          isFlipped
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {!isSubmitting ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RatingButton
              label="Again"
              sublabel="< 1m"
              onClick={() => handleRating(QUALITY_BUTTONS.AGAIN)}
              variant="again"
            />
            <RatingButton
              label="Hard"
              sublabel="2d"
              onClick={() => handleRating(QUALITY_BUTTONS.HARD)}
              variant="hard"
            />
            <RatingButton
              label="Good"
              sublabel="4d"
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
        ) : (
          <div className="flex justify-center p-4 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...
          </div>
        )}
      </div>
    </div>
  );
}

// ... RatingButton and helper functions (Keep existing) ...
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
  const variantStyles = {
    again:
      "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    hard: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    good: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    easy: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm ${variantStyles[variant]}`}
    >
      <span className="font-bold text-lg">{label}</span>
      <span className="text-xs opacity-70 font-medium uppercase tracking-wide">
        {sublabel}
      </span>
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
