// src/components/flashcard/FlashcardArena.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type {
  QuestionCategory,
  Question,
  SM2Quality,
  Difficulty,
} from "@/types";
import { QUALITY_BUTTONS } from "@/types";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  getNextStudyCard,
  answerFlashcard,
  getStudySessionStats,
} from "@/actions/flashcard.actions";
import { getQuestions } from "@/actions/question.actions";
import {
  formatCategory,
  getDifficultyColor,
} from "@/lib/utils/question-format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type StudyMode = "review" | "practice";

interface FlashcardArenaProps {
  category?: QuestionCategory;
  difficulty?: Difficulty;
  /**
   * review  — SM-2 scheduled study; ratings update the schedule.
   * practice — cram through every matching card, shuffled; the
   *            schedule is never touched. Good right before an interview.
   */
  mode?: StudyMode;
}

interface RatingTally {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

const EMPTY_TALLY: RatingTally = { again: 0, hard: 0, good: 0, easy: 0 };

export function FlashcardArena({
  category,
  difficulty,
  mode = "review",
}: FlashcardArenaProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullAnswer, setShowFullAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [tally, setTally] = useState<RatingTally>(EMPTY_TALLY);

  // Review mode state
  const [currentCard, setCurrentCard] = useState<{
    question: Question;
    isNew: boolean;
    intervalPreviews: Record<SM2Quality, string> | null;
  } | null>(null);
  const [remaining, setRemaining] = useState<{
    review: number;
    new: number;
  } | null>(null);

  // Practice mode state
  const [deck, setDeck] = useState<Question[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);

  const question =
    mode === "practice" ? deck[deckIndex] ?? null : currentCard?.question ?? null;

  const loadNextReviewCard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsFlipped(false);
    setShowFullAnswer(false);

    try {
      const [result, stats] = await Promise.all([
        getNextStudyCard(category, difficulty),
        getStudySessionStats(category, difficulty),
      ]);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (stats.success) {
        setRemaining({
          review: stats.data.reviewCardsCount,
          new: stats.data.newCardsCount,
        });
      }

      if (!result.data) {
        setSessionComplete(true);
        return;
      }

      setCurrentCard({
        question: result.data.question,
        isNew: result.data.isNew,
        intervalPreviews: result.data.intervalPreviews,
      });
      setStartTime(Date.now());
      setCardCount((prev) => prev + 1);
    } catch (err) {
      setError("Failed to load card. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [category, difficulty]);

  const loadPracticeDeck = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsFlipped(false);
    setShowFullAnswer(false);

    try {
      const result = await getQuestions({
        categories: category ? [category] : undefined,
        difficulties: difficulty ? [difficulty] : undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.data.length === 0) {
        setSessionComplete(true);
        return;
      }

      setDeck(shuffle(result.data));
      setDeckIndex(0);
      setCardCount(1);
    } catch (err) {
      setError("Failed to load cards. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [category, difficulty]);

  useEffect(() => {
    setSessionComplete(false);
    setCardCount(0);
    setTally(EMPTY_TALLY);
    if (mode === "practice") {
      loadPracticeDeck();
    } else {
      loadNextReviewCard();
    }
  }, [mode, loadPracticeDeck, loadNextReviewCard]);

  const handleFlip = useCallback(() => {
    if (!isSubmitting && question) {
      setIsFlipped((f) => !f);
      setShowFullAnswer(false);
    }
  }, [isSubmitting, question]);

  const handleRating = useCallback(
    async (quality: SM2Quality) => {
      if (mode !== "review" || !currentCard || isSubmitting || !isFlipped) return;

      setIsSubmitting(true);

      try {
        const responseTime = Date.now() - startTime;
        const formData = new FormData();
        formData.append("questionId", currentCard.question.id);
        formData.append("quality", quality.toString());
        formData.append("responseTimeMs", responseTime.toString());
        formData.append("wasRevealed", "true");

        const result = await answerFlashcard(formData);

        if (!result.success) {
          setError(result.error);
          return;
        }

        setTally((t) => ({
          again: t.again + (quality === QUALITY_BUTTONS.AGAIN ? 1 : 0),
          hard: t.hard + (quality === QUALITY_BUTTONS.HARD ? 1 : 0),
          good: t.good + (quality === QUALITY_BUTTONS.GOOD ? 1 : 0),
          easy: t.easy + (quality === QUALITY_BUTTONS.EASY ? 1 : 0),
        }));

        await loadNextReviewCard();
      } catch (err) {
        setError("Failed to save answer. Please try again.");
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, currentCard, isSubmitting, isFlipped, startTime, loadNextReviewCard],
  );

  const handlePracticeNext = useCallback(() => {
    if (mode !== "practice" || !isFlipped) return;
    setIsFlipped(false);
    setShowFullAnswer(false);
    if (deckIndex + 1 >= deck.length) {
      setSessionComplete(true);
    } else {
      setDeckIndex((i) => i + 1);
      setCardCount((c) => c + 1);
    }
  }, [mode, isFlipped, deckIndex, deck.length]);

  const handlePracticeRepeat = useCallback(() => {
    if (mode !== "practice" || !isFlipped) return;
    setIsFlipped(false);
    setShowFullAnswer(false);
    // Move the current card to the end of the deck so it comes back
    setDeck((d) => [
      ...d.slice(0, deckIndex),
      ...d.slice(deckIndex + 1),
      d[deckIndex],
    ]);
    setCardCount((c) => c + 1);
  }, [mode, isFlipped, deckIndex]);

  const handleRestart = () => {
    setSessionComplete(false);
    setCardCount(0);
    setTally(EMPTY_TALLY);
    if (mode === "practice") {
      loadPracticeDeck();
    } else {
      loadNextReviewCard();
    }
  };

  // Keyboard shortcuts: Space = flip, 1-4 = rate, Enter/→ = next, R = repeat, A = full answer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (sessionComplete || isLoading || isSubmitting) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handleFlip();
          break;
        case "Enter":
          e.preventDefault();
          if (!isFlipped) handleFlip();
          else if (mode === "practice") handlePracticeNext();
          break;
        case "ArrowRight":
          if (mode === "practice" && isFlipped) {
            e.preventDefault();
            handlePracticeNext();
          }
          break;
        case "r":
        case "R":
          if (mode === "practice" && isFlipped) handlePracticeRepeat();
          break;
        case "a":
        case "A":
          if (isFlipped) setShowFullAnswer((s) => !s);
          break;
        case "1":
          handleRating(QUALITY_BUTTONS.AGAIN);
          break;
        case "2":
          handleRating(QUALITY_BUTTONS.HARD);
          break;
        case "3":
          handleRating(QUALITY_BUTTONS.GOOD);
          break;
        case "4":
          handleRating(QUALITY_BUTTONS.EASY);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    sessionComplete,
    isLoading,
    isSubmitting,
    isFlipped,
    mode,
    handleFlip,
    handleRating,
    handlePracticeNext,
    handlePracticeRepeat,
  ]);

  // Loading state
  if (isLoading && !question) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Error state
  if (error && !question) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={mode === "practice" ? loadPracticeDeck : loadNextReviewCard}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Session complete
  if (sessionComplete) {
    const totalRated = tally.again + tally.hard + tally.good + tally.easy;
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center px-4">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
          <span className="text-xl">🎉</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">
          {cardCount > 0 ? "Session Complete" : "All Caught Up"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {cardCount > 0
            ? `You went through ${cardCount} card${cardCount > 1 ? "s" : ""}.`
            : mode === "review"
              ? "No cards due right now. Try Practice mode to cram everything."
              : "No cards match this filter."}
        </p>
        {mode === "review" && totalRated > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
            <span className="text-red-600 dark:text-red-400">
              Again {tally.again}
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              Hard {tally.hard}
            </span>
            <span className="text-green-600 dark:text-green-400">
              Good {tally.good}
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Easy {tally.easy}
            </span>
          </div>
        )}
        <div className="flex gap-3">
          <Button onClick={handleRestart}>Study Again</Button>
          {mode === "review" && cardCount === 0 && (
            <Button asChild variant="outline">
              <Link href={`/flashcards/study?mode=practice${category ? `&category=${category}` : ""}`}>
                Practice All
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!question) return null;

  const previews = currentCard?.intervalPreviews;

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {mode === "practice" ? (
            <Badge variant="outline" className="font-mono text-xs">
              {deck.length - deckIndex} left
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="font-mono text-xs">
                #{cardCount}
              </Badge>
              {remaining && (
                <span className="text-xs text-muted-foreground">
                  {remaining.review} to review · {remaining.new} new
                </span>
              )}
              {currentCard?.isNew && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isFlipped ? (
            mode === "review" ? (
              <>
                Rate with <span className="kbd">1</span>–
                <span className="kbd">4</span>
              </>
            ) : (
              <>
                <span className="kbd">Enter</span> next ·{" "}
                <span className="kbd">R</span> repeat
              </>
            )
          ) : (
            <>
              <span className="kbd">Space</span> to reveal
            </>
          )}
        </p>
      </div>

      {/* Card */}
      <div className="flashcard-container mb-6">
        <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Front */}
          <Card
            onClick={handleFlip}
            className={`flashcard-front cursor-pointer ${
              isFlipped ? "absolute inset-0 overflow-hidden" : "relative min-h-[280px]"
            }`}
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <Badge
                  variant="outline"
                  className={`text-xs ${getDifficultyColor(question.difficulty)}`}
                >
                  {question.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {formatCategory(question.category)}
                </Badge>
              </div>

              <div className="flex-1 flex items-center justify-center py-8">
                <h2 className="text-xl font-medium text-center leading-relaxed">
                  {question.question}
                </h2>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Click or press Space to reveal the answer
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
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {question.question}
              </p>
              <Separator className="mb-4" />

              {/* Concise answer first — the key points */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Quick Answer
                </p>
                <ul className="space-y-2.5">
                  {question.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full answer, collapsed by default */}
              <button
                onClick={() => setShowFullAnswer((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showFullAnswer ? "rotate-180" : ""
                  }`}
                />
                {showFullAnswer ? "Hide full answer" : "Show full answer"}
                <span className="kbd ml-1">A</span>
              </button>
              {showFullAnswer && (
                <div className="mt-2 pt-3 border-t">
                  <MarkdownRenderer content={question.answer} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className={`transition-all duration-300 ${
          isFlipped
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Saving...</span>
          </div>
        ) : mode === "practice" ? (
          <div className="grid grid-cols-2 gap-2">
            <PracticeButton
              label="Repeat later"
              shortcut="R"
              onClick={handlePracticeRepeat}
              variant="repeat"
            />
            <PracticeButton
              label="Next card"
              shortcut="Enter"
              onClick={handlePracticeNext}
              variant="next"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <RatingButton
              label="Again"
              sublabel={previews?.[QUALITY_BUTTONS.AGAIN] ?? "1 day"}
              shortcut="1"
              onClick={() => handleRating(QUALITY_BUTTONS.AGAIN)}
              variant="again"
            />
            <RatingButton
              label="Hard"
              sublabel={previews?.[QUALITY_BUTTONS.HARD] ?? "1 day"}
              shortcut="2"
              onClick={() => handleRating(QUALITY_BUTTONS.HARD)}
              variant="hard"
            />
            <RatingButton
              label="Good"
              sublabel={previews?.[QUALITY_BUTTONS.GOOD] ?? "1 day"}
              shortcut="3"
              onClick={() => handleRating(QUALITY_BUTTONS.GOOD)}
              variant="good"
            />
            <RatingButton
              label="Easy"
              sublabel={previews?.[QUALITY_BUTTONS.EASY] ?? "4 days"}
              shortcut="4"
              onClick={() => handleRating(QUALITY_BUTTONS.EASY)}
              variant="easy"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface RatingButtonProps {
  label: string;
  sublabel: string;
  shortcut: string;
  onClick: () => void;
  variant: "again" | "hard" | "good" | "easy";
}

function RatingButton({ label, sublabel, shortcut, onClick, variant }: RatingButtonProps) {
  const variantStyles = {
    again:
      "hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950 dark:hover:border-red-900 dark:hover:text-red-400",
    hard: "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:hover:bg-orange-950 dark:hover:border-orange-900 dark:hover:text-orange-400",
    good: "hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-950 dark:hover:border-green-900 dark:hover:text-green-400",
    easy: "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-900 dark:hover:text-blue-400",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-3 rounded-md border bg-card transition-colors ${variantStyles[variant]}`}
    >
      <span className="font-medium text-sm">
        {label} <span className="kbd ml-0.5">{shortcut}</span>
      </span>
      <span className="text-xs text-muted-foreground mt-0.5">{sublabel}</span>
    </button>
  );
}

function PracticeButton({
  label,
  shortcut,
  onClick,
  variant,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  variant: "repeat" | "next";
}) {
  const styles = {
    repeat:
      "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:hover:bg-orange-950 dark:hover:border-orange-900 dark:hover:text-orange-400",
    next: "hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-950 dark:hover:border-green-900 dark:hover:text-green-400",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 rounded-md border bg-card transition-colors ${styles[variant]}`}
    >
      <span className="font-medium text-sm">{label}</span>
      <span className="kbd">{shortcut}</span>
    </button>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
