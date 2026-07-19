// src/components/flashcard/FlashcardArena.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
  Timer,
  XCircle,
} from "lucide-react";
import type {
  QuestionCategory,
  Question,
  QuestionProgress,
  SM2Quality,
  Difficulty,
} from "@/types";
import { QUALITY_BUTTONS } from "@/types";
import { getIntervalPreviews } from "@/lib/algorithms/sm2";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  getNextStudyCard,
  answerFlashcard,
  getStudySessionStats,
} from "@/actions/flashcard.actions";
import { getQuestions } from "@/actions/question.actions";
import {
  evaluateTypedAnswer,
  type AnswerEvaluation,
  type SuggestedRating,
} from "@/actions/evaluate.actions";
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
  /**
   * Practice mode only: restrict the deck to these question ids
   * (e.g. cramming the weak spots found by a mock interview).
   */
  questionIds?: string[];
}

interface RatingTally {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

const EMPTY_TALLY: RatingTally = { again: 0, hard: 0, good: 0, easy: 0 };

/** AI grading of a typed answer, pinned to the card it was requested for */
type EvalState =
  | { questionId: string; status: "loading" }
  | { questionId: string; status: "done"; evaluation: AnswerEvaluation }
  | { questionId: string; status: "error"; error: string };

const TYPE_MODE_STORAGE_KEY = "fm-type-answers";

/**
 * Soft answer-time targets per difficulty (seconds). Interviews punish
 * rambling — the timer turns orange past the target, red past double.
 */
const ANSWER_TARGET_SECONDS: Record<Difficulty, number> = {
  junior: 60,
  mid: 90,
  senior: 120,
};

/** Writing an implementation takes longer than recalling a concept */
const CODING_TARGET_SECONDS: Record<Difficulty, number> = {
  junior: 300,
  mid: 480,
  senior: 600,
};

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * In-session relearn queue (review mode): a card rated "Again" comes back
 * after a few other cards instead of disappearing until tomorrow —
 * failed material is best re-tested minutes later, Anki-style.
 */
interface RelearnEntry {
  question: Question;
  /** Progress right after the failed review — previews derive from it */
  progress: QuestionProgress;
  /** Card loads until re-shown (decremented on every next-card load) */
  gap: number;
}

/** 4 loads = 3 other cards seen between the failure and the retry */
const RELEARN_GAP = 4;

export function FlashcardArena({
  category,
  difficulty,
  mode = "review",
  questionIds,
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

  // Type-your-answer (active recall) state
  const [typeMode, setTypeMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [evalState, setEvalState] = useState<EvalState | null>(null);

  // Soft answer timer: ticks while the front is showing, freezes on reveal
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [revealedAt, setRevealedAt] = useState<number | null>(null);

  useEffect(() => {
    setTypeMode(localStorage.getItem(TYPE_MODE_STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (isFlipped || sessionComplete || isLoading) return;
    setNowTick(Date.now());
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isFlipped, sessionComplete, isLoading]);

  useEffect(() => {
    if (isFlipped) {
      setRevealedAt((prev) => prev ?? Date.now());
    }
  }, [isFlipped]);

  // Review mode state
  const [currentCard, setCurrentCard] = useState<{
    question: Question;
    isNew: boolean;
    intervalPreviews: Record<SM2Quality, string> | null;
    relearn?: boolean;
  } | null>(null);
  const relearnRef = useRef<RelearnEntry[]>([]);
  const [relearnCount, setRelearnCount] = useState(0);
  const [remaining, setRemaining] = useState<{
    review: number;
    new: number;
    quota: { limit: number; introducedToday: number };
  } | null>(null);

  // Practice mode state
  const [deck, setDeck] = useState<Question[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);

  const question =
    mode === "practice" ? deck[deckIndex] ?? null : currentCard?.question ?? null;

  const serveRelearnCard = useCallback((entry: RelearnEntry) => {
    setRelearnCount(relearnRef.current.length);
    setCurrentCard({
      question: entry.question,
      isNew: false,
      intervalPreviews: getIntervalPreviews(entry.progress.sm2),
      relearn: true,
    });
    setStartTime(Date.now());
    setCardCount((prev) => prev + 1);
  }, []);

  const loadNextReviewCard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsFlipped(false);
    setShowFullAnswer(false);
    setTypedAnswer("");
    setEvalState(null);
    setRevealedAt(null);

    // A failed card whose spacing gap has elapsed takes priority
    if (relearnRef.current.length > 0) {
      relearnRef.current = relearnRef.current.map((e) => ({
        ...e,
        gap: e.gap - 1,
      }));
      const readyIndex = relearnRef.current.findIndex((e) => e.gap <= 0);
      if (readyIndex !== -1) {
        const [entry] = relearnRef.current.splice(readyIndex, 1);
        serveRelearnCard(entry);
        setIsLoading(false);
        return;
      }
    }

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
          quota: stats.data.newQuota,
        });
      }

      if (!result.data) {
        // Flush waiting relearn cards before ending the session
        const entry = relearnRef.current.shift();
        if (entry) {
          serveRelearnCard(entry);
          return;
        }
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
  }, [category, difficulty, serveRelearnCard]);

  const loadPracticeDeck = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsFlipped(false);
    setShowFullAnswer(false);
    setTypedAnswer("");
    setEvalState(null);
    setRevealedAt(null);

    try {
      const result = await getQuestions({
        categories: category ? [category] : undefined,
        difficulties: difficulty ? [difficulty] : undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      let cards = result.data;
      if (questionIds && questionIds.length > 0) {
        const idSet = new Set(questionIds);
        cards = cards.filter((q) => idSet.has(q.id as string));
      }

      if (cards.length === 0) {
        setSessionComplete(true);
        return;
      }

      setDeck(shuffle(cards));
      setDeckIndex(0);
      setCardCount(1);
      setStartTime(Date.now());
    } catch (err) {
      setError("Failed to load cards. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [category, difficulty, questionIds]);

  useEffect(() => {
    setSessionComplete(false);
    setCardCount(0);
    setTally(EMPTY_TALLY);
    relearnRef.current = [];
    setRelearnCount(0);
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

  const toggleTypeMode = useCallback(() => {
    setTypeMode((t) => {
      const next = !t;
      localStorage.setItem(TYPE_MODE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  /** Reveal the card and have AI grade the typed answer against the key points */
  const handleTypedSubmit = useCallback(async () => {
    const trimmed = typedAnswer.trim();
    if (!question || isSubmitting || isFlipped || !trimmed) return;

    const questionId = question.id as string;
    setIsFlipped(true);
    setShowFullAnswer(false);
    setEvalState({ questionId, status: "loading" });

    try {
      const result = await evaluateTypedAnswer(questionId, trimmed);
      // Only apply if the user hasn't already moved to another card
      setEvalState((prev) =>
        prev?.questionId === questionId && prev.status === "loading"
          ? result.success
            ? { questionId, status: "done", evaluation: result.data }
            : { questionId, status: "error", error: result.error }
          : prev,
      );
    } catch (err) {
      console.error(err);
      setEvalState((prev) =>
        prev?.questionId === questionId && prev.status === "loading"
          ? {
              questionId,
              status: "error",
              error: "AI grading failed — rate yourself below",
            }
          : prev,
      );
    }
  }, [question, isSubmitting, isFlipped, typedAnswer]);

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

        // "Again" cards come back later in this session, Anki-style
        if (quality === QUALITY_BUTTONS.AGAIN) {
          relearnRef.current = [
            ...relearnRef.current,
            {
              question: currentCard.question,
              progress: result.data.updatedProgress,
              gap: RELEARN_GAP,
            },
          ];
          setRelearnCount(relearnRef.current.length);
        }

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
    setTypedAnswer("");
    setEvalState(null);
    setRevealedAt(null);
    if (deckIndex + 1 >= deck.length) {
      setSessionComplete(true);
    } else {
      setDeckIndex((i) => i + 1);
      setCardCount((c) => c + 1);
      setStartTime(Date.now());
    }
  }, [mode, isFlipped, deckIndex, deck.length]);

  const handlePracticeRepeat = useCallback(() => {
    if (mode !== "practice" || !isFlipped) return;
    setIsFlipped(false);
    setShowFullAnswer(false);
    setTypedAnswer("");
    setEvalState(null);
    setRevealedAt(null);
    // Move the current card to the end of the deck so it comes back
    setDeck((d) => [
      ...d.slice(0, deckIndex),
      ...d.slice(deckIndex + 1),
      d[deckIndex],
    ]);
    setCardCount((c) => c + 1);
    setStartTime(Date.now());
  }, [mode, isFlipped, deckIndex]);

  const handleRestart = () => {
    setSessionComplete(false);
    setCardCount(0);
    setTally(EMPTY_TALLY);
    relearnRef.current = [];
    setRelearnCount(0);
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
    const quotaReached =
      mode === "review" &&
      remaining !== null &&
      remaining.new > 0 &&
      remaining.quota.introducedToday >= remaining.quota.limit;
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
            : mode === "review" && !quotaReached
              ? "No cards due right now. Try Practice mode to cram everything."
              : mode === "practice"
                ? "No cards match this filter."
                : ""}
          {quotaReached &&
            ` Today's ${remaining.quota.limit} new card${
              remaining.quota.limit === 1 ? " is" : "s are"
            } done — ${remaining.new} more unlock tomorrow. Practice mode is always unlimited.`}
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
          {mode === "review" && (cardCount === 0 || quotaReached) && (
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
  const isCoding = question.category === "coding-challenges";
  const elapsedSeconds = Math.max(
    0,
    Math.floor(((revealedAt ?? nowTick) - startTime) / 1000),
  );
  const targetSeconds = isCoding
    ? CODING_TARGET_SECONDS[question.difficulty]
    : ANSWER_TARGET_SECONDS[question.difficulty];
  const timerColor =
    elapsedSeconds > targetSeconds * 2
      ? "text-red-600 dark:text-red-400"
      : elapsedSeconds > targetSeconds
        ? "text-orange-600 dark:text-orange-400"
        : "text-muted-foreground";
  const activeEval =
    evalState && evalState.questionId === (question.id as string)
      ? evalState
      : null;
  const suggestedRating: SuggestedRating | null =
    mode === "review" && activeEval?.status === "done"
      ? activeEval.evaluation.suggestedRating
      : null;

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
                  {remaining.review} to review · new{" "}
                  <span className="font-mono tabular-nums">
                    {remaining.quota.introducedToday}/{remaining.quota.limit}
                  </span>{" "}
                  today
                  {relearnCount > 0 && (
                    <span className="text-orange-600 dark:text-orange-400">
                      {" "}
                      · {relearnCount} to relearn
                    </span>
                  )}
                </span>
              )}
              {currentCard?.isNew && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
              {currentCard?.relearn && (
                <Badge
                  variant="outline"
                  className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-900"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Relearn
                </Badge>
              )}
            </>
          )}
          <span
            className={`flex items-center gap-1 font-mono tabular-nums text-xs transition-colors ${timerColor}`}
            title={`Soft target ${formatElapsed(targetSeconds)} for a ${question.difficulty} question — interviews punish rambling`}
          >
            <Timer className="w-3.5 h-3.5" />
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTypeMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              typeMode
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary/50"
            }`}
            title="Type your answer before revealing — AI grades it against the key points"
          >
            <PenLine className="w-3.5 h-3.5" />
            Type answers
          </button>
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
            ) : typeMode ? (
              <>
                <span className="kbd">{isCoding ? "Ctrl+Enter" : "Enter"}</span>{" "}
                to grade
              </>
            ) : (
              <>
                <span className="kbd">Space</span> to reveal
              </>
            )}
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flashcard-container mb-6">
        <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Front */}
          <Card
            onClick={typeMode ? undefined : handleFlip}
            className={`flashcard-front overflow-hidden shadow-md ${
              typeMode ? "" : "cursor-pointer"
            } ${isFlipped ? "absolute inset-0" : "relative min-h-[280px]"}`}
          >
            <div className="h-1 bg-brand-gradient" aria-hidden />
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

              {typeMode ? (
                <>
                  <div className="py-4">
                    <h2 className="text-lg font-medium leading-relaxed">
                      {question.question}
                    </h2>
                  </div>
                  <textarea
                    key={question.id as string}
                    autoFocus
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      // Coding: Enter = newline, Ctrl+Enter = submit, Tab = indent
                      if (isCoding) {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleTypedSubmit();
                        } else if (e.key === "Tab") {
                          e.preventDefault();
                          const el = e.currentTarget;
                          const start = el.selectionStart;
                          const end = el.selectionEnd;
                          setTypedAnswer(
                            typedAnswer.slice(0, start) +
                              "  " +
                              typedAnswer.slice(end),
                          );
                          requestAnimationFrame(() => {
                            el.selectionStart = el.selectionEnd = start + 2;
                          });
                        }
                        return;
                      }
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleTypedSubmit();
                      }
                    }}
                    placeholder={
                      isCoding
                        ? "Write your implementation... (Ctrl+Enter to submit)"
                        : "Answer from memory... (Shift+Enter for a new line)"
                    }
                    rows={isCoding ? 12 : 5}
                    disabled={isFlipped}
                    className={`w-full p-3 rounded-lg border bg-background resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary ${
                      isCoding ? "font-mono text-xs" : "text-sm"
                    }`}
                    spellCheck={!isCoding}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={handleFlip}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Reveal without typing
                    </button>
                    <Button
                      size="sm"
                      onClick={handleTypedSubmit}
                      disabled={!typedAnswer.trim()}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {isCoding ? "Review my code" : "Grade my answer"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <h2 className="text-xl font-medium text-center leading-relaxed">
                      {question.question}
                    </h2>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Click or press Space to reveal the answer
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className={`flashcard-back overflow-hidden shadow-md ${
              isFlipped ? "relative min-h-[280px]" : "absolute inset-0"
            }`}
          >
            <div className="h-1 bg-brand-gradient" aria-hidden />
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {question.question}
              </p>
              <Separator className="mb-4" />

              {/* AI grading of the typed answer */}
              {activeEval?.status === "loading" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Grading your answer against the key points...
                </div>
              )}
              {activeEval?.status === "error" && (
                <p className="text-xs text-muted-foreground mb-4">
                  {activeEval.error}
                </p>
              )}
              {activeEval?.status === "done" && (
                <div className="rounded-lg border bg-secondary/30 p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      AI Verdict
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ml-auto ${getRatingColor(
                        activeEval.evaluation.suggestedRating,
                      )}`}
                    >
                      {activeEval.evaluation.suggestedRating}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {activeEval.evaluation.feedback}
                  </p>
                </div>
              )}

              {/* Concise answer first — the key points */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Quick Answer
                </p>
                <ul className="space-y-2.5">
                  {question.keyPoints.map((point, i) => {
                    const missed =
                      activeEval?.status === "done" &&
                      activeEval.evaluation.keyPointsCovered[i] === false;
                    return (
                      <li key={i} className="flex items-start gap-2.5">
                        {missed ? (
                          <XCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm leading-relaxed">{point}</span>
                      </li>
                    );
                  })}
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
              suggested={suggestedRating === "again"}
            />
            <RatingButton
              label="Hard"
              sublabel={previews?.[QUALITY_BUTTONS.HARD] ?? "1 day"}
              shortcut="2"
              onClick={() => handleRating(QUALITY_BUTTONS.HARD)}
              variant="hard"
              suggested={suggestedRating === "hard"}
            />
            <RatingButton
              label="Good"
              sublabel={previews?.[QUALITY_BUTTONS.GOOD] ?? "1 day"}
              shortcut="3"
              onClick={() => handleRating(QUALITY_BUTTONS.GOOD)}
              variant="good"
              suggested={suggestedRating === "good"}
            />
            <RatingButton
              label="Easy"
              sublabel={previews?.[QUALITY_BUTTONS.EASY] ?? "4 days"}
              shortcut="4"
              onClick={() => handleRating(QUALITY_BUTTONS.EASY)}
              variant="easy"
              suggested={suggestedRating === "easy"}
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
  suggested?: boolean;
}

function RatingButton({
  label,
  sublabel,
  shortcut,
  onClick,
  variant,
  suggested = false,
}: RatingButtonProps) {
  const variantStyles = {
    again:
      "bg-red-500/[.04] border-red-500/25 text-red-700 hover:bg-red-500/15 dark:bg-red-500/[.08] dark:text-red-400 dark:hover:bg-red-500/20",
    hard: "bg-orange-500/[.04] border-orange-500/25 text-orange-700 hover:bg-orange-500/15 dark:bg-orange-500/[.08] dark:text-orange-400 dark:hover:bg-orange-500/20",
    good: "bg-green-500/[.04] border-green-500/25 text-green-700 hover:bg-green-500/15 dark:bg-green-500/[.08] dark:text-green-400 dark:hover:bg-green-500/20",
    easy: "bg-blue-500/[.04] border-blue-500/25 text-blue-700 hover:bg-blue-500/15 dark:bg-blue-500/[.08] dark:text-blue-400 dark:hover:bg-blue-500/20",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-colors ${
        variantStyles[variant]
      } ${suggested ? "ring-2 ring-primary/60" : ""}`}
    >
      <span className="font-medium text-sm">
        {label} <span className="kbd ml-0.5">{shortcut}</span>
      </span>
      <span className="text-xs opacity-70 mt-0.5 font-mono">{sublabel}</span>
      {suggested && (
        <span className="text-[10px] font-medium text-primary mt-0.5">
          AI suggests
        </span>
      )}
    </button>
  );
}

/** Badge classes for an AI-suggested rating, matching the button semantics */
function getRatingColor(rating: SuggestedRating): string {
  switch (rating) {
    case "again":
      return "text-red-600 border-red-300 dark:text-red-400 dark:border-red-900";
    case "hard":
      return "text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-900";
    case "good":
      return "text-green-600 border-green-300 dark:text-green-400 dark:border-green-900";
    case "easy":
      return "text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-900";
  }
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
      "bg-orange-500/[.04] border-orange-500/25 text-orange-700 hover:bg-orange-500/15 dark:bg-orange-500/[.08] dark:text-orange-400 dark:hover:bg-orange-500/20",
    next: "bg-green-500/[.04] border-green-500/25 text-green-700 hover:bg-green-500/15 dark:bg-green-500/[.08] dark:text-green-400 dark:hover:bg-green-500/20",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${styles[variant]}`}
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
