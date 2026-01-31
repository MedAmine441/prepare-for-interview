// src/components/flashcard/FlashcardArena.tsx

"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Loader2, Sparkles } from "lucide-react";
import type { QuestionCategory, Question, SM2Quality, Difficulty } from "@/types";
import { QUALITY_BUTTONS } from "@/types";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { getNextStudyCard, answerFlashcard } from "@/actions/flashcard.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FlashcardArenaProps {
  category?: QuestionCategory;
  difficulty?: Difficulty;
}

export function FlashcardArena({ category, difficulty }: FlashcardArenaProps) {
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

  useEffect(() => {
    loadNextCard();
  }, [category, difficulty]);

  const loadNextCard = async () => {
    setIsLoading(true);
    setError(null);
    setIsFlipped(false);

    try {
      const result = await getNextStudyCard(category, difficulty);

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

  // Loading state
  if (isLoading && !currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Error state
  if (error && !currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={loadNextCard}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Session complete
  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="text-xl">🎉</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">Session Complete</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {cardCount > 0
            ? `You studied ${cardCount} card${cardCount > 1 ? "s" : ""}.`
            : "No cards due for review."}
        </p>
        <Button onClick={handleRestart}>Study Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            #{cardCount}
          </Badge>
          {currentCard?.isNew && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              New
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isFlipped ? "Rate your recall" : "Click to reveal"}
        </p>
      </div>

      {/* Card */}
      <div className="flashcard-container cursor-pointer mb-6" onClick={handleFlip}>
        <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Front */}
          <Card
            className={`flashcard-front ${
              isFlipped ? "absolute inset-0 overflow-hidden" : "relative min-h-[280px]"
            }`}
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <Badge
                  variant="outline"
                  className={`text-xs ${getDifficultyColor(currentCard?.question.difficulty)}`}
                >
                  {currentCard?.question.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {formatCategory(currentCard?.question.category || "")}
                </Badge>
              </div>

              <div className="flex-1 flex items-center justify-center py-8">
                <h2 className="text-xl font-medium text-center leading-relaxed">
                  {currentCard?.question.question}
                </h2>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Click to reveal answer
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className={`flashcard-back ${
              isFlipped ? "relative min-h-[280px]" : "absolute inset-0 overflow-hidden"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Answer</span>
                <Badge variant="secondary" className="text-xs">
                  {formatCategory(currentCard?.question.category || "")}
                </Badge>
              </div>
              <Separator className="mb-4" />
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={currentCard?.question.answer || ""} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rating Buttons */}
      <div
        className={`transition-all duration-300 ${
          isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {!isSubmitting ? (
          <div className="grid grid-cols-4 gap-2">
            <RatingButton
              label="Again"
              sublabel="<1m"
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
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Saving...</span>
          </div>
        )}
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

function RatingButton({ label, sublabel, onClick, variant }: RatingButtonProps) {
  const variantStyles = {
    again: "hover:bg-red-50 hover:border-red-200 hover:text-red-700",
    hard: "hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700",
    good: "hover:bg-green-50 hover:border-green-200 hover:text-green-700",
    easy: "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex flex-col items-center justify-center py-3 rounded-md border bg-card transition-colors ${variantStyles[variant]}`}
    >
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs text-muted-foreground">{sublabel}</span>
    </button>
  );
}

function formatCategory(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getDifficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case "junior":
      return "text-green-600 border-green-200";
    case "mid":
      return "text-yellow-600 border-yellow-200";
    case "senior":
      return "text-red-600 border-red-200";
    default:
      return "";
  }
}
